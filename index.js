var async = require('async');
var _ = require("lodash");

var icecast = require('./lib/icecast.js');
var shoutcast = require('./lib/shoutcast.js');
var icystream = require('./lib/icystream.js');


var StreamSource = {
  SHOUTCAST_V1: "SHOUTCAST_V1",
  SHOUTCAST_V2: "SHOUTCAST_V2",
  STREAM: "STREAM",
  ICECAST: "ICECAST"
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
    default:
      // No specific handler. Try them all below.
  }

  // If we have a specific method to fetch from then
  // attempt only that.
  if (methodHandler) {
    return methodHandler(url, callback);
  }

  // Otherwise try them all
  async.parallel([
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
  ], function(error, results) {
    var stations = _.compact(results);
    if (stations.length > 0) {
      var station = stations[0];
      return callback(null, station);
    } else {
      return callback(new Error("Not able to fetch station data via any available methods."));
    }
  });

  function asyncResultReturned(error, station, callback) {
    if (station) {
      return callback(true, station);
    } else {
      return callback(null, null);
    }
  }
}

module.exports.StreamSource = StreamSource;
module.exports.getStationInfo = getStationInfo;
