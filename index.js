import { getIcecastStation } from './lib/icecast.js';
import { getShoutcastV1Station, getShoutcastV2Station } from './lib/shoutcast.js';
import { getStreamStation } from './lib/icystream.js';

export const StreamSource = {
  SHOUTCAST_V1: 'SHOUTCAST_V1',
  SHOUTCAST_V2: 'SHOUTCAST_V2',
  STREAM: 'STREAM',
  ICECAST: 'ICECAST'
};

export function getStationInfo(url, callback, method) {
  let methodHandler = undefined;

  switch (method) {
    case StreamSource.SHOUTCAST_V1:
      methodHandler = getShoutcastV1Station;
      break;
    case StreamSource.SHOUTCAST_V2:
      methodHandler = getShoutcastV2Station;
      break;
    case StreamSource.ICECAST:
      methodHandler = getIcecastStation;
      break;
    case StreamSource.STREAM:
      methodHandler = getStreamStation;
      break;
    default:
  }

  // If we have a specific method to fetch from then
  // attempt only that.
  if (methodHandler) {
    return methodHandler(url, callback);
  }

  // Resolve the promise from the async function and return the station with the callback
  // We shouldnt mix callbacks and promises but for backwards compatability I am breaking
  // the law here......
  return findStation(url)
    .then(station => {
      return callback(null, station);
    })
    .catch(err => {
      return callback(err);
    });

  /*
  @params -> string: url of given stream
  @returns -> mixed (object if successful, string if error)
  */
  async function findStation(url) {
    this.results = await V1(url);
    // Find which provider has our station
    if (this.results == null || typeof this.results == 'undefined') {
      this.results = await V2(url);
    }
    if (this.results == null || typeof this.results == 'undefined') {
      this.results = await Ice(url);
    }
    if (this.results == null || typeof this.results == 'undefined') {
      this.results = await Icy(url);
    }
    return this.results;

    //====================================================================================
    //=                  Promise wrapper functions                                       =
    //====================================================================================
    function V1(url) {
      return new Promise((resolve, reject) => {
        try {
          shoutcast.getShoutcastV1Station(url, function(error, station) {
            resolve(station);
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
          });
        } catch (err) {
          reject(err);
        }
      });
    }
  }
}