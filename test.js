var internetradio = require("./index.js");

//var testStream = "http://ice1.somafm.com/groovesalad-128.mp3";
var testStream = "http://23.227.178.146";
//var testStream = "http://andromeda.shoutca.st:8411/stream2";

internetradio.getStationInfo(testStream, function(error, station) {
  //console.log(station);
});
