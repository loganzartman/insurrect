class Segment {
	constructor(a, b) {
		this.a = a;
		this.b = b;
	}

	hash() {
		return ~~((this.a.x * 31 + this.a.y * 7) + (this.b.x * 11 + this.b.y * 41));
	}
}