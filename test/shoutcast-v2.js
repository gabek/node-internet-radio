var parseV2Response = require("../index.js").parseV2Response;
var fs = require('fs');

fs.readFile("V2data.xml", 'utf8', function (eror, data) {
  parseV2Response(data, function(error, station) {
    console.log(station);
  })
});
