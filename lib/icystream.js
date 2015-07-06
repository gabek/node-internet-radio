var parseUrl = require('node-parse-url');
var net = require('net');

function getStreamStation(url, callback) {

  var completed = false;
  var buffer = "";

  // Failure timer
  var timeout = setTimeout(function() {
    tearDown();
    return callback(new Error("Attempting to fetch station data via stream timed out."));
  }, 5000);

  var url = parseUrl(url);
  var client = new net.Socket();
  client.setTimeout(2);
  client.setEncoding('utf8');

  var port = url.port || 80;
  var getString = "GET " + url.path + " HTTP/1.0\r\n\Icy-Metadata: 1\r\nUser-Agent: Winamp 2.8\r\nhost: " + url.hostname + ":" + url.port + "\r\n\r\n";
  client.connect(port, url.hostname, function() {
    client.write(getString);
  });

  var dataCallback = function(response) {
    var title = null;
    
    // Append to the buffer and check if our title is fully included yet
    // We're looking for a string with the format of
    // StreamTitle=Artist Name - Song Name;
    buffer += response;
    var startSubstring = "StreamTitle=";
    var startPosition = buffer.indexOf(startSubstring);
    var endSubstring = ";";
    var endPosition = buffer.toString().indexOf(";", startPosition);

    if (startPosition > -1 && endPosition > startPosition) {
      tearDown();
      var titleString = buffer.substring(startPosition, endPosition);
      title = titleString.substring(13, titleString.length - 1);
      return handleTitle(title, callback);
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
    if (completed) {
      return;
    }
    tearDown();
  }

  function tearDown() {
    clearTimeout(timeout);

    completed = true;
    if (client != null) {
      client.destroy()
      client = null;
    }
  }

  function handleTitle(title, callback) {
    var station = {};
    station.title = title;
    station.fetchsource = "STREAM";
    return callback(null, station);
  }

  client.on('data', dataCallback);
  client.on('error', errorCallback);
  client.on('close', closeCallback);
}

module.exports.getStreamStation = getStreamStation;
