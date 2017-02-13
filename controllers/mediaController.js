var fs = require('fs'),
	child_process = require("child_process"),
	path = require('path');

(function(mediaController) {
	'use strict';

	mediaController.init = function(app, io) {

		app.get('/_poc/streaming-audio', function (req, res) {
			res.render('_poc-streaming'); // TODO Rename index (to the path)
		});

// TEST The media file
		var largeMediaPath = "C:\\Users\\Sébastien\\Music\\DJ_Steban_electro_techno_trance.mp3";
		//path.join(__dirname, "David Guetta - Money.mp3");
		
// [BEGIN] TEST Audio streaming with good old HTTP
		app.get('/_poc/streaming/give.mp3', function (request, response) {

			fs.readFile(largeMediaPath, "binary", function(err, file) {

				var header = {};
				// add content type to header

				//TODO: any more clean solution ?
				if(typeof request.headers.range !== 'undefined')
				{
					// browser wants chunged transmission

					var range = request.headers.range;
					var parts = range.replace(/bytes=/, "").split("-");
					var partialstart = parts[0];
					var partialend = parts[1];

					var total = file.length;

					var start = parseInt(partialstart, 10);
					var end = partialend ? parseInt(partialend, 10) : total-1;

					console.log("About to send from " + start + " to " + end + " total " + total);

					header["Content-Range"] = "bytes " + start + "-" + end + "/" + (total);
					header["Accept-Ranges"] = "bytes";
					//header["Content-Length"]= (end-start)+1;
					header['Transfer-Encoding'] = 'chunked';
					header["Connection"] = "close";
					//header["Content-Type"] = 'audio/ogg';

					response.writeHead(206, header);
					// yeah I dont know why i have to append the '0'
					// but chrome wont work unless i do
					response.write(file.slice(start, end)+'0', "binary");
				}
				else
				{
					// reply to normal un-chunked request
					response.writeHead(200, header );
					response.write(file, "binary");
				}

				response.end();
			});

		});
// [END] TEST Audio streaming with good old HTTP

		var mediaPath = "C:\\_PROJECTS\\GitHub\\jogplayer-online\\David Guetta - Money.mp3";

// [BEGIN] TEST Audio streaming with WebSockets & FFmpeg
		io.sockets.on('connection', function (socket) {
			console.log('New client connected');
			// TODO use ffprobe to know the current position of streaming ?
			// TODO check for  --enable-opencl (parallel computing)
			var ffmpeg = child_process.spawn("ffmpeg",[
				/*"-re",*/ /* Read input at native frame rate *//*,*/"-i" /* Next is input file */, // Global
				mediaPath,
				/*"-codec", "copy",*/ "-f", "mp3",// "mp3"
				//"-ac", "1", "-f", // -f fmt (input/output) Force input or output file format
				 // TODO try -map option (http://www.ffmpeg.org/ffmpeg.html)
				 // TODO try -codec copy (http://www.ffmpeg.org/ffmpeg-all.html)
				 // TODO try -t duration (output), -to position (output) (Xclusive Or), check interesting other next options

				"pipe:1" // Output to STDOUT
			]);

			ffmpeg.stdout.on('data', function(data)
			{
				var buff = new Buffer(data);
				socket.send(buff.toString('base64'));
			});

			ffmpeg.stderr.on('data', function (data) {
				console.log('stderr: ' + data);
			});

			ffmpeg.on('close', function (code) {
				console.log('child process exited with code ' + code);
			});
		});
// [END] TEST Audio streaming with WebSockets & FFmpeg

	}

})(module.exports);