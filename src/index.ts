import { getIcecastStation } from './lib/icecast.js';
import { getShoutcastV1Station, getShoutcastV2Station } from './lib/shoutcast.js';
import { getStreamStation } from './lib/icystream.js';

export const StreamSource = {
  SHOUTCAST_V1: 'SHOUTCAST_V1',
  SHOUTCAST_V2: 'SHOUTCAST_V2',
  STREAM: 'STREAM',
  ICECAST: 'ICECAST'
};

export function getStationInfo(url: string, callback: (error: any, station?: any) => void, method?: string) {
  let methodHandler;

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
  async function findStation(url: string) {
    let results = await V1(url);
    // Find which provider has our station
    if (results == null || typeof results == 'undefined') {
      results = await V2(url);
    }
    if (results == null || typeof results == 'undefined') {
      results = await Ice(url);
    }
    if (results == null || typeof results == 'undefined') {
      results = await Icy(url);
    }
    return results;

    //====================================================================================
    //=                  Promise wrapper functions                                       =
    //====================================================================================
    function V1(url: string) {
      return new Promise<any>((resolve, reject) => {
        try {
          getShoutcastV1Station(url, function(error: any, station: any) {
            resolve(station);
          });
        } catch (err) {
          reject(err);
        }
      });
    }
    function V2(url: string) {
      return new Promise<any>((resolve, reject) => {
        try {
          getShoutcastV2Station(url, function(error: any, station: any) {
            resolve(station);
          });
        } catch (err) {
          reject(err);
        }
      });
    }
    function Icy(url: string) {
      return new Promise<any>((resolve, reject) => {
        try {
          getStreamStation(url, function(error: any, station: any) {
            resolve(station);
          });
        } catch (err) {
          reject(err);
        }
      });
    }
    function Ice(url: string) {
      return new Promise<any>((resolve, reject) => {
        try {
          getIcecastStation(url, function(error: any, station: any) {
            resolve(station);
          });
        } catch (err) {
          reject(err);
        }
      });
    }
  }
}