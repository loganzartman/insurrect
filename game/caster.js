class Caster extends Emitter {
	constructor(params) {
		if (!params.hasOwnProperty("world"))
			throw new Error("Must pass a World.");

		super(params);
		params = Object.assign(params, {

		});

		this.world = params.world;
		this.init();
	}

	/**
	 * Performs initialization.
	 * Must reinitialize if geometry changes.
	 */
	init() {
		this.points = [];
		let set = new IntSet();

		//attempts to append a new segment for an existing point
		//returns false if that point doesn't actually exist
		let tryAppend = (point, segment) => {
			this.points.forEach(existing => {
				if (existing.point.equals(point)) {
					existing.segments.push(segment);
					return true;
				}
			})
			return false;
		};

		//create an internal list of points and all of the segments associated with them
		this.world.obstacles.forEach(obstacle => {
			obstacle.getSegments().forEach(segment => {
				[segment.a, segment.b].forEach(point => {
					//if the set doens't yet contain the hash for this point, it is likely to be new
					if (set.add(point.hash())) {
						//actually search the list just in case
						if (!tryAppend(point, segment)) {
							//it really is a new point
							this.points.push({
								point: point,
								segments: [segment]
							});
						}
					}
					else {
						//search the list and append this segment to the list for the point
						tryAppend(point, segment);
					}
				});
			});
		});
	}

	/**
	 * Performs preprocessing for a cast.
	 * Geometry cannot change after the preprocess.
	 */
	preprocess(viewpoint) {
		this.points.sort((a,b) => {
			let distanceA = a.point.sub(viewpoint).len();
			let distanceB = b.point.sub(viewpoint).len();
			return distanceA - distanceB;
		});
	}

	/**
	 * Computes visible area
	 * @return a list of Polygons representing visibility from viewpoint
	 */
	cast(viewpoint, includeWholePolygons) {
		this.preprocess(viewpoint);
		let points = [
			new Vector(viewpoint.x-64, viewpoint.y-64),
			new Vector(viewpoint.x+64, viewpoint.y-64),
			new Vector(viewpoint.x+64, viewpoint.y+64),
			new Vector(viewpoint.x-64, viewpoint.y+64)
		];
		return [new Polygon(points)];
	}

	drawDebug(gfx) {
		this.points.forEach((item,idx) => {
			let displayPos = item.point.sub(GameScene.view).sub(GameScene.viewOffset);
			let col = idx*4/this.points.length;
			gfx.beginFill((Math.min(255,col*255) << 8) | 0xFF0000, 1);
			gfx.drawRect(displayPos.x, displayPos.y, 1, 1);
			gfx.endFill();
		});
	}
}