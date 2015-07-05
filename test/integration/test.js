// This is an integration test that can be fired manually with a station of your choice.
// It's here mostly as a troubelshooting option when working with streams.

var chai = require("chai");
var expect = chai.expect;
var assert = chai.assert;

var main = require('../../index.js');

var testStream = "http://23.27.51.2:6699";

describe("Try all available methods and return a station object.", function() {
  it("Should have applicable properties.", function(done) {

    main.getStationInfo(testStream, function(error, station) {
      expect(station).to.exist;
      expect(station).to.have.property('title');
      expect(station).to.have.property('fetchsource');
      done();
    });

  });
});
