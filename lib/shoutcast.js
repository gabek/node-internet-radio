var request = require('request');
var parseXmlString = require('xml2js').parseString;
var parseUrl = require('node-parse-url');

function getShoutcastV1Title(url, callback) {
  url = url + "/7.html";

  var res = request({
    url: url
  }, function(error, response, body) {

    if (error) {
      console.log("SCv1 error " + error + " : " + url);
      return callback(error);
    }

    res.on('error', function(error) {
      console.log("SCv1 error " + error + " : " + url);
      res.abort();
      return callback(error);
    });

    parseV1Response(body, callback);
  });
}

function getShoutcastV2Title(url, callback) {
  var urlObject = parseUrl(url);
  var v2StatsUrl = urlObject.protocol + "//" + urlObject.hostname + ":" + urlObject.port + "/statistics";

  var res = request({
    url: v2StatsUrl
  }, function(error, response, body) {

    if (error) {
      console.log("V2 error " + error + " : " + url);
      return callback(error);
    }

    res.on('error', function(error) {
      console.log("V2 error " + error + " : " + url);
      res.abort();
      return callback(error);
    });

    parseV2Response(url, body, callback);
  });
}

function parseV1Response(body, callback) {
  var csvArray = /<body>(.*)<\/body>/mi.exec(body)[1].split(",");
  if (csvArray && csvArray[1].length > 0) {
    var title = csvArray[6];
  }

  if (title) {
    var station = {};
    station.listeners = csvArray[0];
    station.bitrate = csvArray[5];
    station.title = title;
    station.fetchsource = "SHOUTCAST_V1";

    return callback(null, station);
  } else {
    return callback(new Error("Unable to determine current station information."));
  }
}

function parseV2Response(url, body, callback) {
  parseXmlString(body, function(error, result) {
    var numberOfStreamsAvailable = result.SHOUTCASTSERVER.STREAMSTATS[0].STREAM.length;
    var stationStats = null;

    if (numberOfStreamsAvailable === 1) {
      stationStats = result.SHOUTCASTSERVER.STREAMSTATS[0].STREAM[0];
    } else {
      var streams = result.SHOUTCASTSERVER.STREAMSTATS[0].STREAM;
      for (var i = 0, mountCount = streams.length; i < mountCount; i++) {
        var stream = streams[i];
        var streamUrl = stream.SERVERURL[0];
        if (streamUrl == url) {
          stationStats = stream;
        }

      }
    }
    if (!error && stationStats.SONGTITLE) {
      var station = {};
      station.listeners = stationStats.CURRENTLISTENERS[0];
      station.bitrate = stationStats.BITRATE[0];
      station.title = stationStats.SONGTITLE[0];
      station.fetchsource = "SHOUTCAST_V2";
      return callback(null, station);
    } else {
      return callback(error);
    }
  });
}

module.exports.parseV1Response = parseV1Response;
module.exports.parseV2Response = parseV2Response;