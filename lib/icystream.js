var urlParser = require('url');
const tls = require('tls');
const net = require('net');
var utils = require('./utils.js');

var packageJson = require('../package.json');
var versionNumber = packageJson.version;
var clientName = 'node-internet-radio v' + versionNumber;

function getStreamStation(url, callback) {
  var urlString = url;
  var completed = false;
  var buffer = '';
  var maxBufferSize = 100000;

  // Failure timer
  var timeout = setTimeout(function () {
    tearDown();
    return callback(
      new Error('Attempting to fetch station data via stream timed out.')
    );
  }, 5000);

  var url = urlParser.parse(url);
  var headers =
    'Icy-Metadata: 1\r\nUser-Agent: ' +
    clientName +
    '\r\nhost: ' +
    url.hostname +
    '\r\n';

  // Support HTTP Basic auth via Username:Password@host url syntax
  if (url.auth) {
    var encodedAuth = new Buffer(url.auth).toString('base64');
    headers += 'Authorization: Basic ' + encodedAuth + '\r\n';
  }

  var getString = 'GET ' + url.path + ' HTTP/1.0\r\n' + headers + '\r\n\r\n';

  if (url.protocol === 'http:') {
    var port = url.port || 80;

    var client = new net.Socket();
    client.setTimeout(5);
    client.setEncoding('utf8');
    client.connect(port, url.hostname, function () {
      client.write(getString);
    });
  } else if (url.protocol === 'https:') {
    var port = url.port || 443;
    var client = tls.connect(
      port,
      url.hostname,
      { ecdhCurve: false, servername: url.hostname },
      function () {
        client.write(getString);
      }
    );
  } else {
    const error = new Error(
      'Unknown protocol: ' + url.protocol + '. Unable to fetch stream.'
    );
    return errorCallback(error);
  }

  client.on('data', dataCallback);
  client.on('error', errorCallback);
  client.on('close', closeCallback);

  function dataCallback(response) {
    var title = null;
    const responseString = response.toString();

    // Append to the buffer and check if our title is fully included yet
    // We're looking for a string with the format of
    // StreamTitle=Artist Name - Song Name;
    buffer += responseString;

    var titlecheck = getDetailsFromBuffer(buffer);
    if (titlecheck != null) {
      handleBuffer(buffer, callback);
      tearDown();
      return;
    }

    if (buffer.length > maxBufferSize) {
      return returnError();
    }
  }

  function errorCallback(error) {
    if (completed) {
      return;
    }
    tearDown();
    console.trace(error);
    return callback(error);
  }

  function closeCallback() {
    var redirectUrl = handleRedirect(buffer);

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
    buffer = null;

    if (client != null) {
      client.destroy();
      client = null;
    }
  }

  function getDetailsFromBuffer(buffer) {
    var startSubstring = 'StreamTitle=';
    var startPosition = buffer.indexOf(startSubstring);
    var endSubstring = ';';
    var endPosition = buffer.toString().indexOf(';', startPosition);

    if (startPosition > -1 && endPosition > startPosition) {
      var titleString = buffer.substring(startPosition, endPosition);
      var title = titleString.substring(13, titleString.length - 1);
      return title;
    }

    return null;
  }

  function getHeadersFromBuffer(buffer) {
    var headersArray = buffer.split('\n');
    var headersObject = {};

    headersArray
      .filter(function (line) {
        return (
          (line.indexOf('icy') !== -1 && line.indexOf(':') !== -1) ||
          line.toLowerCase().indexOf('content-type') !== -1
        );
      })
      .forEach(function (line) {
        var keyValueArray = line.trim().split(":");
        if (keyValueArray.length === 2) {
          headersObject[keyValueArray[0].toLowerCase()] = keyValueArray[1].trim();
        }
      });

    return headersObject;
  }

  function handleBuffer(buffer, callback) {
    var title = getDetailsFromBuffer(buffer);
    title = utils.fixTrackTitle(title);

    var headers = getHeadersFromBuffer(buffer);

    var station = {};
    station.title = title;
    station.fetchsource = 'STREAM';
    station.headers = headers;

    return callback(null, station);
  }

  function handleRedirect(buffer) {
    var redirectTest = /Location: (.*)/mi.exec(buffer);
    if (redirectTest) {
      // Redirect!
      var newUrl = redirectTest[1];

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

  function areThereErrors(buffer) {
    // If we get back HTML there's a problem
    var contentTypeTest = /Content-Type: text\/html(.*)/m.exec(buffer);
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

module.exports.getStreamStation = getStreamStation;
