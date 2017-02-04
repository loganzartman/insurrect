/**
 * A storage structure that partitions a 2D space into bins using hashes.
 * Accepts any objects with a position property that is a Vector.
 */
class PartitionedSpace {
	/**
	 * Params:
	 * binSize: the size of a bin
	 */
	constructor(params) {
		params = Object.assign({
			binSize: 16
		}, params);
		this.binSize = binSize;
		this.data = new Map();
	}

	hash(entity) {
		var binPos = entity.position.div(this.binSize);
		
		//bijection from Z -> N
		binPos.x = Math.floor(binPos.x)*2;
		binPos.y = Math.floor(binPos.y)*2;
		if (binPos.x < 0)
			binPos.x = -binPos.x - 1;
		if (binPos.y < 0)
			binPos.y = -binPos.y - 1;

		//Cantor pairing function
		var sum = binPos.x + binPos.y;
		return 0.5*sum*(sum+1) + binPos.y;
	}

	add(entity) {
		//generate hash
		let hash = this.hash(entity);

		//create a new set if this hash doesn't exist
		if (!this.data.has(hash))
			this.data.set(hash, new Set());
		
		//add item to set
		this.data.get(hash).add(entity);
	}

	getNearby(entity, distance) {
		var nearby = new Set();
		let binRange = Math.ceil(range / this.binSize);
		for (let x=-binRange; x<=binRange; x++) {
			for (let y=-binRange; y<=binRange; y++) {
				if (this.data.has)
			}
		}
		return nearby;
	}

	remove(entity) {

	}
}