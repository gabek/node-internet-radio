var chai = require("chai");
var expect = chai.expect;
var assert = chai.assert;

var parseV2Response = require("../lib/shoutcast.js").parseV2Response;
var main = require("../index.js");
var fs = require('fs');
var testUrl = "http://cheapshoutcast.com/centovacastv3-shoutcastv2-demo";

describe("handle shoutcast v2 data ", function() {
  it("Should read a Shoucast v2 metadata xml file and parse it", function(done) {

    fs.readFile("test/V2data.xml", 'utf8', function(eror, data) {
      parseV2Response(testUrl, data, function(error, station) {
        expect(station).to.exist;
        expect(station).to.have.property('title');
        expect(station).to.have.property('fetchsource');
        expect(station.fetchsource).to.equal(main.StreamSource.SHOUTCAST_V2);
        done();
      })
    });

  });
});
