var parseV1Response = require("../index.js").parseV1Response;
var v1TestData = '<HTML><meta http-equiv="Pragma" content="no-cache"></head><body>84,1,135,150,81,128,Front Line Assembly - Transmitter (Come Together)</body></html>';

var v1Result = parseV1Response(v1TestData, function(error, station) {
  console.log(station);  
});
