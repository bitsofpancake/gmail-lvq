var id = '';
for (var i = 0; i < 32; i++)
	id += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
id = 'testing';

var queue = [];

var ws = new WebSocket('ws://cs.hmc.edu:40223/' + id);
ws.onopen = function () {
	//ws.send({'id': id}); // Send the message 'Ping' to the server
	//ws.send('ping')
};

ws.onerror = function (error) {
	console.log('WebSocket Error ' + error);
};

ws.onmessage = function (e) {
	console.log(e.data);
	var messages = JSON.parse(e.data);
	messages.forEach(function (message) {
		message.el = $('div', function (m) {
			m.className = 'message';
			m.appendChild($('h2', function (h2) { h2.appendChild(document.createTextNode(message.message[0].subject)); }));
			m.appendChild($('i', function (el) { el.appendChild(document.createTextNode(message.message[0].from)); }));
			m.appendChild($('br'));
			m.appendChild($('br'));
			m.appendChild($('div', function (body) { body.innerHTML = message.message[0].body_html; }));
		});
		
		if (!queue.length)
			message.el.classList.add('focus');
		document.getElementById('messages').insertBefore(message.el, document.getElementById('messages').firstChild);
		queue.push(message);
	});
};

function pop(value) {
	var message = queue.shift();
	message.value = value;
	ws.send(JSON.stringify({
		'index': message.index,
		'value': value
	}));
	
	message.el.classList.add(value ? 'remove-important' : 'remove-not-important');
	message.el.classList.remove('focus');
	if (queue[0])
		queue[0].el.classList.add('focus');
	setTimeout(function () {
		message.el.parentNode.removeChild(message.el);
	}, 400);
}

document.getElementById('important').onclick = function () { pop(true); };
document.getElementById('not-important').onclick = function () { pop(false); };
window.onkeydown = function (e) {
	// Left, not important.
	if (e.which === 37)
		pop(false);
	else if (e.which === 39)
		pop(true);
};

function $(tag, cb) {
	var el = document.createElement(tag);
	if (cb) cb(el);
	return el;
}