var torrentStream = require('torrent-stream');

var engine = torrentStream('https://webtorrent.io/torrents/sintel.torrent');

engine.on('ready', function() {
	engine.files.forEach(function(file) {
		console.log('filename:', file.name);
		var stream = file.createReadStream();
		// stream is readable stream to containing the file content
	});
});