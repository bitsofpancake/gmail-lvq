var http = require('http');
var ws = require('ws');
var fs = require('fs');

var connections = {};
http.createServer(function (req, res) {
	var connection = connections[req.url.substr(1)];
	
	// There must be a client connected!
	if (req.method !== 'POST' || !connection || !connection.clientSocket) {
		res.writeHead(400);
		res.end();
		return;
	}
	
	// Listen for the incoming emails from the Gmail server.
	console.log('server connected ' + connection.id);
	var body = '';
	req.on('data', function (data) {
		body += data;
	});
	req.on('end', function () {
		try {
			console.log('forwarding');
			
			// Send the client the emails that Gmail just sent us.
			var gmailIndex = connection.emails.length ? connection.emails[connection.emails.length - 1].gmailIndex : -1;
			connection.clientSocket.send(JSON.stringify(JSON.parse(body).map(function (email) {
				email.index = connection.emails.push(email) - 1;
				email.value = null;
				gmailIndex = email.gmailIndex;
				return email;
			})));
			
			// Tell Gmail the index to resume at.
			res.writeHead(200);
			res.end((gmailIndex + 1).toString());
		} catch (e) {
			throw e
			res.writeHead(400);
			res.end();
		}
	});
}).listen(40222);

var wss = new ws.Server({port: 40223});
wss.on('connection', function (socket) {
	var id = socket.upgradeReq.url.substr(1);
	var connection = connections[id];
	if (!connection) {
		console.log('client connected: ' + id);
		connection = connections[id] = {
			id: id,
			clientSocket: socket,
			emails: []
		};
	} else {
		console.log('client reconnected: ' + id);
		
		if (connection.clientSocket)
			connection.clientSocket.terminate();
			
		// To avoid getting set to null in 'close' handler.
		process.nextTick(function () {
			connection.clientSocket = socket;
		});
	}
	
	// Listen for the client's classification.
    socket.on('message', function (data) {
		try {
			console.log('received' + data);
			var email = JSON.parse(data);
			connection.emails[email.index].value = email.value;
		} catch (e) {
			throw e
			socket.terminate();
		}
    });
	
	socket.on('close', function () {
		console.log('client closed socket');
		connection.clientSocket = null;
		fs.writeFileSync('data.json', JSON.stringify(connection.emails));
	});
});