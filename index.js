var WebTorrent = require('webtorrent')
//var client = new WebTorrent()
// var magnetURI = 'http://itorrents.org/torrent/5AC3D859E9F6A9DAF341D48A58FD96D963359A5A.torrent'
var magnetURI = 'https://itorrents.org/torrent/5AC3D859E9F6A9DAF341D48A58FD96D963359A5A.torrent'

// client.add(magnetURI, function (torrent) {
//    //console.log(torrent.files)
//    for (i = 0; i < torrent.files.length; i++) {
//      console.log(torrent.files[i].name)
//     var file = torrent.files[i];
//     // stream = file.createReadStream();
//     // stream.on('data', (chunk) => {
//     //   console.log(`Received ${chunk.length} bytes of data.`);
//     //   });
//    }
//   //  torrent.on('ready', () => {
//   //    console.log('ready..')
//   //  })
//   // torrent.files.foreach((file) => {
//   //   console.log(file)
//   // })
//   // create HTTP server for this torrent
//   //var server = torrent.createServer()
//   //console.log(server)
//   //server.listen(8080) // start the server listening to a port

//   // visit http://localhost:<port>/ to see a list of files

//   // access individual files at http://localhost:<port>/<index> where index is the index
//   // in the torrent.files array

//   // later, cleanup...
//   //server.close()
//   //client.destroy()
// })

var express = require('express');
var app = express();
var fs = require("fs");

app.get('/', function(req, res) {
  res.end('hello')
})

app.get('/listFiles', function (req, res) {
  var client = new WebTorrent();
  console.log(req.query)
  client.add(req.query.torrent, function (torrent) {
  console.log('torrent.files');
  //  res.end(torrent.files[i])
  torrent.files.forEach(file => file.deselect());
  torrent.deselect(0, torrent.pieces.length - 1, false);
  //torrent.deselect(0, torrent.pieces.length - 1, false)
  var response = [];
   for (i = 0; i < torrent.files.length; i++) {
    var file = torrent.files[i];
    console.log(file.name)
    response.push({
      name: file.name,
      progress: file.progress
    });
   }
   res.end(JSON.stringify({response}))
})
  client.destroy();
})

app.get('/getData', function (req, res) {
  var client = new WebTorrent()
  console.log(req.query)
  client.add(req.query.torrent, function (torrent) {
  torrent.files.forEach(file => file.deselect());
  torrent.deselect(0, torrent.pieces.length - 1, false);

  var file = torrent.files[req.query.fileIndex];
  console.log(file.name)
  stream = file.createReadStream();
  console.log(stream);
  res.writeHead(200, {
        "Content-Range": "bytes " + 0 + "-" + file.length + "/" + file.length,
            "Accept-Ranges": "bytes",
            "Content-Length": file.length,
            "Content-Type": "video/mp4"
    });
  stream.pipe(res);
  // stream.on('readable', function() {
  //   console.log('stream is readable')
  //   // res.writeHead(206, {
  //   //     "Content-Range": "bytes " + 0 + "-" + file.length + "/" + file.length,
  //   //         "Accept-Ranges": "bytes",
  //   //         "Content-Length": file.length,
  //   //         "Content-Type": "video/mp4"
  //   // });
  //   // // This just pipes the read stream to the response object (which goes 
  //   // //to the client)
  //   // stream.pipe(res);
  //   let data;
  //   while (data = this.read()) {
  //   // console.log(data);
  //   res.write(data);
  // }
  // res.end();
  // });
  // res.writeHead(206, {
  //     "Content-Range": "bytes " + 0 + "-" + file.length + "/" + file.length,
  //         "Accept-Ranges": "bytes",
  //         "Content-Length": file.length,
  //         "Content-Type": "video/mp4"
  // });
  // stream.on('data', function(chunk) {
  //   res.end(chunk)
  //   });
    stream.on('end', (chunk) => {
    res.end(chunk)
    client.destroy();
    });
    stream.on('error', (chunk) => {
    res.end(chunk)
    client.destroy();
    });
})
})

var server = app.listen(80, function () {
   var host = server.address().address
   var port = server.address().port
   console.log("Example app listening at http://%s:%s", host, port)
})





// var torrentStream = require('torrent-stream');
// var parseTorrent = require('parse-torrent');
// console.log('test')

// var engine = torrentStream('magnet:?xt=urn:btih:5AC3D859E9F6A9DAF341D48A58FD96D963359A5A');

// console.log('engine');
// console.log(engine)
// engine.on('ready', () => {
//   console.log('engine is ready');
// });

// console.log('testing...');

// console.log(parseTorrent('magnet:?xt=urn:btih:5AC3D859E9F6A9DAF341D48A58FD96D963359A5A&dn=Arctic+Monkeys+-+Tranquility+Base+Hotel+%26amp%3B+Casino+%282018%29+Mp3+%28320+kbps%29+%5BHunter%5D&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.pirateparty.gr%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969%2Fannounce&tr=udp%3A%2F%2Fpublic.popcorn-tracker.org%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.zer0day.to%3A1337%2Fannounce&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce&tr=udp%3A%2F%2Feddie4.nl%3A6969%2Fannounce&tr=udp%3A%2F%2Feddie4.nl%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.cypherpunks.ru%3A6969%2Fannounce&tr=udp%3A%2F%2Finferno.demonoid.pw%3A3418%2Fannounce&tr=udp%3A%2F%2Fthetracker.org%3A80%2Fannounce&tr=udp%3A%2F%2Fthetracker.org%3A80%2Fannounce&tr=udp%3A%2F%2F9.rarbg.com%3A2710%2Fannounce&tr=udp%3A%2F%2Fpubt.in%3A2710%2Fannounce&tr=udp%3A%2F%2Ftracker.zer0day.to%3A1337%2Fannounce&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969%2Fannounce&tr=udp%3A%2F%2Fcoppersurfer.tk%3A6969%2Fannounce'))


// engine.on('ready', function() {
//   console.log('inside-files')
//   console.log('engine is ready')
//   engine.files.forEach(function(file) {
//     //console.log('filename:', file.name);
//     var stream = file.createReadStream();

//     readerStream.on('data', function(chunk) {
//       console.log(chunk)
//       //data += chunk;
//     });
//     //console.log(stream);
//     // stream is readable stream to containing the file content
//   });
// });