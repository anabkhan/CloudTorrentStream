var torrentStream = require('torrent-stream');
const parseTorrent = require('parse-torrent')
const https = require('https')

var express = require('express');
var app = express();

app.get('/', function(req, res) {
  res.end('hello')
})

var server = app.listen(8080, function () {
   var host = server.address().address
   var port = server.address().port
   console.log("listening at http://%s:%s", host, port)
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

var engines = {};

app.get('/getData', function (req, res) {
  console.log(req.query);
  var id  = req.query.id;
  var fileIndex = req.query.fileIndex;
  var fileName = req.query.fileName;
  fileName = fileName.trim().replace(/ /g,'');
  var engine = engines[id];
  if(engine) {
    streamTorrentFileToResponse(req, res, fileName, engine);
  } else {
    getTorrentFileLink('magnet:?xt=urn:btih:'+id.toUpperCase(), (torrentLink) => {
      console.log('torrent link', torrentLink);
      parseTorrent.remote(torrentLink, { timeout: 60 * 1000 }, (err, parsedTorrent) => {
        if (err) throw err
        engine = torrentStream(parsedTorrent);
        engines[id] = engine;
        engine.on('ready', function() {
          streamTorrentFileToResponse(req, res, fileName, engine);
        });
      })  
    });
  }
});

function streamTorrentFileToResponse(req, res, fileName, engine) {
  console.log(engine.files)
  var file;
  for (i = 0; i < engine.files.length; i++) {
      var eachFile = engine.files[i];
      console.log('checking fileName',eachFile.name)
      if(eachFile.name.trim().replace(/ /g,'') === fileName) {
      console.log('fileIndex found at',i);
      file = eachFile;
      break;
    }
  }
  console.log(file.length);
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
  var stream = file.createReadStream(
    {
      start,
      end
    }
  );
  stream.pipe(res);
  req.on("close", function() {
    console.log('request closed');
    stream.destroy();
    var rimraf = require("rimraf");
    rimraf(engine.path, function () { console.log("deleted",engine.path); });
    rimraf(engine.path, function () { console.log("deleted",engine.path); });
  });
}