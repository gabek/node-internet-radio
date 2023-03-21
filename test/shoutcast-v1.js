const chai = require("chai");
const expect = chai.expect;
const assert = chai.assert;

const main = require("../index.js");
const parseV1Response = require("../lib/shoutcast.js").parseV1Response;
const v1TestData = '<HTML><meta http-equiv="Pragma" content="no-cache"></head><body>84,1,135,150,81,128,Sisters Of Mercy, The - Black Planet</body></html>';


describe("handle shoutcast v1 data ", function() {
  it("Should parse a Shoutcast v1 metadata string", function(done) {

    parseV1Response(v1TestData, function(error, station) {
      expect(station).to.exist;
      expect(station).to.have.property('title');
      expect(station).to.have.property('fetchsource');
      expect(station.fetchsource).to.equal(main.StreamSource.SHOUTCAST_V1);
      done();
    });

  });
});
