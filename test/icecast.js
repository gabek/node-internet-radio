const chai = require("chai");
const expect = chai.expect;
const assert = chai.assert;

const parseIcecastResponse = require("../lib/icecast.js").parseIcecastResponse;
const fs = require('fs');
const main = require("../index.js");
const stream = "http://tomoradio.servemp3.com:8000/listen.aac";

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
