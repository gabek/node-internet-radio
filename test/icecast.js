var chai = require("chai");
var expect = chai.expect;
var assert = chai.assert;

var parseIcecastResponse = require("../lib/icecast.js").parseIcecastResponse;
var fs = require('fs');
var main = require("../index.js");
var stream = "http://tomoradio.servemp3.com:8000/listen.aac";

describe("handle icecast data ", function() {
  it("Should parse an icecast json file", function(done) {

    fs.readFile("test/icecastData.json", 'utf8', function(eror, data) {
      parseIcecastResponse(stream, data, function(error, station) {
        expect(station).to.exist;
        expect(station).to.have.property('title');
        expect(station).to.have.property('fetchsource');
        expect(station.fetchsource).to.equal(main.StreamSource.ICECAST);
        done();
      });
    });

  });
});
