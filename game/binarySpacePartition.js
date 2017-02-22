class BinarySpacePartition extends Emitter {
	constructor(params) {
		super(params);
		if (!params.hasOwnProperty("segments"))
			throw new Error("Must specify list of segments for which to construct BSP.");
		this.setSegments(params.segments);
	}

	setSegments(segments) {
		this.segments = segments;
		this.rebuildAll();
	}

	/**
	 * Completely rebuilds the BSP.
	 * Implements the algorithm as descibed here:
	 * https://en.wikipedia.org/wiki/Binary_space_partitioning
	 */
	rebuildAll() {
		this.size = 0;

		//this is probably overly generic considering its usage
		let makeNode = (data=[], back=null, front=null) => {
			this.size++;
			return {data: data, back: back, front: front};
		};

		let segments = this.segments.slice();
		
		// //preprocess segments
		// segments = Util.geom.fixSegments(segments);

		let A = makeNode(segments);
		
		let step = (node) => {
			let segments = node.data;
			let out = [segments[0]];

			for (let i=1; i<segments.length; i++) {
				let segment = segments[i];
				
				let isect = Util.geom.segLineIntersect(segment, segments[0]);

				//need to divide the segment
				if (isect !== null) {
					let contained = segment.contains(isect);
					if (contained > 0 && contained < 1) {
						let parts = segment.divideAt(isect);
						parts.forEach(s => segments.push(s));
						continue;
					}
				}
				
				let inFront = segment.inFront(segments[0]);

				//if inFront returns -1, this segment is behind
				if (inFront === -1) {
					if (!node.back)
						node.back = makeNode();
					node.back.data.push(segment);
				}

				//if inFront returns 0, this segment is collinear
				else if (inFront === 0) {
					out.push(segment);
				}

				//if inFront returns 1, this segment is in front
				else if (inFront === 1) {
					if (!node.front)
						node.front = makeNode();
					node.front.data.push(segment);
				}
			};

			node.data = out;

			if (node.front)
				step(node.front);
			if (node.back)
				step(node.back);
		};

		step(A);
		this.root = A;
	}

	/**
	 * Traverse segments in this BSP in order from near to far relative to
	 * a given point.
	 * @param point a Vector representing the position from which to look
	 * @param callback a function called for each segment in the traversal.
	 * This method passes each segment as the first argument.
	 * If the callback returns false, the traversal is aborted.
	 */
	traverseNearToFar(point, callback, node=this.root) {
		if (node === null || node.data.length === 0)
			return true;

		let side = node.data[0].getPointSide(point);
		if (side === 1) {
			if (!this.traverseNearToFar(point, callback, node.front))
				return false;
			let flag = true;
			node.data.forEach(seg => flag = flag && callback(seg));
			if (!flag)
				return false;
			if (!this.traverseNearToFar(point, callback, node.back))
				return false;
		}
		else if (side === -1) {
			if (!this.traverseNearToFar(point, callback, node.back))
				return false;
			let flag = true;
			node.data.forEach(seg => flag = flag && callback(seg));
			if (!flag)
				return false;
			if (!this.traverseNearToFar(point, callback, node.front))
				return false;
		}
		return true;
	}

	traverseNTF(point, callback, node=this.root) {
		
	}

	getHeight(node=this.root, depth=0) {
		if (node === null)
			return depth;
		return Math.max(
			this.getHeight(node.back, depth+1),
			this.getHeight(node.front, depth+1)
		);
	}

	traverse(callback, node=this.root) {
		if (node === null)
			return;
		this.traverse(callback, node.back);
		node.data.forEach(s => callback(s));
		this.traverse(callback, node.front);
	}

	renderDebug(gfx) {
		gfx.clear();
		
		const colors = [0xFF0000, 0xFFFF00, 0x00FF00, 0x00FFFF, 0x0000FF, 0xFF00FF];
		let cidx = 0;

		this.traverse(segment => {
			gfx.lineStyle(1, colors[cidx = (cidx+1)%colors.length], 1);
			let screenA = segment.a.sub(GameScene.view).sub(GameScene.viewOffset);
			let screenB = segment.b.sub(GameScene.view).sub(GameScene.viewOffset);
			gfx.moveTo(screenA.x, screenA.y);
			gfx.lineTo(screenB.x, screenB.y);
		});
	}

	toString() {
		let buffer = "";
		let step = (node, spaces) => {
			if (node === null)
				return;
			step(node.front, spaces + "   ");
			buffer += spaces + node.data[0].getMidpoint().toString() + "\n";
			step(node.back, spaces + "   ");
		};
		step(this.root, "");
		return buffer;
	}
}