let _traceq = [];
let traceUrl = '/trace';
// "http://localhost:5000/trace";
let _sending = null;
let sessionId;
let starting = true;
const debug = false;
let loggingEnabled = false;

// storageType = sessionStorage;
const LoggingPhase = 'acceptLogging';
const SessionLogId = 'SessionLogId';

function SetLoggingStatus(val) {
	localStorage.setItem(LoggingPhase, val);
}

function UpdateLoggingStatus() {
	loggingEnabled = Boolean(localStorage.getItem(LoggingPhase));
}

// if statement prevents this from running during SSR
if (typeof window !== 'undefined') {
	UpdateLoggingStatus();
}

const trace: any = { version: '0.3' };

trace.url = function (url) {
	if (!arguments.length) return url;
	traceUrl = url;
	return trace;
};

trace.sessionID = function () {
	return sessionId;
};

trace.debug = function (d) {
	if (!arguments.length) return debug;
	// debug = d;
	return trace;
};

const uuid = function () {
	let uuid = '';
	if (!localStorage.getItem(SessionLogId)) {
		let i, random;
		for (i = 0; i < 32; i++) {
			random = (Math.random() * 16) | 0;

			if (i == 8 || i == 12 || i == 16 || i == 20) {
				uuid += '-';
			}
			uuid += (i == 12 ? 4 : i == 16 ? (random & 3) | 8 : random).toString(16);
		}
		localStorage.setItem(SessionLogId, uuid);
	} else {
		uuid = localStorage.getItem(SessionLogId);
	}

	return uuid;
};

const sendLogs_ = function (list) {
	let httpRequest;
	if (window.XDomainRequest) {
		httpRequest = new XDomainRequest();
		httpRequest.onload = function () {
			sendMoreOrAgain(true);
		};
	} else if (window.XMLHttpRequest) httpRequest = new XMLHttpRequest();
	else httpRequest = new ActiveXObject('Microsoft.XMLHTTP');
	httpRequest.onreadystatechange = function () {
		if (debug) {
			window.console && console.log('readyState =%d', httpRequest.readyState);
		}
		if (httpRequest.readyState == this.DONE) {
			if (debug) {
				window.console && console.log('status =%d', httpRequest.status);
			}
			sendMoreOrAgain(httpRequest.status < 300);
		}
	};
	const json = JSON.stringify(list);
	httpRequest.open('POST', traceUrl, true);
	if (window.XDomainRequest) {
		// no request header?
	} else if (window.XMLHttpRequest) {
		httpRequest.setRequestHeader('Content-Type', 'application/json');
		httpRequest.setRequestHeader('Accept', 'text/plain');
		//    httpRequest.setRequestHeader("Content-Length", json.length);
	}
	httpRequest.send(json);
};

const sendLogs = function () {
	if (_traceq.length == 0) return;
	_sending = _traceq;
	if (debug) {
		window.console && console.log('Sending %d messages', _sending.length);
	}
	_traceq = [];
	sendLogs_(_sending);
};

const sendMoreOrAgain = function (ok) {
	if (ok) {
		_sending = null;
		sendLogs();
	} else {
		if (_traceq.length != 0) {
			_sending = _sending.concat(_traceq);
			_traceq = [];
		}
		if (debug) {
			window.console && console.log('Re-sending %d messages', _sending.length);
		}
		sendLogs_(_sending); // try again
	}
};

function traceMetadata(action, label, value) {
	return traceEvent('_trace', action, label, value);
}

function traceEvent(cat, action, label, value) {
	if (localStorage.getItem('disableLogging') == 'true') {
		return;
	}

	if (localStorage.getItem('acceptLogging') === 'true') {
		if (starting) {
			//if (StartedLogging()) {
			//	storageType.setItem(LoggingPhase,false);

			starting = false;
			_sending = [];
			//	traceEvent('log_1', 'Vistorian Trace', 'Session', 'Start');
			traceEvent('_trace', 'document.location', 'href', localStorage.getItem(SessionLogId));
			//	traceEvent("_trace", "browser", "userAgent", navigator.userAgent);
			//	traceEvent("_trace", "screen", "size", "w:"+screen.width+";h:"+screen.height);
			//	traceEvent("_trace", "window", "innerSize", "w:"+window.innerWidth+";h:"+window.innerHeight);
			_sending = null;
		}

		if (debug) {
			window.console && console.log('Track[' + cat + ',' + action + ',' + label + ']');
		}
		const ts = Date.now();
		_traceq.push({
			session: sessionId,
			ts: ts,
			cat: cat,
			action: action,
			label: label,
			value: value
		});
		if (_sending == null) sendLogs();
		return trace;
	}
}

//    console.log("Trace initialized with sessionId=%s", sessionId);

function traceEventDeferred(delay, cat, action, label, value) {
	return window.setTimeout(function () {
		traceEvent(cat, action, label, value);
	}, delay);
	return trace;
}

function traceEventClear(id) {
	if (typeof id == 'number') {
		clearTimeout(id);
	}
	return trace;
}

trace.event = traceEvent;
trace.eventDeferred = traceEventDeferred;
trace.eventClear = traceEventClear;

// if statement prevents this from running during SSR
if (typeof window !== 'undefined') {
	sessionId = uuid();
}

export { trace };
