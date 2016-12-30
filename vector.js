var Vector = function(x,y) {
	if (arguments.length === 0) {
		this.x = 0;
		this.y = 0;
	}
	else if (x instanceof Array) {
		this.x = x[0];
		this.y = x[1];
	}
	else {
		this.x = x;
		this.y = y;
	}
};
var V = function(x,y){return new Vector(x,y);};
Vector.fromDir = function(angle, mag) {
	mag = typeof mag === "number" ? mag : 1;
	return new Vector(
		Math.cos(angle) * mag,
		Math.sin(angle) * mag
	);
};
Vector.random = function(lo, hi) {
	if (typeof lo === "undefined") {
		lo = 0;
		hi = 1;
	}
	else if (typeof hi === "undefined") {
		hi = lo;
		lo = 0;
	}
	return new Vector(
		Math.random()*(hi-lo)+lo,
		Math.random()*(hi-lo)+lo
	);
};
Vector.prototype.add = function(v) {
	return new Vector(this.x + v.x, this.y + v.y);
};
Vector.prototype.sub = function(v) {
	return new Vector(this.x - v.x, this.y - v.y);
};
Vector.prototype.negate = function() {
	return new Vector(-this.x, -this.y);
};
Vector.prototype.mult = function(a,b) {
	if (typeof b === "undefined") b = a;
	return new Vector(this.x * a, this.y * b);
};
Vector.prototype.div = function(a) {
	return new Vector(this.x / a, this.y / a);
};
Vector.prototype.dot = function(v) {
	return this.x*v.x + this.y*v.y;
};
Vector.prototype.project = function(v) {
	var l = this.len();
	return this.mult(this.dot(v) / (l*l));
};
Vector.prototype.len = function() {
	return Math.sqrt(this.x*this.x + this.y*this.y);
};
Vector.prototype.dir = function() {
	return Math.atan2(this.y, this.x);
};
Vector.prototype.clone = function() {
	return new Vector(this.x, this.y);
};
Vector.prototype.normalize = function() {
	var len = this.len();
	if (len === 0) return new Vector(0,0);
	return new Vector(this.x / len, this.y / len);
};
Vector.prototype.unit = Vector.prototype.normalize;