var parseIcecastResponse = require("../index.js").parseIcecastResponse;
var fs = require('fs');
var stream = "http://tomoradio.servemp3.com:8000/listen.aac";

fs.readFile("icecastData.json", 'utf8', function (eror, data) {
  parseIcecastResponse(stream, data, function(error, station) {
    console.log(station);
  })
});

// Uncomment if you wish to run an integration test against this specific server
// var getIcecastStation = require("../index.js").getIcecastStation;
// getIcecastStation("http://tomoradio.servemp3.com:8000/listen.aac", function(error, station) {
//   console.log(station);
// });
