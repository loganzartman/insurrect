class Emitter {
	constructor(params) {
		this._listeners = {};
	}

	/**
	 * Add a listener for the given event.
	 * @param event the name of the event to listen for
	 * @param callback the event handler
	 * @returns an object with event, callback, and a remove function
	 */
	listen(event, callback) {
		if (!this._listeners.hasOwnProperty(event))
			this._listeners[event] = new Set();

		this._listeners[event].add(callback);
		let that = this;
		return {event: event, callback: callback, remove: function(){
			that.unlisten(event, callback);
		}};
	}

	/**
	 * Removes a listener for the given event.
	 * It may be easier to use the .remove() method returned by listen()
	 * @param event the name of the event
	 * @param callback a reference to the listener to remove
	 * @return whether the listener was removed
	 */
	unlisten(event, callback) {
		if (typeof event === "object") {
			callback = event.callback;
			event = event.event;
		}

		if (this._listeners.hasOwnProperty(event)
			&& this._listeners[event].has(callback)) {
			this._listeners[event].delete(callback);
			return true;
		}
		return false;
	}

	/**
	 * Removes all listeners for a given event.
	 * @param event the name of the event
	 */
	removeAllListeners(event) {
		if (typeof event === "undefined")
			this._listeners = {};
		else if (this._listeners.hasOwnProperty(event))
			this._listeners[event] = new Set();
	}

	/**
	 * Fires event listeners for a given event, and passes optional data.
	 * This method IS synchronous.
	 * @param event the event name
	 * @param data arbitrary data to pass as first argument to listeners
	 */
	emit(event, data) {
		if (this._listeners.hasOwnProperty(event))
			this._listeners[event].forEach(l => l.call(this, data));
	}
}
