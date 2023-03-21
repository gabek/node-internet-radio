import axios from 'axios';
import { parse } from 'url';
import { fixTrackTitle } from './utils.js';

export async function getIcecastStation(url, callback) {
  const urlObject = parse(url);
  const icecastJsonUrl =
    urlObject.protocol +
    '//' +
    urlObject.hostname +
    ':' +
    urlObject.port +
    '/status-json.xsl';

  try {
    let request = await axios.get(icecastJsonUrl, {
      timeout: 1500,
      responseType: 'text',
    });

    if (response.status !== 200) {
      return callback(new Error('HTTP error.'));
    }

    const contentType = response.headers['content-type'];

    if (contentType != 'text/xml') {
      return callback(new Error('Not valid metadata'));
    }

    parseIcecastResponse(url, response.data, callback);
  }
  catch (error) {
    return callback(error);
  }
}

export function parseIcecastResponse(url, body, callback) {
  let stationObject;
  try {
    stationObject = JSON.parse(body);
  } catch (error) {
    return callback(error);
  }

  if (
    !stationObject.icestats ||
    !stationObject.icestats.source ||
    stationObject.icestats.source.length === 0
  ) {
    return callback(
      new Error('Unable to determine current station information.')
    );
  }

  const sources = stationObject.icestats.source;
  for (let i = 0, mountCount = sources.length; i < mountCount; ++i) {
    const source = sources[i];
    if (source.listenurl === url) {
      const station = {
        listeners: source.listeners,
        bitrate: source.bitrate,
        title: fixTrackTitle(source.title),
        fetchsource: 'ICECAST',
      };

      return callback(null, station);
    }
  }
  return callback(
    new Error('Unable to determine current station information.')
  );
}