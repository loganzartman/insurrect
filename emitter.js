class Emitter {
	constructor(params) {
		this.listeners = {};
	}

	listen(event, callback) {
		if (!this.listeners.hasOwnProperty(event))
			this.listeners[event] = [];
		this.listeners[event].push(callback);
	}

	removeAllListeners(event) {
		if (typeof event === "undefined")
			this.listeners = {};
		else if (this.listeners.hasOwnProperty(event))
			this.listeners[event] = [];
	}

	emit(event, data) {
		if (this.listeners.hasOwnProperty(event))
			this.listeners[event].forEach(l => l.call(this, data));
	}
}
