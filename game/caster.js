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
	 * TODO: benchmark and see if using set to reduce searching significantly improves perf
	 */
	init() {
		this.points = [];
		this.segments = [];
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
				this.segments.push(segment);
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
		//sort points by distance to viewpoint (ascending)
		this.points.sort((a,b) => {
			let distanceA = a.point.sub(viewpoint).len();
			let distanceB = b.point.sub(viewpoint).len();
			return distanceA - distanceB;
		});

		//collect list of all casting directions
		const epsilon = 1e-4;
		this.angles = [];
		this.points.forEach(item => {
			let angle = item.point.sub(viewpoint).dir();
			this.angles.push(angle-epsilon);
			this.angles.push(angle);
			this.angles.push(angle+epsilon);
		});
	}

	/**
	 * Computes visible area
	 * @return a list of Polygons representing visibility from viewpoint
	 */
	cast(viewpoint, includeStructure) {
		this.preprocess(viewpoint);

		let points = [];
		let polys = [];

		//iterate over casting directions
		this.angles.forEach(angle => {
			let dirVector = Vector.fromDir(angle, 1);
			let point = null;

			//iterate over points in order of distance
			for (let i=0, j=this.points.length; i<j; i++) {
				let nearest = null;
				let nearestDist = 0;

				//iterate over segments associated with a point
				for (let k=0, m=this.points[i].segments.length; k<m; k++) {
					let segment = this.points[i].segments[k];
					let isect = Util.geom.raySegIntersect(viewpoint, dirVector, segment);
					if (isect !== null) {
						let dist = new Vector(isect).sub(viewpoint).len();
						if (nearest === null || dist < nearestDist) {
							nearest = isect;
							nearestDist = dist;
						}
					}
				}

				if (nearest) {
					point = new Vector(nearest);
					point.angle = point.sub(viewpoint).dir();
					break;
				}
			}

			if (point !== null)
				points.push(point);
		});

		points.sort(function(a,b){
			return b.angle - a.angle;
		});

		polys.push(new Polygon(points));
		return polys;
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