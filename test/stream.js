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
var testStream = "http://ice1.somafm.com/groovesalad-128.mp3";

describe("handle stream data", function() {

  it("Should parse a generic stream", function(done) {

    getStreamStation(testStream, function(error, station) {
      expect(station).to.exist;
      expect(station).to.have.property('title');
      expect(station).to.have.property('fetchsource');
      expect(station).to.have.property('headers');

      expect(station.headers).to.have.property('icy-name');
      expect(station.headers).to.have.property('icy-br');
      expect(station.headers).to.have.property('content-type');

      expect(station.fetchsource).to.equal(main.StreamSource.STREAM);
      done();
    });
  });
});

describe("Handle stream redirect", function() {
  var redirectStream = "http://listen.radionomy.com:80/WitchHouseRadiodotcom";
  it("Should redirect and return valid data", function(done) {
    getStreamStation(redirectStream, function(error, station) {
      expect(station).to.exist;
      expect(station).to.have.property('title');
      done();
    });
  });
});
