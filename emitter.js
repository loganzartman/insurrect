class Emitter {
	constructor(params) {
		let listeners = {};
		this.listen = Emitter.listen.bind(this, listeners);
		this.unlisten = Emitter.unlisten.bind(this, listeners);
		this.removeAllListeners = Emitter.removeAllListeners.bind(this, listeners);
		this.emit = Emitter.emit.bind(this, listeners);
	}

	/**
	 * Add a listener for the given event.
	 * @param event the name of the event to listen for
	 * @param callback the event handler
	 * @returns an object with event, callback, and a remove function
	 */
	static listen(listeners, event, callback) {
		if (!listeners.hasOwnProperty(event))
			listeners[event] = new Set();

		listeners[event].add(callback);
		return {event: event, callback: callback, remove: () => {
			this.unlisten(event, callback);
		}};
	}

	/**
	 * Removes a listener for the given event.
	 * It may be easier to use the .remove() method returned by listen()
	 * @param event the name of the event
	 * @param callback a reference to the listener to remove
	 * @return whether the listener was removed
	 */
	static unlisten(listeners, event, callback) {
		if (typeof event === "object") {
			callback = event.callback;
			event = event.event;
		}

		if (listeners.hasOwnProperty(event)
			&& listeners[event].has(callback)) {
			listeners[event].delete(callback);
			return true;
		}
		return false;
	}

	/**
	 * Removes all listeners for a given event.
	 * @param event the name of the event
	 */
	static removeAllListeners(listeners, event) {
		if (typeof event === "undefined")
			listeners = {};
		else if (listeners.hasOwnProperty(event))
			listeners[event] = new Set();
	}

	/**
	 * Fires event listeners for a given event, and passes optional data.
	 * This method IS synchronous.
	 * @param event the event name
	 * @param data arbitrary data to pass as first argument to listeners
	 */
	static emit(listeners, event, data) {
		if (listeners.hasOwnProperty(event))
			listeners[event].forEach(l => l.call(this, data));
	}
}
