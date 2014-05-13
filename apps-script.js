function run() {
	var RESULTS_PER_PAGE = 2;
	
	var threads = GmailApp.search('*');
	var index = sendData([]);
	var data;
	while (true) {
		try {
			data = GmailApp.getMessagesForThreads(threads.slice(index, index + RESULTS_PER_PAGE)).map(function (messages, i) {
				return {
					gmailIndex: index + i,
					from: messages[0].getFrom(),
					bodyPlain: messages[0].getPlainBody(),
					bodyHtml: messages[0].getBody(),
					subject: messages[0].getSubject()
				};
			}); 
		} catch (e) {
			index += RESULTS_PER_PAGE;
			continue;
		}
		
		index = sendData(data);
	}
}

function sendData(data) {
	return +UrlFetchApp.fetch('http://cs.hmc.edu:40222/testing', {
		'method': 'POST',
		'contentType': 'application/json',
		'payload': JSON.stringify(data)
	});
}