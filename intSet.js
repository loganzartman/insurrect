class IntSet {
	constructor() {
		this.size = 0;
		this.data = new Int32Array(IntSet.DEFAULT_SIZE);
		for (let i=0; i<this.data.length; i++)
			this.data[i] = IntSet.NONE;
	}

	add(item) {
		this.expand();
		let len = this.data.length;
		let pos = Math.abs(item % len);
		while (this.data[pos] !== IntSet.NONE) {
			if (this.data[pos] === item)
				return false;
			pos = (pos+1)%len;
		}
		this.data[pos] = item;
		this.size++;
		return true;
	}

	has(item) {
		let len = this.data.length;
		let pos = Math.abs(item % len);
		while (this.data[pos] !== IntSet.NONE) {
			if (this.data[pos] === item)
				return true;
			pos = (pos+1)%len;
		}
		return false;
	}

	asArray() {
		let a = [];
		for (let i=0; i<this.data.length; i++)
			if (this.data[i] !== IntSet.NONE)
				a.push(this.data[i]);
		return a;
	}

	expand() {
		let density = this.size / this.data.length;
		if (density <= IntSet.MAX_DENSITY)
			return false;

		var oldData = this.data;
		this.data = new Int32Array(this.data.length*3);
		for (let i=0; i<this.data.length; i++)
			this.data[i] = IntSet.NONE;

		this.size = 0;
		for (let i=0; i<oldData.length; i++)
			if (oldData[i] !== IntSet.NONE)
				this.add(oldData[i]);
	}
}
IntSet.DEFAULT_SIZE = 337;
IntSet.MAX_DENSITY = 0.5;
IntSet.NONE = -0x80000000;