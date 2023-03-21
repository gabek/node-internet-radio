const request = require('request');
const parseXmlString = require('xml2js').parseString;
const urlParser = require('url');
const utils = require('./utils.js');

function getShoutcastV1Station(url, callback) {
  url = url + '/7.html';

  const res = request(
    {
      url: url,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.13) Gecko/20080311 Firefox/2.0.0.13'
      }
    },
    function(error, response, body) {
      if (error) {
        return callback(error);
      }

      if (response.statusCode !== 200) {
        return callback(new Error('HTTP error.'));
      }

      res.on('error', function(error) {
        res.abort();
        return callback(error);
      });
      parseV1Response(body, callback);
    }
  );

  res.on('response', function(response) {
    const contentType = response.headers['content-type'];
    if (contentType != 'text/html') {
      res.abort();
      return callback(new Error('Not valid metadata'));
    }
  });
}

function getShoutcastV2Station(url, callback) {
  const urlObject = urlParser.parse(url);
  const v2StatsUrl =
    urlObject.protocol +
    '//' +
    urlObject.hostname +
    ':' +
    urlObject.port +
    '/statistics';

  const res = request(
    {
      url: v2StatsUrl
    },
    { timeout: 1500 },
    function(error, response, body) {
      if (error) {
        return callback(error);
      }

      if (response.statusCode !== 200) {
        return callback(new Error('HTTP error.'));
      }

      res.on('error', function(error) {
        res.abort();
        return callback(error);
      });

      parseV2Response(url, body, callback);
    }
  );
}

function parseV1Response(body, callback) {
  const csvArrayParsing = /<body>(.*)<\/body>/im.exec(body);

  if (!csvArrayParsing || typeof csvArrayParsing.length !== 'number') {
    return callback(null, null);
  }

  const csvArray = csvArrayParsing[1].split(',');
  let title = undefined;

  if (csvArray && csvArray.length == 7) {
    title = csvArray[6];
  } else {
    title = utils.fixTrackTitle(csvArray.slice(6).join(','));
  }

  if (title) {
    const station = {
      listeners: csvArray[0],
      bitrate: csvArray[5],
      title,
      fetchsource: 'SHOUTCAST_V1',
    };

    return callback(null, station);
  } else {
    return callback(
      new Error('Unable to determine current station information.')
    );
  }
}

function parseV2Response(url, body, callback) {
  parseXmlString(body, function(error, result) {
    if (error) {
      return callback(error);
    }
    const numberOfStreamsAvailable =
      result.SHOUTCASTSERVER.STREAMSTATS[0].STREAM.length;
    let stationStats = null;

    if (numberOfStreamsAvailable === 1) {
      stationStats = result.SHOUTCASTSERVER.STREAMSTATS[0].STREAM[0];
    } else {
      const streams = result.SHOUTCASTSERVER.STREAMSTATS[0].STREAM;
      for (let i = 0, mountCount = streams.length; i < mountCount; ++i) {
        let stream = streams[i];
        let streamUrl = stream.SERVERURL[0];
        if (streamUrl == url) {
          stationStats = stream;
        }
      }
    }
    if (!error && stationStats != null && stationStats.SONGTITLE) {
      const station = {
        listeners: stationStats.CURRENTLISTENERS[0],
        bitrate: stationStats.BITRATE[0],
        title: utils.fixTrackTitle(stationStats.SONGTITLE[0]),
        fetchsource: 'SHOUTCAST_V2',
      };
      return callback(null, station);
    } else {
      return callback(error);
    }
  });
}

module.exports.parseV1Response = parseV1Response;
module.exports.parseV2Response = parseV2Response;
module.exports.getShoutcastV1Station = getShoutcastV1Station;
module.exports.getShoutcastV2Station = getShoutcastV2Station;
