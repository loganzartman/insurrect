class Vector {
	constructor(x,y) {
		if (arguments.length === 2) {
			this.x = x;
			this.y = y;
		}
		else if (arguments.length === 0) {
			this.x = 0;
			this.y = 0;
		}
		else if (x instanceof Array) {
			this.x = x[0];
			this.y = x[1];
		}
		else if (x.hasOwnProperty("x") && x.hasOwnProperty("y")) {
			this.x = x.x;
			this.y = x.y;
		}
		else {
			throw new Error();
		}
	}

	static fromDir(angle, mag) {
		mag = typeof mag === "number" ? mag : 1;
		return new Vector(
			Math.cos(angle) * mag,
			Math.sin(angle) * mag
		);
	}

	static random(lo, hi) {
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
	}

	add(v) {
		return new Vector(this.x + v.x, this.y + v.y);
	}

	sub(v) {
		return new Vector(this.x - v.x, this.y - v.y);
	}

	negate() {
		return new Vector(-this.x, -this.y);
	}

	mult(a,b) {
		if (typeof b === "undefined") b = a;
		return new Vector(this.x * a, this.y * b);
	}

	div(a) {
		return new Vector(this.x / a, this.y / a);
	}

	dot(v) {
		return this.x*v.x + this.y*v.y;
	}

	project(v) {
		var l = this.len();
		return this.mult(this.dot(v) / (l*l));
	}

	len() {
		return Math.sqrt(this.x*this.x + this.y*this.y);
	}

	dir() {
		return Math.atan2(this.y, this.x);
	}

	clone() {
		return new Vector(this.x, this.y);
	}

	normalize() {
		var len = this.len();
		if (len === 0) return new Vector(0,0);
		return new Vector(this.x / len, this.y / len);
	}

	equals(v) {
		if (v.x !== this.x || v.y !== this.y)
			return false;
		return true;
	}

	toPixiPoint() {
		return new PIXI.Point(this.x, this.y);
	}
}

var V = function(){return new Vector(...arguments);};
Vector.prototype.unit = Vector.prototype.normalize;
