// This is technically not a unit test, but an integration test.
// Since it requires connecting to a raw socket to parse data I'm
// not sure how to test the functionality without actually connecting.
// On the plus side, it's more valid of a test.

var chai = require("chai");
var expect = chai.expect;
var assert = chai.assert;

var getStreamStation = require("../lib/icystream.js").getStreamStation;
var fs = require('fs');
var main = require("../index.js");
var testStream = "http://23.27.51.2:6699/";

describe("handle stream data", function() {
  it("Should parse a generic stream", function(done) {

      getStreamStation(testStream, function(error, station) {
        expect(station).to.exist;
        expect(station).to.have.property('title');
        expect(station).to.have.property('fetchsource');
        expect(station.fetchsource).to.equal(main.StreamSource.STREAM);
        done();
      });

  });
});
