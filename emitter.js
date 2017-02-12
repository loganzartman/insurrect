class Emitter {
	constructor(params) {
		this.listeners = {};
	}

	listen(event, callback) {
		if (!this.listeners.hasOwnProperty(event))
			this.listeners[event] = [];
		this.listeners[event].push(callback);
		let that = this;
		return {event: event, callback: callback, remove: function(){
			that.unlisten(event, callback);
		}};
	}

	unlisten(event, callback) {
		if (typeof event === "object") {
			callback = event.callback;
			event = event.event;
		}

		if (this.listeners.hasOwnProperty(event)
			&& this.listeners[event].includes(callback)) {
			this.listeners[event].splice(this.listeners[event].indexOf(callback), 1);
			return true;
		}
		return false;
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
