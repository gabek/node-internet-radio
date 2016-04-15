var urlParser = require('url');
var net = require('net');
var utils = require("./utils.js");

var packageJson = require('../package.json');
var versionNumber = packageJson.version;
var clientName = "node-internet-radio v" + versionNumber;

function getStreamStation(url, callback) {
  var urlString = url;
  var completed = false;
  var buffer = "";
  var maxBufferSize = 100000;

  // Failure timer
  var timeout = setTimeout(function() {
    tearDown();
    return callback(new Error("Attempting to fetch station data via stream timed out."));
  }, 5000);

  var url = urlParser.parse(url);
  var client = new net.Socket();
  client.setTimeout(5);
  client.setEncoding('utf8');

  var port = url.port || 80;
  var getString = "GET " + url.path + " HTTP/1.0\r\n\Icy-Metadata: 1\r\nUser-Agent: " + clientName + "\r\nhost: " + url.hostname + "\r\n\r\n";
  client.connect(port, url.hostname, function() {
    client.write(getString);
  });

  var dataCallback = function(response) {
    var title = null;

    // Append to the buffer and check if our title is fully included yet
    // We're looking for a string with the format of
    // StreamTitle=Artist Name - Song Name;
    buffer += response;

    var titlecheck = getDetailsFromBuffer(buffer);
    if (titlecheck != null) {
      handleBuffer(buffer, callback);
      tearDown();
      return;
    }

    if (buffer.length > maxBufferSize) {
      return returnError();
    }
  };

  var errorCallback = function(error) {
    if (completed) {
      return;
    }
    tearDown();
    console.log(error);
    return callback(error)
  };

  var closeCallback = function() {
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
      client.destroy()
      client = null;
    }
  }

  function getDetailsFromBuffer(buffer) {
    var startSubstring = "StreamTitle=";
    var startPosition = buffer.indexOf(startSubstring);
    var endSubstring = ";";
    var endPosition = buffer.toString().indexOf(";", startPosition);

    if (startPosition > -1 && endPosition > startPosition) {
      var titleString = buffer.substring(startPosition, endPosition);
      var title = titleString.substring(13, titleString.length - 1);
      return title;
    }

    return null;
  }

  function getHeadersFromBuffer(buffer) {
    var headersArray = buffer.split("\n");
    var headersObject = {};

    headersArray.filter(function(line) {
      return ((line.indexOf("icy") !== -1 && line.indexOf(":") !== -1) || line.toLowerCase().indexOf("content-type") !== -1)
    }).forEach(function(line) {
      var keyValueArray = line.trim().split(":");
      headersObject[keyValueArray[0].toLowerCase()] = keyValueArray[1].trim();
    });

    return headersObject;
  }

  function handleBuffer(buffer, callback) {
    var title = getDetailsFromBuffer(buffer);
    title = utils.fixTrackTitle(title)

    var headers = getHeadersFromBuffer(buffer);

    var station = {};
    station.title = title;
    station.fetchsource = "STREAM";
    station.headers = headers

    return callback(null, station);
  }

  function handleRedirect(buffer) {
    var redirectTest = /Location: (.*)/m.exec(buffer);
    if (redirectTest) {
      // Redirect!
      var newUrl = redirectTest[1];
      console.log("Redirect: " + urlString + " to: " + newUrl);
      return newUrl;
    }

    return false
  }

  function areThereErrors(buffer) {
    // If we get back HTML there's a problem
    var contentTypeTest = /Content-Type: text\/html(.*)/m.exec(buffer);
    if (contentTypeTest) {
      return true;
    }

    return false
  }

  function returnError() {
    tearDown();
    return callback(new Error("Error fetching stream"));
  }

  client.on('data', dataCallback);
  client.on('error', errorCallback);
  client.on('close', closeCallback);
}

module.exports.getStreamStation = getStreamStation;
