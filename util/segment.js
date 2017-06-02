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
		let isect = this.getIntersection(segment);
		
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
		if (t<0 || t === 0 || t === 1)
			return [this];

		let dx = this.b.sub(this.a);
		let len = dx.len();
		let dxu = dx.unit();

		let mid = this.a.add(dxu.mult(len * t));
		
		let one = new Segment(this.a, mid);
		one.parentPolygon = this.parentPolygon;
		let two = new Segment(mid, this.b);
		two.parentPolygon = this.parentPolygon;

		return [one, two];
	}

	nearestPoint(point) {
		let line = this.b.sub(this.a);
		let perp= line.perpendicular();
		let dpa = this.a.sub(point);
		let dl = perp.project(dpa);
		let p = point.add(dl);

		let mid = this.b.add(this.a).mult(0.5);
		if (p.sub(mid).len() <= line.len()*0.5)
			return p;

		let distA = this.a.sub(point).len();
		let distB = this.b.sub(point).len();
		return distA < distB ? this.a : this.b;
	}

	distanceFrom(point) {
		return this.nearestPoint(point).sub(point).len();
	}

	/**
	 * Determines whether a given point lies on this line segment.
	 * @param point the point to test
	 * @returns -1 if the segment does not contain this point.
	 * Otherwise, returns  
	 */
	contains(point) {
		let dx = this.b.sub(this.a);
		let t0 = (point.y - this.a.y) / (dx.y);
		let t1 = (point.x - this.a.x) / (dx.x);
		if (!isNaN(t0) && !isNaN(t1) && t0 !== t1)
			return -1;
		let t = t0 || t1; //nasty border case for NaNs
		if (t < 0 || t > 1)
			return -1;
		return t;
	}

	getIntersection(segment) {
		return Util.geom.segSegIntersect(this, segment);
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

	getDir() {
		return new Vector(Math.max(this.a.x, this.b.x), Math.max(this.a.y, this.b.y))
			.sub(new Vector(Math.min(this.a.x, this.b.x), Math.min(this.a.y, this.b.y))).dir();
	}

	/**
	 * Returns a Vector representing the midpoint of this segment.
	 * @return the midpoint
	 */
	getMidpoint() {
		let dx = this.b.sub(this.a);
		return this.a.add(dx.mult(0.5));
	}

	/**
	 * Returns -1, 0, 1 depending on which side of this segment a point lies on
	 * @return the side
	 */
	getPointSide(point, tolerance=0) {
		let pos = (this.b.x - this.a.x) * (point.y - this.a.y) - 
			(this.b.y - this.a.y) * (point.x - this.a.x);
		return Math.abs(pos) < tolerance ? 0 : Math.sign(pos);
	}

	/**
	 * Tests to see if this segment is wholly in front of another.
	 * A result of 1 or -1 would indicate this; be consistent.
	 * I've arbitrarily chosen 1 for my uses.
	 */
	inFront(segment, tolerance=0) {
		let midpt = this.getMidpoint();
		let side = segment.getPointSide(midpt, tolerance);
		return side;
	}

	toString() {
		return this.a.toString() + " -- " + this.b.toString();
	}

	hash() {
		return ~~((this.a.x * 31 + this.a.y * 7) + (this.b.x * 11 + this.b.y * 41));
	}
}