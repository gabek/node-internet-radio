var request = require('request');
var parseXmlString = require('xml2js').parseString;
var parseUrl = require('node-parse-url');

DataSource = {
    SHOUTCAST_V1 : 0,
    SHOUTCAST_V2 : 1,
    STREAM : 2,
    Icecast : 3
};

var station = {};
var httpOptions = {
  timeout: 1500,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.13) Gecko/20080311 Firefox/2.0.0.13'
  }
};
function getShoutcastV1Title(url, callback) {
  url = url + "/7.html";


  var options = httpOptions;
  options.url = url;
  var res = request(options, function(error, response, body) {

    if (error) {
      console.log("SCv1 error " + error + " : " + url);
      return callback(error);
    }

    res.on('error', function(error) {
      console.log("SCv1 error " + error + " : " + url);
      res.abort();
      return callback(error);
    });

    parseV1Response(body,  callback);
  });
}

function getIcecastStation(url, callback) {
  var urlObject = parseUrl(url);
  var icecastJsonUrl = urlObject.protocol + "//" + urlObject.hostname + ":" + urlObject.port + "/status-json.xsl"

  var options = httpOptions;
  options.url = icecastJsonUrl;

  var res = request(options, function(error, response, body) {

    if (error) {
      console.log("Iceast error " + error + " : " + url);
      return callback(error);
    }

    res.on('error', function(error) {
      console.log("Icecast error " + error + " : " + url);
      res.abort();
      return callback(error);
    });

    parseIcecastResponse(url, body, callback);
  });
}


function parseV1Response(body, callback) {
  var csvArray = /<body>(.*)<\/body>/mi.exec(body)[1].split(",");
  if (csvArray && csvArray[1].length > 0) {
    var title = csvArray[6];
    title = fixTrackTitle(title);
  }

  if (title) {
    station.listeners = csvArray[0];
    station.bitrate = csvArray[5];
    station.title = title;
    station.fetchsource = "SHOUTCAST_V1";

    return callback(null, station);
  } else {
    return callback(new Error("Unable to determine current station information."));
  }
}

function parseV2Response(body, callback) {
  parseXmlString(body, function(error, result) {
    if (!error && result.SONGTITLE) {
      station.listeners = result.CURRENTLISTENERS;
      station.bitrate = result.BITRATE;
      station.title = fixTrackTitle(result.SONGTITLE);
      station.fetchsource = "SHOUTCAST_V2";
      return callback(null, station);
    } else {
      return callback(error);
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
      station.listeners = source.listeners;
      station.bitrate = source.bitrate;
      station.title = fixTrackTitle(source.title);
      station.fetchsource = "ICECAST";
      return callback(null, station);
    }
  }

  return callback((new Error("Unable to determine current station information.")));
}

// To fix any "Beatles, The" scenarios
function fixTrackTitle(trackString) {
  if (trackString.split(",").length > 1) {
    var titleArtist = trackString.split(",")[0];
    var titleSong = trackString.split(",")[1];

    // Fix the "The" issue
    if (trackString.indexOf(", The -") !== -1) {
      titleSong = trackString.split(",")[1].split(" - ")[1];
      titleArtist = "The " + titleArtist;
    }

    return titleArtist + " - " + titleSong;
  } else {
    return trackString;
  }
}

module.exports.parseV1Response = parseV1Response;
module.exports.parseV2Response = parseV2Response;
module.exports.parseIcecastResponse = parseIcecastResponse;

module.exports.getIcecastStation = getIcecastStation;
