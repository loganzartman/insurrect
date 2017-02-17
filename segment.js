class Segment {
	constructor(a, b) {
		this.a = a;
		this.b = b;
		this._geomDirty = true; //must be set manually!
		this._normal = null;
	}

	/**
	 * Returns 2 to 4 segments that are the result of dividing this segment
	 * and another across their intersection point.  If any of the resulting
	 * segments are of zero length, they are not returned.
	 * @param segment the other segment
	 */
	divide(segment) {
		let isect = Util.geom.segSegIntersect(this, segment);
		
		//if there is no intersection, no split occurs
		if (isect === null)
			return [this, segment];

		//return the result of both splits
		return this.divideAt(isect).concat(segment.divideAt(isect));
	}

	/**
	 * Returns a 1 to 2 segments that are a result of splitting this segment
	 * across an intersection point
	 */
	divideAt(point) {
		let t = this.contains(point);
		if (!t || t === 0 || t === 1)
			return [this];

		let dx = this.b.sub(this.a);
		let len = dx.len();
		let dxu = dx.unit();

		let mid = this.a.add(dxu.mult(len * t));
		return [
			new Segment(this.a, mid),
			new Segment(mid, this.b)
		];
	}

	/**
	 * Determines whether a given point lies on this line segment.
	 * @param point the point to test
	 * @returns false if the segment does not contain this point.
	 * Otherwise, returns  
	 */
	contains(point) {
		let dx = this.b.sub(this.a).unit();
		let t0 = (point.y - this.a.y) / (dx.y);
		let t1 = (point.x - this.a.x) / (dx.x);
		if (!isNaN(t0) && !isNaN(t0) && t0 !== t1)
			return false;
		let t = t0 || t1; //nasty border case for NaNs
		if (t < 0 || t > 1)
			return false;
		return t;
	}

	/**
	 * Returns a Vector representing the normal of this segment.
	 * @return the normal
	 */
	getNormal() {
		if (!this._geomDirty)
			return this._normal;
		
		//compute normal vector (the sign of the direction here is arbitrarily chosen)
		let dx = this.b.sub(this.a);
		this._normal = Vector.fromDir(dx.dir() + Math.PI * 0.5, 1);
		this._geomDirty = false;
		return this._normal;
	}

	/**
	 * Returns a Vector representing the midpoint of this segment.
	 * @return the midpoint
	 */
	getMidpoint() {
		let dx = this.b.sub(this.a);
		return this.a.add(dx.mult(0.5));
	}

	hash() {
		return ~~((this.a.x * 31 + this.a.y * 7) + (this.b.x * 11 + this.b.y * 41));
	}
}