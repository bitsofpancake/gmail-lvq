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
	var emails = JSON.parse(e.data);
	emails.forEach(function (email) {
		email.el = $('div', function (m) {
			m.className = 'message';
			m.appendChild($('h2', function (h2) { h2.appendChild(document.createTextNode(email.subject)); }));
			m.appendChild($('i', function (el) { el.appendChild(document.createTextNode(email.from)); }));
			m.appendChild($('br'));
			m.appendChild($('br'));
			m.appendChild($('div', function (body) { body.innerHTML = email.bodyHtml; }));
		});
		
		if (!queue.length)
			email.el.classList.add('focus');
		document.getElementById('messages').insertBefore(email.el, document.getElementById('messages').firstChild);
		queue.push(email);
	});
};

function pop(value) {
	var email = queue.shift();
	email.value = value;
	ws.send(JSON.stringify({
		'index': email.index,
		'value': value
	}));
	
	email.el.classList.add(value ? 'remove-important' : 'remove-not-important');
	email.el.classList.remove('focus');
	if (queue[0])
		queue[0].el.classList.add('focus');
	setTimeout(function () {
		email.el.parentNode.removeChild(email.el);
	}, 400);
}

document.getElementById('important').onclick = function () { pop(true); };
document.getElementById('not-important').onclick = function () { pop(false); };
window.onkeydown = function (e) {
	// Left, not important.
	if (e.which === 37)
		pop(false);
		
	// Right, important.
	else if (e.which === 39)
		pop(true);
};

function $(tag, cb) {
	var el = document.createElement(tag);
	if (cb) cb(el);
	return el;
}