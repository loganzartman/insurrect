class SegmentSpace extends PartitionedSpace {
	constructor(params) {
		params = Object.assign({
			binSize: 64
		}, params);
		super(params);
		this.segmentBins = new Map();
	}

	getBins(segment) {
		let hash = segment.hash();
		if (this.segmentBins.has(hash))
			return this.segmentBins.get(hash);

		let bins = new Set();

		let diff = segment.b.sub(segment.a);
		const len = diff.len(), step = 1;

		let pos = segment.a.clone();
		let dx = diff.unit().mult(step);
		let travel = 0;

		while (travel < len) {
			bins.add(this.hash(pos));
			pos.x += dx.x;
			pos.y += dx.y;
			travel += step;
		}
		bins.add(this.hash(segment.b));
		this.segmentBins.set(hash, bins);
		return bins;
	}

	add(segment) {
		let bins = this.getBins(segment);
		bins.forEach(bin => this.addAt(segment, bin));
	}

	remove(segment) {
		let bins = this.getBins(segment);
		bins.forEach(bin => this.removeAt(segment, bin));
	}

	drawDebug(gfx) {
		super.drawDebug(gfx);
	}
}