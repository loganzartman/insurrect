var Emitter = function() {
	this.listeners = {};
};
Emitter.prototype.listen = function(event, callback) {
	if (!this.listeners.hasOwnProperty(event))
		this.listeners[event] = [];
	this.listeners[event].push(callback);
};
Emitter.prototype.removeAllListeners = function(event) {
	if (typeof event === "undefined")
		this.listeners = {};
	else if (this.listeners.hasOwnProperty(event))
		this.listeners[event] = [];
};
Emitter.prototype.emit = function(event, data) {
	if (this.listeners.hasOwnProperty(event))
		this.listeners[event].forEach(l => l.call(this, data));
};