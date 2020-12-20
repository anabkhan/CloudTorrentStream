// var schedule = require('node-schedule');
// var date = new Date();
//         // date += (24 * 60 * 60 * 1000);
//         console.log(date)
//         newDate = new Date(date.getTime() + 5000);
//         console.log(newDate)
//         var j = schedule.scheduleJob(newDate, function() {
//           console.log('Deleting files on schedule');
//           j.cancel();
//         });
//         console.log('j',j);
var torrentStream = require('./torrent-stream');
const parseTorrent = require('parse-torrent')
const https = require('https')
var schedule = require('node-schedule');
var rimraf = require("rimraf");

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
        var date = new Date();
        // date += (24 * 60 * 60 * 1000);
        date += (1 * 60 * 1000);
        var j = schedule.scheduleJob(date, function() {
          console.log('Deleting files on schedule');
          rimraf(engine.path, function () { console.log("deleted",engine.path); });
          rimraf(engine.path, function () { console.log("deleted",engine.path); });
          engine.destroy();
          engines[id] = null;
        });
        console.log('schedule task', j);
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
            "Content-Type": "video/" + fileName.split('.').pop()
    });
  // var stream = file.createReadStream(
  //   {
  //     start,
  //     end
  //   }
  // );

  var offset = start + file.offset;
  var pieceLength = engine.torrent.pieceLength;
  startPiece = (offset / pieceLength) | 0;
  _piece = startPiece;
  console.log('start-piece',startPiece);
  pieces = {};
  _critical = Math.min(1024 * 1024 / pieceLength, 2) | 0;
  _waitingFor = -1;
  _offset = offset - this.startPiece * pieceLength;
  console.log('_offset', _offset);

  const { Readable } = require('stream'); 

  const stream = new Readable({
    read() {
      // read requested
      console.log('read requested for ', _piece);
      var piece = pieces[_piece];
      console.log('piece fetched',piece);
      console.log('piece length',pieces.length);
      if(piece) {
        if (_offset) {
          piece = piece.slice(_offset)
          // _offset = 0
        }
        this.push(piece);
        delete pieces[_piece];
        _piece++;
      } else {
        _waitingFor = _piece;
        _piece++;
        return engine.critical(_waitingFor, _critical)
      }
    }
  });
  engine.select(start, end, 1, () => {
    // console.log('new piece completed')
  })
  rimraf(engine.path, function () { console.log("deleted",engine.path); });

  engine.on('download', (index, buffer) => {
    console.log('received buffer index ' + index, buffer);
    // res.write(buffer);
    if(_waitingFor === index) {
      console.log('pushing buffer to stream for', index);
      if (_offset) {
      buffer = buffer.slice(_offset)
      }
      stream.push(buffer);
      _waitingFor = -1;
    } else {
      pieces[index] = buffer;
      console.log('piece index '+ index + ' stored ', pieces[index]);
    }
    // stream.push(buffer);
  })

  stream.pipe(res);
  req.on("close", function() {
    console.log('request closed');
    stream.destroy();
    engine.deselectAll();
  });
}