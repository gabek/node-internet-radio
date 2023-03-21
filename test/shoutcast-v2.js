import chai, { expect, assert } from 'chai';
import { parseV2Response } from '../lib/shoutcast.js';
import { StreamSource } from '../index.js';
import { readFile } from 'fs';

const testUrl = "http://cheapshoutcast.com/centovacastv3-shoutcastv2-demo";

describe("handle shoutcast v2 data ", function() {
  it("Should read a Shoucast v2 metadata xml file and parse it", function(done) {

    readFile("test/V2data.xml", 'utf8', function(eror, data) {
      parseV2Response(testUrl, data, function(error, station) {
        expect(station).to.exist;
        expect(station).to.have.property('title');
        expect(station).to.have.property('fetchsource');
        expect(station.fetchsource).to.equal(StreamSource.SHOUTCAST_V2);
        done();
      })
    });

  });
});
