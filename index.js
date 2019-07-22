var async = require("async");
var icecast = require("./lib/icecast.js");
var shoutcast = require("./lib/shoutcast.js");
var icystream = require("./lib/icystream.js");
var radionomy = require("./lib/radionomy");

var StreamSource = {
  SHOUTCAST_V1: "SHOUTCAST_V1",
  SHOUTCAST_V2: "SHOUTCAST_V2",
  STREAM: "STREAM",
  ICECAST: "ICECAST",
  RADIONOMY: "RADIONOMY"
};

function getStationInfo(url, callback, method) {
  var methodHandler = undefined;

  switch (method) {
    case StreamSource.SHOUTCAST_V1:
      methodHandler = shoutcast.getShoutcastV1Station;
      break;
    case StreamSource.SHOUTCAST_V2:
      methodHandler = shoutcast.getShoutcastV2Station;
      break;
    case StreamSource.ICECAST:
      methodHandler = icecast.getIcecastStation;
      break;
    case StreamSource.STREAM:
      methodHandler = icystream.getStreamStation;
      break;
    case StreamSource.RADIONOMY:
      methodHandler = radionomy.getRadionomyStation;
    default:
    // No specific handler. Try them all below.
  }

  // If we have a specific method to fetch from then
  // attempt only that.
  if (methodHandler) {
    return methodHandler(url, callback);
  }

  findStation(url, callback)
    .then(x => {
      console.log(x);
    })
    .catch(err => {
      console.log(err);
    });

  async function findStation(url, callback) {
    this.results = await V1(url);

    if (this.results == null || this.results == "undefined") {
      this.results = await V2(url);
    }
    if (this.results == null || this.results == "undefined") {
      this.results = await Ice(url);
    }
    if (this.results == null || this.results == "undefined") {
      this.results = await Icy(url);
    }

    // Async functions for use with Promise Wrapper functions
    function V1(url) {
      shoutcast._getShoutcastV1Station(url, function(error, station) {
        return station;
      });
    }
    function V2(url) {
      shoutcast._getShoutcastV2Station(url, function(error, station) {
        return station;
      });
    }
    function Icy(url) {
      icystream.getStreamStation(url, function(error, station) {
        return station;
      });
    }
    function Ice(url) {
      icecast._getIcecastStation(url, function(error, station) {
        return station;
      });
    }

    return this.results;
  }

  /* Otherwise try them all
  async.parallel(
    [
      function(asyncCallback) {
        shoutcast.getShoutcastV1Station(url, function(error, station) {
          asyncResultReturned(error, station, asyncCallback);
        });
      },
      function(asyncCallback) {
        shoutcast.getShoutcastV2Station(url, function(error, station) {
          asyncResultReturned(error, station, asyncCallback);
        });
      },
      function(asyncCallback) {
        icecast.getIcecastStation(url, function(error, station) {
          asyncResultReturned(error, station, asyncCallback);
        });
      },
      function(asyncCallback) {
        icystream.getStreamStation(url, function(error, station) {
          asyncResultReturned(error, station, asyncCallback);
        });
      }
    ],
    function(error, results) {
      var stations = [];
      if (Array.isArray(results)) {
        stations = results.filter(Boolean);
      }
      if (stations.length > 0) {
        var station = stations[0];
        return callback(null, station);
      } else {
        return callback(
          new Error("Not able to fetch station data via any available methods.")
        );
      }
    }
  );

  function asyncResultReturned(error, station, callback) {
    if (station) {
      return callback(true, station);
    } else {
      return callback(null, null);
    }
  }*/
}

module.exports.StreamSource = StreamSource;
module.exports.getStationInfo = getStationInfo;
