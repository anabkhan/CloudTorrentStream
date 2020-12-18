var WebTorrent = require('webtorrent')
const https = require('https')
var client = new WebTorrent()
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

app.get('/listFiles', function (req, res) {
  console.log(req.query)
  if(req.query.torrent.startsWith('magnet:')) {
      getTorrentFileLink(req.query.torrent, (torrentLink) => {
        getTorrentFiles(req, res, torrentLink);
      })
  } else {
    getTorrentFiles(req, res, req.query.torrent);
  }
})

function getTorrentFileLink(magnetStr, onSuccess) {
  https.get('https://anonymiz.com/magnet2torrent/magnet2torrent.php?magnet='+magnetStr, (resp) => {
      let data = '';
      resp.on('data', (chunk) => {
        data += chunk;
      });

      resp.on('end', () => {
        console.log('respone for '+magnetStr,JSON.parse(data))
        console.log(JSON.parse(data).url.split('<a')[0]);
        onSuccess(JSON.parse(data).url.split('<a')[0]);
      });

    }).on("error", (err) => {
      console.log("Error: " + err.message);
    });
}

app.get('/getData', function (req, res) {
  console.log(req.query);
  // check if client has the torrent already
  var id  = req.query.id;
  var fileIndex = req.query.fileIndex;
  var torrent = client.get(id);
  var fileName = req.query.filename;
  if(torrent) {
    console.log('torrent is present');
    streamTorrentFileToResponse(req, res, torrent, fileIndex, fileName);
  } else {
    console.log('torrent not present in client');
    // res.end('invalid torrent id');
    getTorrentFileLink('magnet:?xt=urn:btih:'+id.toUpperCase(), (torrentLink) => {
      client.add(torrentLink, function (torrent) {
        deselctTorrentFiles(torrent);
        streamTorrentFileToResponse(req, res, torrent, fileIndex, fileName);
      })      
    })
  }
});

function streamTorrentFileToResponse(req, res, torrent, fileIndex, fileName) {
  console.log('check with fileName = ', fileName)
  if(fileName) {
    fileName = fileName.trim().replaceAll(' ','');
    for (i = 0; i < torrent.files.length; i++) {
      var file = torrent.files[i];
      console.log('checking fileName',file.name)
      if(file.name.trim().replaceAll(' ','') === fileName) {
        console.log('fileIndex found at',i);
        fileIndex = i;
        break;
      }
    }
  }
  var file = torrent.files[fileIndex];
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
  var rimraf = require("rimraf");
  rimraf(torrent.path, function () { console.log("deleted",torrent.path); });
}