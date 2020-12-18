var WebTorrent = require('webtorrent')
const https = require('https')
//var client = new WebTorrent()
var magnetURI = 'https://itorrents.org/torrent/5AC3D859E9F6A9DAF341D48A58FD96D963359A5A.torrent'

var express = require('express');
var app = express();
var fs = require("fs");

app.get('/', function(req, res) {
  res.end('hello')
})

var server = app.listen(8080, function () {
   var host = server.address().address
   var port = server.address().port
   console.log("listening at http://%s:%s", host, port)
})

var client = new WebTorrent();

app.get('/listFiles', function (req, res) {
  console.log(req.query)
  if(req.query.torrent.startsWith('magnet:')) {
      https.get('https://anonymiz.com/magnet2torrent/magnet2torrent.php?magnet='+req.query.torrent, (resp) => {
      let data = '';
      resp.on('data', (chunk) => {
        data += chunk;
      });

      resp.on('end', () => {
        console.log(JSON.parse(data).url.split('<a')[0]);
        getTorrentFiles(req, res, JSON.parse(data).url.split('<a')[0])
      });

    }).on("error", (err) => {
      console.log("Error: " + err.message);
    });
  } else {
    getTorrentFiles(req, res, req.query.torrent);
  }
})

app.get('/getData', function (req, res) {
  console.log(req.query);
  // check if client has the torrent already
  var torrent = client.get(req.query.id);
  if(torrent) {
    console.log('torrent is present', torrent);
    streamTorrentFileToResponse(req, res, torrent);
  } else {
    console.log('torrent not present in client');
    res.end('invalid torrent id');
  }
});

function streamTorrentFileToResponse(req, res, torrent) {
  var file = torrent.files[req.query.fileIndex];
  console.log(file.name);
  var range = req.headers.range;
  var total = file.length;
  if(!range) {
    range = 'bytes=0-';
  }
  var positions = range.replace(/bytes=/, "").split("-");
  var start = parseInt(positions[0], 10);
  var end = positions[1] ? parseInt(positions[1], 10) : total - 1;
  var chunksize = (end - start) + 1;
  res.writeHead(206, {
    "Content-Range": "bytes " + start + "-" + end + "/" + total,
            "Accept-Ranges": "bytes",
            "Content-Length": chunksize,
            "Content-Type": "video/mp4"
    });
  stream = file.createReadStream(
    {
      start,
      end
    }
  );
  stream.pipe(res);
}

function getTorrentFiles(req, res, torrentId) {
  client.add(torrentId, function (torrent) {
    deselctTorrentFiles(torrent);
    var response = [];
    for (i = 0; i < torrent.files.length; i++) {
      var file = torrent.files[i];
      console.log(file.name)
      response.push({
        name: file.name,
        progress: file.progress,
        id: torrent.infoHash
      });
    }
    res.end(JSON.stringify({response}))
  })
}

async function deselctTorrentFiles(torrent) {
    torrent.files.forEach(file => file.deselect());
    torrent.deselect(0, torrent.pieces.length - 1, false);
    console.log(torrent.path);
    fs.rmdir(torrent.path, function(err) {
    var rimraf = require("rimraf");
    rimraf(torrent.path, function () { console.log("deleted",torrent.path); });
    })
  }