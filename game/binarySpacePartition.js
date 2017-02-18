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
		//this is probably overly generic considering its usage
		let makeNode = (data=[], left=null, right=null) => {
			return {data: data, left: left, right: right};
		};

		let segments = this.segments.slice();
		let A = makeNode(segments);
		
		let step = (node) => {
			let segments = node.data;
			node.data = segments.filter((segment, idx) => {
				if (idx === 0)
					return true;

				let inFront = segment.inFront(segments[0]);

				//if inFront returns an intersection point, need to divide the segment
				//yeah I know this is gross, but it saves a repeat calculation
				if (inFront instanceof Vector) {
					segments.concat(segment.divideAt(inFront));
					return false;
				}

				//if inFront returns -1, this segment is behind
				else if (inFront === -1) {
					if (!node.left)
						node.left = makeNode();
					node.left.data.push(segment);
					return false;
				}

				//if inFront returns 0, this segment is collinear
				else if (inFront === 0) {
					return true;
				}

				//if inFront returns 1, this segment is in front
				else if (inFront === 1) {
					if (!node.right)
						node.right = makeNode();
					node.right.data.push(segment);
					return false;
				}
			});

			if (node.right)
				step(node.right);
			if (node.left)
				step(node.left);
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
		//base case
		if (node === null)
			return;

		let seg0 = node.data[0];

		//base case
		if (!node.left && !node.right)
			node.data.forEach(s => callback(s));
		//recursive case
		else {
			let front = seg0.getPointSide(point);

			//point is in front of this segment
			if (front === 1) {
				this.traverseNearToFar(point, callback, node.left);
				let flag = true;
				node.data.forEach(s => {flag = flag && callback(s)});
				if (!flag)
					return;
				this.traverseNearToFar(point, callback, node.right);
			}
			//point is on the line of this segment
			else if (front === 0) {
				this.traverseNearToFar(point, callback, node.right);
				this.traverseNearToFar(point, callback, node.left);
			}
			//point is behind this segment
			else if (front === -1) {
				this.traverseNearToFar(point, callback, node.right);
				let flag = true;
				node.data.forEach(s => {flag = flag && callback(s)});
				if (!flag)
					return;
				this.traverseNearToFar(point, callback, node.left);
			}
		}
	}

	traverse(callback, node=this.root) {
		if (node === null)
			return;
		this.traverse(callback, node.left);
		node.data.forEach(s => callback(s));
		this.traverse(callback, node.right);
	}

	renderDebug(gfx) {
		gfx.clear();
		gfx.lineStyle(1, 0xFF0000, 1);
		this.traverse(segment => {
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
			step(node.right, spaces + "   ");
			buffer += spaces + node.data[0].getMidpoint().toString() + "\n";
			step(node.left, spaces + "   ");
		};
		step(this.root, "");
		return buffer;
	}
}