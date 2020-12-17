var WebTorrent = require('webtorrent')
 
var client = new WebTorrent()
var magnetURI = 'magnet:?xt=urn:btih:5AC3D859E9F6A9DAF341D48A58FD96D963359A5A';
 
client.add(magnetURI, function (torrent) {
  // Got torrent metadata!
  console.log('Client is downloading:', torrent.infoHash)
 
  torrent.files.forEach(function (file) {
    // Display the file by appending it to the DOM. Supports video, audio, images, and
    // more. Specify a container element (CSS selector or reference to DOM node).
    file.appendTo('body')
  })
})