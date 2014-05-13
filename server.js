var http = require('http');
var ws = require('ws');
var fs = require('fs');

var REFRESH_THRESHOLD = 25;

http.createServer(function (req, res) {
	var id = req.url.substr(1);
	console.log('server connected ' + id);
    if (req.method !== 'POST' || !connections[id] || !connections[id].clientSocket) {
		res.writeHead(400);
		res.end();
		return;
	}

	var body = '';
	req.on('data', function (data) {
		body += data;
	});
	req.on('end', function () {
		try {
			console.log('forwarding');
			connections[id].clientSocket.send(JSON.stringify(JSON.parse(body).map(function (message) {
				connections[id].messagesForwarded++;
				var record = {
					'index': null,
					'message': message
				};
				record.index = connections[id].messages.push(record) - 1;
				return record;
			})));
			
			connections[id].serverSocket = res;
			connections[id].serverInterval = setInterval(function () {
				res.write('.');
			}, 1000);
		} catch (e) {
			throw e
			res.writeHead(400);
			res.end();
		}
	});
}).listen(40222);

var connections = {};

var wss = new ws.Server({port: 40223});
wss.on('connection', function (socket) {
	var id = socket.upgradeReq.url.substr(1);
	//if (!connections[id])
	connections[id] = {
		clientSocket: socket,
		serverSocket: null,
		serverInterval: null,
		id: id,
		messages: [],
		messagesForwarded: 0
	};
	
	console.log('client connected: ' + id);
    socket.on('message', function (message) {
		try {
			console.log('received' + message);
			var message = JSON.parse(message);
			connections[id].messages[message.index].value = message.value;
		} catch (e) {
			throw e
			socket.terminate();
		}
    });
	
	socket.on('close', function () {
		console.log('client closed socket');
		connections[id].clientSocket = null;
		fs.writeFileSync('data.json', JSON.stringify(connections[id].messages));
	});
});

// 
setInterval(function () {
	for (var id in connections)
		// Request more data, if necessary, by ending the connection to server.
		if (--connections[id].messagesForwarded < REFRESH_THRESHOLD && connections[id].serverSocket) {
			clearInterval(connections[id].serverInterval);
			connections[id].serverSocket.end();
		}
}, 500);