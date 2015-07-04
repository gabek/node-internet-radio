var request = require('request');
var parseXmlString = require('xml2js').parseString;

//var urlparse = require('url');
//var S = require('string');

//S.extendPrototype();

DataSource = {
    SHOUTCAST_V1 : 0,
    SHOUTCAST_V2 : 1,
    STREAM : 2
};

var station = {};

function getShoutcastV1Title(url, callback) {
    url = url + "/7.html";

    var options = {
      url: url,
      timeout: 1500,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.13) Gecko/20080311 Firefox/2.0.0.13'
      }
    };

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

      parseV1Response(body, errorCallback, callback);
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
    console.log(result);
    if (!error && result.SONGTITLE) {
      var station = {};
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
