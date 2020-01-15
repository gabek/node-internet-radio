[![Circle CI](https://circleci.com/gh/gabek/node-internet-radio.svg?style=svg)](https://circleci.com/gh/gabek/node-internet-radio)


Get internet radio stream details via Node.js.
Node.js module to get Now Playing information from an internet radio stream in the form of the following object:

```
{ listeners: '89',
  bitrate: '128',
  title: 'Die Antwoord - I Fink U Freaky',
  fetchsource: 'SHOUTCAST_V1' }
```

The syntax is simple:

```
getStationInfo(url, callback, [method]);
```

## Install
```
npm install node-internet-radio
```

This Node.js module supports three different methods to fetch the station details of an internet radio stream.
All but fetching details from the raw audio stream give you the currently playing track, bitrate, and listener count.

| Method | StreamSource | Track | Bitrate | Listeners | Headers |
| ------ | ------ | -----|------- | ---------- | ---------- |
| Shoutcast V1 | StreamSource.SHOUTCAST_V1 | ✓ | ✓ | ✓ | X |
| [Shoutcast V2](http://wiki.shoutcast.com/wiki/SHOUTcast_DNAS_Server_2_XML_Reponses) | StreamSource.SHOUTCAST_V2 | ✓ | ✓ | ✓ | X |
| [Icecast](http://icecast.org/docs/icecast-2.4.1/server-stats.html) | StreamSource.ICECAST | ✓ | ✓ | ✓ | X |
| [Raw Stream (icy metadata)](http://www.smackfu.com/stuff/programming/shoutcast.html) | StreamSource.STREAM | ✓ | X | X | ✓ |

## Examples

If you have an audio stream and don't know what approach to take then simply omit the last **method** parameter
and it will use all available options and return the first one that completes.  At the very least the *stream* method
will return something from a valid stream, but it will not support the Bitrate and Listener count.

```
var internetradio = require('node-internet-radio');
var testStream = "http://23.27.51.2:6699";
internetradio.getStationInfo(testStream, function(error, station) {
  console.log(station);
});
```

While this approach is easy, it's not efficient.  You should not be hitting invalid resources and slurping down the raw audio feed each time if you don't need to.

The approach you should take is to find out what source method you want to utilize, cache it, and then only use that going forward.  Think about going through each method in order
of preference (probably V1, V2, Icecast, Stream) and take note of that for next time.

To fetch the station details using a specific method simply pass it as the last argument using one of the **StreamSource** constants above.

```
internetradio.getStationInfo("http://coolstream.net/", function(error, station) {
  console.log(station);
}, internetradio.StreamSource.SHOUTCAST_V1);
```

## Server headers
If you are interested in the server headers instead of just the now-playing information use **StreamSource.STREAM** and you'll get the server headers from the stream.

```
{ title: 'Tosca - Zuri',
  fetchsource: 'STREAM',
  headers:
   { 'icy-br': '128',
     'icy-genre': 'Ambient Chill',
     'icy-name': 'Groove Salad',
     'icy-notice1': '<BR>This stream requires <a href="http',
     'icy-notice2': 'SHOUTcast Distributed Network Audio Server/Linux v1.9.5<BR>',
     'icy-pub': '0',
     'icy-metaint': '45000' } }
```
