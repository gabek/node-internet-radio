var chai = require("chai");
var expect = chai.expect;
var assert = chai.assert;

var parseRadionomyWebResponse = require("../lib/radionomy.js").parseRadionomyWebResponse;
var fs = require('fs');
var main = require("../index.js");

describe("handle radionomy data ", function() {
  it("Should parse a radionomy html file", function(done) {

    fs.readFile("test/radionomyData.html", 'utf8', function(eror, data) {
        parseRadionomyWebResponse(data, function(error, station) {
        expect(station).to.exist;
        expect(station).to.have.property('title');
        expect(station.title).to.equal('Bastille - Good Grief');
        expect(station).to.have.property('fetchsource');
        expect(station.fetchsource).to.equal(main.StreamSource.RADIONOMY);
        done();
      });
    });

  });
});
