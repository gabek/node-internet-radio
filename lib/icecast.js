var request = require('request');
var parseXmlString = require('xml2js').parseString;
var urlParser = require('url');
var utils = require("./utils.js");

function getIcecastStation(url, callback) {
  var urlObject = urlParser.parse(url);
  var icecastJsonUrl = urlObject.protocol + "//" + urlObject.hostname + ":" + urlObject.port + "/status-json.xsl"

  var res = request({
    url: icecastJsonUrl
  }, function(error, response, body) {

    if (error) {
      return callback(error);
    }

    if (response.statusCode !== 200) {
      return callback(new Error("HTTP error."))
    }

    res.on('error', function(error) {
      res.abort();
      return callback(error);
    });

    parseIcecastResponse(url, body, callback);
  });

  res.on("response", function(response) {
    var contentType = response.headers["content-type"];
    if (contentType != "text/xml") {
      res.abort();
      return callback(new Error("Not valid metadata"))
    }
  });
}

function parseIcecastResponse(url, body, callback) {
  try {
    var stationObject = JSON.parse(body);
  } catch (error) {
    return callback(error);
  }

  if (!stationObject.icestats || !stationObject.icestats.source || stationObject.icestats.source.length === 0) {
    return callback(new Error("Unable to determine current station information."));
  }

  var sources = stationObject.icestats.source;
  for (var i = 0, mountCount = sources.length; i < mountCount; i++) {
    var source = sources[i];
    if (source.listenurl === url) {
      var station = {};
      station.listeners = source.listeners;
      station.bitrate = source.bitrate;
      station.title = utils.fixTrackTitle(source.title);
      station.fetchsource = "ICECAST";

      return callback(null, station);
    }
  }
  return callback((new Error("Unable to determine current station information.")));
}

module.exports.parseIcecastResponse = parseIcecastResponse;
module.exports.getIcecastStation = getIcecastStation;
