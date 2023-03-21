import chai, { expect, assert } from 'chai';
import { parseIcecastResponse } from '../lib/icecast.js';
import { readFile } from 'fs';
import { StreamSource } from '../index.js';

const stream = "http://tomoradio.servemp3.com:8000/listen.aac";

describe("handle icecast data ", function() {
  it("Should parse an icecast json file", function(done) {

    readFile("test/icecastData.json", 'utf8', function(eror, data) {
      parseIcecastResponse(stream, data, function(error, station) {
        expect(station).to.exist;
        expect(station).to.have.property('title');
        expect(station).to.have.property('fetchsource');
        expect(station.fetchsource).to.equal(StreamSource.ICECAST);
        done();
      });
    });

  });
});
