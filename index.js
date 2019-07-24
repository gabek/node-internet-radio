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

  return findStation(url, callback)
    .then(x => {
      console.log(x);
      return x;
    })
    .catch(err => {
      console.log("Main Function Catch Block: - " + err);
    });

  async function findStation(url) {
    this.results = await V1(url);
    console.log("V1(1st) Function Returns: " + this.results);

    if (this.results == null || typeof this.results == "undefined") {
      this.results = await V2(url);
      console.log("V2(2nd) Function Returns: " + this.results);
    }
    if (this.results == null || typeof this.results == "undefined") {
      this.results = await Ice(url);
      console.log("IceCast(3rd) Function Returns: " + this.results);
    }
    if (this.results == null || typeof this.results == "undefined") {
      this.results = await Icy(url);
      console.log("IcyStream(4th) Function Returns: " + this.results);
    }

    // Promise wrapper functions
    function V1(url) {
      return new Promise((resolve, reject) => {
        try {
          shoutcast.getShoutcastV1Station(url, function(error, station) {
            resolve(station);
            return station;
          });
        } catch (err) {
          reject(err);
        }
      });
    }
    function V2(url) {
      return new Promise((resolve, reject) => {
        try {
          shoutcast.getShoutcastV2Station(url, function(error, station) {
            resolve(station);
            return station;
          });
        } catch (err) {
          reject(err);
        }
      });
    }
    function Icy(url) {
      return new Promise((resolve, reject) => {
        try {
          icystream.getStreamStation(url, function(error, station) {
            resolve(station);
            return station;
          });
        } catch (err) {
          reject(err);
        }
      });
    }
    function Ice(url) {
      return new Promise((resolve, reject) => {
        try {
          icecast.getIcecastStation(url, function(error, station) {
            resolve(station);
            return station;
          });
        } catch (err) {
          reject(err);
        }
      });
    }
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
