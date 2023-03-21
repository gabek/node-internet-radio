import axios from 'axios';
import { parseString as parseXmlString } from 'xml2js';
import { parse } from 'url';
import { fixTrackTitle } from './utils.js';

export async function getShoutcastV1Station(url, callback) {
  url = url + '/7.html';

  try {
    const response = await axios.get(url,
      {
        responseType: 'text',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.13) Gecko/20080311 Firefox/2.0.0.13'
        }
      });

      if (response.status !== 200) {
        return callback(new Error('HTTP error.'));
      }

      const contentType = response.headers['content-type'];

      if (contentType != 'text/html') {
        return callback(new Error('Not valid metadata'));
      }

      parseV1Response(response.data, callback);
  } catch (error) {
    return callback(error);
  }
}

export async function getShoutcastV2Station(url, callback) {
  const urlObject = parse(url);
  const v2StatsUrl =
    urlObject.protocol +
    '//' +
    urlObject.hostname +
    ':' +
    urlObject.port +
    '/statistics';

  try {
    const response = await axios.get( v2StatsUrl,
      {
        url: v2StatsUrl,
        timeout: 1500
      });

    if (response.status !== 200) {
      return callback(new Error('HTTP error.'));
    }
    
    parseV2Response(url, body, callback);
  } catch (error) {
    return callback(error);
  }
}

export function parseV1Response(body, callback) {
  const csvArrayParsing = /<body>(.*)<\/body>/im.exec(body);

  if (!csvArrayParsing || typeof csvArrayParsing.length !== 'number') {
    return callback(null, null);
  }

  const csvArray = csvArrayParsing[1].split(',');
  let title = undefined;

  if (csvArray && csvArray.length == 7) {
    title = csvArray[6];
  } else {
    title = fixTrackTitle(csvArray.slice(6).join(','));
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

export function parseV2Response(url, body, callback) {
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
        title: fixTrackTitle(stationStats.SONGTITLE[0]),
        fetchsource: 'SHOUTCAST_V2',
      };
      return callback(null, station);
    } else {
      return callback(error);
    }
  });
}