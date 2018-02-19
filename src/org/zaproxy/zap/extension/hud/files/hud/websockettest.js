function sendWebSocketMsg() {
	webSocket.send(document.getElementById("wsinput").value);
	document.getElementById("wsinput").value = "";
}

function copyToInput(id) {
	document.getElementById("wsinput").value = document.getElementById(id).innerText;
}

function clearOutput() {
	document.getElementById("wsoutput").value = "";
}

/* Set up WebSockets */

webSocket = new WebSocket("<<ZAP_HUD_WS>>");

webSocket.onopen = function(event) {
};

webSocket.onmessage = function(event) {
	document.getElementById("wsoutput").value += event.data + "\n";
}

document.addEventListener('DOMContentLoaded', function() {
	// Very hacky, but its a start
	document.getElementById('ex1').addEventListener('click', function(){copyToInput('ex1');});
	document.getElementById('ex2').addEventListener('click', function(){copyToInput('ex2');});
	document.getElementById('ex3').addEventListener('click', function(){copyToInput('ex3');});
	document.getElementById('ex4').addEventListener('click', function(){copyToInput('ex4');});
	
	document.getElementById('wssend').addEventListener('click', function(){sendWebSocketMsg();});
	document.getElementById('wsclear').addEventListener('click', function(){clearOutput();});
});
