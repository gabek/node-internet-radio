import { parse } from 'url';
import { TLSSocket, connect } from 'tls';
import { Socket } from 'net';
import { fixTrackTitle } from './utils.js';
import packageJson from '../../package.json';

const version = packageJson.version;
const clientName = 'node-internet-radio v' + version;

export function getStreamStation(url: string, callback: (error: any, station?: any) => void) {
  const urlString = url;
  let completed = false;
  let buffer = '';
  const maxBufferSize = 100000;

  // Failure timer
  const timeout = setTimeout(function () {
    tearDown();
    return callback(
      new Error('Attempting to fetch station data via stream timed out.')
    );
  }, 5000);

  const parsedUrl = parse(url);
  let headers =
    'Icy-Metadata: 1\r\nUser-Agent: ' +
    clientName +
    '\r\nhost: ' +
    parsedUrl.hostname +
    '\r\n';

  // Support HTTP Basic auth via Username:Password@host url syntax
  if (parsedUrl.auth) {
    const encodedAuth = new Buffer(parsedUrl.auth).toString('base64');
    headers += 'Authorization: Basic ' + encodedAuth + '\r\n';
  }

  let getString = 'GET ' + parsedUrl.path + ' HTTP/1.0\r\n' + headers + '\r\n\r\n';
  let client: Socket | TLSSocket | null;

  if (parsedUrl.protocol === 'http:') {
    const port = Number(parsedUrl.port) || 80;

    client = new Socket();
    client.setTimeout(5);
    client.setEncoding('utf8');
    client.connect(port, parsedUrl.hostname as string, function () {
      client && client.write(getString);
    });
  } else if (parsedUrl.protocol === 'https:') {
    const port = Number(parsedUrl.port) || 443;
    client = connect(
      port,
      parsedUrl.hostname as string,
      { ecdhCurve: "auto", servername: parsedUrl.hostname as string },
      function () {
        client && client.write(getString);
      }
    );
  } else {
    const error = new Error(
      'Unknown protocol: ' + parsedUrl.protocol + '. Unable to fetch stream.'
    );
    return errorCallback(error);
  }

  client.on('data', dataCallback);
  client.on('error', errorCallback);
  client.on('close', closeCallback);

  function dataCallback(response: any) {
    const responseString = response.toString();

    // Append to the buffer and check if our title is fully included yet
    // We're looking for a string with the format of
    // StreamTitle=Artist Name - Song Name;
    buffer += responseString;

    const titlecheck = getDetailsFromBuffer(buffer);
    if (titlecheck != null) {
      handleBuffer(buffer, callback);
      tearDown();
      return;
    }

    if (buffer.length > maxBufferSize) {
      return returnError();
    }
  }

  function errorCallback(error: any) {
    if (completed) {
      return;
    }
    tearDown();
    console.trace(error);
    return callback(error);
  }

  function closeCallback() {
    const redirectUrl = handleRedirect(buffer);

    if (redirectUrl) {
      tearDown();
      return getStreamStation(redirectUrl, callback);
    }

    if (areThereErrors(buffer)) {
      return returnError();
    }

    if (completed) {
      return;
    }
  }

  function tearDown() {
    clearTimeout(timeout);

    completed = true;
    buffer = '';

    if (client != null) {
      client.destroy();
      client = null;
    }
  }

  function getDetailsFromBuffer(buffer: any) {
    const startSubstring = 'StreamTitle=';
    const startPosition = buffer.indexOf(startSubstring);
    const endPosition = buffer.toString().indexOf(';', startPosition);

    if (startPosition > -1 && endPosition > startPosition) {
      let titleString = buffer.substring(startPosition, endPosition);
      let title = titleString.substring(13, titleString.length - 1);
      return title;
    }

    return null;
  }

  function getHeadersFromBuffer(buffer: string) {
    let headersArray = buffer.split('\n');
    let headersObject: {[index: string]: string} = {};

    headersArray
      .filter(function (line) {
        return (
          (line.indexOf('icy') !== -1 && line.indexOf(':') !== -1) ||
          line.toLowerCase().indexOf('content-type') !== -1
        );
      })
      .forEach(function (line) {
        let keyValueArray = line.trim().split(":", 2);
        if (keyValueArray.length === 2) {
          headersObject[keyValueArray[0].toLowerCase()] = keyValueArray[1].trim();
        }
      });

    return headersObject;
  }

  function handleBuffer(buffer: string, callback: (error: any, station?: any) => void) {
    let title = getDetailsFromBuffer(buffer);
    title = fixTrackTitle(title);

    const headers = getHeadersFromBuffer(buffer);

    const station = {
      title,
      fetchsource: 'STREAM',
      headers,
    };

    return callback(null, station);
  }

  function handleRedirect(buffer: string) {
    const redirectTest = /Location: (.*)/mi.exec(buffer);
    if (redirectTest) {
      // Redirect!
      const newUrl = redirectTest[1];

      if (newUrl === urlString) {
        const error = new Error(
          'Redirect loop detected. ' + urlString + ' -> ' + newUrl
        );
        return errorCallback(error);
      }

      return newUrl;
    }

    return false;
  }

  function areThereErrors(buffer: string) {
    // If we get back HTML there's a problem
    const contentTypeTest = /Content-Type: text\/html(.*)/m.exec(buffer);
    if (contentTypeTest) {
      return true;
    }

    return false;
  }

  function returnError() {
    tearDown();
    return callback(new Error('Error fetching stream'));
  }
}