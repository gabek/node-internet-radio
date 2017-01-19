/**
 * Created by gabek on 1/19/17.
 */

const request = require('request');
const cheerio = require("cheerio");
const utils = require("./utils.js");

function getRadionomyStation(url, callback) {
    // Convert a stream url to a public web page
    const stationName = url.split('/').last();
    const publicWebPage = 'http://www.radionomy.com/en/radio/' + stationName;

    var res = request({
        url: publicWebPage,
        followAllRedirects: true,
        jar: true,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.13) Gecko/20080311 Firefox/2.0.0.13'
        }
    }, function(error, response, body) {
        if (error) {
            return callback(error);
        }

        if (response.statusCode !== 200) {
            return callback(new Error("HTTP error."))
        }

        parseRadionomyWebResponse(body, callback);
    });
}

function parseRadionomyWebResponse(body, callback) {
    const $ = cheerio.load(body);
    const artists = $('.tracklistInfo .artist').toArray();
    const artist = $(artists[0]).text();
    const track = $(artists[0]).next('p').text();

    const title = artist + ' - ' + track;

    if (title) {
        var station = {};
        station.title = title;
        station.fetchsource = "RADIONOMY";

        return callback(null, station);
    } else {
        return callback(new Error("Unable to determine current station information."));
    }
}

module.exports.parseRadionomyWebResponse = parseRadionomyWebResponse;
module.exports.getRadionomyStation = getRadionomyStation;


if (!Array.prototype.last){
    Array.prototype.last = function(){
        return this[this.length - 1];
    };
};