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
		this.binSize = params.binSize;
		this.iBinSize = 1/this.binSize;
		this.data = new Map();
	}

	hash(x, y) {
		if (arguments.length === 1) {
			x = arguments[0].x;
			y = arguments[0].y;
		}

		x *= this.iBinSize;
		y *= this.iBinSize;
		return (~~x)*33 + (~~y*17);
	}

	hashEntity(entity) {
		return this.hash(entity.position);
	}

	addAt(entity, hash) {
		//create a new set if this hash doesn't exist
		if (!this.data.has(hash))
			this.data.set(hash, new Set());

		//add item to set
		this.data.get(hash).add(entity);
	}

	add(entity) {
		return this.addAt(entity, this.hash(entity.position));
	}

	getNearby(entity, distance) {
		let x0 = entity.position.x, y0 = entity.position.y;
		let nearbySet = new IntSet();
		let nearby = [];
		let size = this.binSize;
		let binRange = Math.ceil(distance / size);

		//iterate over nearby bins
		for (let x=-binRange; x<=binRange; x++) {
			for (let y=-binRange; y<=binRange; y++) {
				//compute hash for this bin
				let hash = this.hash(x0+x*size, y0+y*size);
				
				//add all items here to set
				let items = this.getAt(hash);
				if (items === null)
					continue;
				items.forEach(item => {
					if (nearbySet.add(item.hash()))
						nearby.push(item);
				});
			}
		}
		return nearby;
	}

	getAt(hash) {
		let items = null;
		if (this.data.has(hash))
			items = this.data.get(hash);
		return items;
	}

	getRaycast(x0, y0, dx, dy, maxdist, callback) {
		var len = Math.sqrt(dx*dx + dy*dy);
		if (len !== 1) {
			dx /= len;
			dy /= len;
		}

		var set = new IntSet();
		var list = [];

		var step = this.binSize;
		var offset = Vector.fromDir(Math.atan2(dy,dx)+Math.PI*0.5, step*0.33);
		var offsets = [[dx*step*0.05, dy*step*0.05], [offset.x, offset.y], [-offset.x, -offset.y]];
		dx *= step;
		dy *= step;
		var dist = 0;

		while (dist < maxdist) {
			for (var i=0,j=offsets.length; i<j; i++) {
				var hash = this.hash(x0 + offsets[i][0], y0 + offsets[i][1]);
				var items = this.getAt(hash);
				if (items === null)
					continue;

				items.forEach(item => {
					if (set.add(item.hash()))
						callback(item);
				});
			}

			//move
			x0 += dx;
			y0 += dy;
			dist += step;
		}
	}

	remove(entity) {
		let hash = this.hashEntity(entity);
		this.removeAt(entity, hash);	
	}

	removeAt(entity, hash) {
		if (this.data.has(hash))
			this.data.get(hash).remove(entity);
	}

	drawDebug(gfx) {
		gfx.lineStyle(1, 0xFF0000, 0.25);
		for (var x=GameScene.view.x+GameScene.viewOffset.x, x1=x+Display.w+this.binSize; x<x1; x+=this.binSize) {
			for (var y=GameScene.view.y+GameScene.viewOffset.y, y1=y+Display.h+this.binSize; y<y1; y+=this.binSize) {
				var binX = Math.floor(x/this.binSize);
				var binY = Math.floor(y/this.binSize);
				var offsetX = (x/this.binSize)-binX;
				var offsetY = (y/this.binSize)-binY;
				gfx.drawRect(
					(binX*this.binSize)-GameScene.view.x-GameScene.viewOffset.x,
					(binY*this.binSize)-GameScene.view.y-GameScene.viewOffset.y,
					this.binSize, this.binSize
				);
			}
		}
	}
}