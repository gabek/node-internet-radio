// This is an integration test that can be fired manually with a station of your choice.
// It's here mostly as a troubelshooting option when working with streams.
import { expect } from 'chai';
import { getStationInfo } from '../../src/index';

const testStream = "http://ice1.somafm.com/groovesalad-128.mp3";

describe("Try all available methods and return a station object.", function() {
  it("Should have applicable properties.", function(done) {

    getStationInfo(testStream, function(error, station) {
      expect(station).to.exist;
      expect(station).to.have.property('title');
      expect(station).to.have.property('fetchsource');
      done();
    });

  });
});
