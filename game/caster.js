class Caster extends Emitter {
	constructor(params) {
		if (!params.hasOwnProperty("world"))
			throw new Error("Must pass a World.");

		super(params);
		params = Object.assign(params, {
			maxDist: 1000,
			DEBUG: true
		});

		this.maxDist = params.maxDist;
		this.world = params.world;
		this.DEBUG = params.DEBUG;
	}

	/**
	 * Performs initialization.
	 * Must reinitialize if geometry changes.
	 * TODO: benchmark and see if using set to reduce searching significantly improves perf
	 */
	init() {
		this.points = [];
		this.segments = [];
		this.debugSegments = [];
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
	preprocess(viewpoint, viewport) {
		//add viewport intersections
		Util.geom.segIntersections(viewport.getSegments(), this.segments)
			.forEach(isect => {
				this.points.push({point: isect, VIEWPORT_GEOM: true});
			});

		//add viewport geometry
		viewport.getSegments().forEach(segment => {
			segment.VIEWPORT_GEOM = true;
			this.segments.push(segment);
		});
		viewport.points.forEach(point => {
			this.points.push({point: point, VIEWPORT_GEOM: true});
		});

		this.segments.forEach(s => {
			s._dist = s.distanceFrom(viewpoint);
			s._maxdist = Math.max(s.a.sub(viewpoint).len(), s.b.sub(viewpoint).len());
		});
		this.segments.sort((a,b) => {
			return a._dist - b._dist;
		});

		//collect list of all casting directions
		const epsilon = 1e-12;
		this.angles = [];
		this.points.forEach(item => {
			let angle = item.point.sub(viewpoint).dir();
			this.angles.push(angle-epsilon);
			// this.angles.push(angle);
			this.angles.push(angle+epsilon);
		});
	}

	postprocess(viewpoint) {
		//remove viewport geometry
		this.segments = this.segments.filter(s => !("VIEWPORT_GEOM" in s));
		this.points = this.points.filter(p => !("VIEWPORT_GEOM" in p));
	}

	/**
	 * Computes visible area
	 * @return a list of Polygons representing visibility from viewpoint
	 */
	cast(viewpoint, viewport, includeStructure, notDirty) {
		if (!notDirty) {
			this.debugSegments = [];
			this.postprocess(viewpoint, viewport);
			this.preprocess(viewpoint, viewport);
		}

		let points = [];
		let polys = new Set();

		//iterate over casting directions
		this.angles.forEach(angle => {
			let dirVector = Vector.fromDir(angle, 1);
			let point = null;
			let hitSegment = null;

			let minSearchDist = 0;
			let minSectDist = 0;

			//iterate over segments in order of distance
			for (let i=0, j=this.segments.length; i<j; i++) {
				let segment = this.segments[i];
				let isect = Util.geom.raySegIntersect(viewpoint, dirVector, segment);

				//if there is an intersection, process it
				if (isect) {
					isect = new Vector(isect);
					let dist = isect.sub(viewpoint).len();

					//only store it if it is so far the nearest intersection point
					if (point === null || dist < minSectDist) {
						minSearchDist = segment._maxdist;
						minSectDist = dist;
						point = isect;
						hitSegment = segment;
						point.angle = point.sub(viewpoint).dir();
					}
				}

				//break once an intersection has been found and we have looked
				//far enough away
				if (point !== null && segment._dist >= minSearchDist) {
					break;
				}
			}

			if (point !== null) {
				if (this.DEBUG)
					this.debugSegments.push(new Segment(viewpoint, point));
				points.push(point);

				if (includeStructure && !("VIEWPORT_GEOM" in hitSegment))
					polys.add(hitSegment.parentPolygon);
			}
		});

		points.sort(function(a,b){
			return b.angle - a.angle;
		});

		let out = [];
		out.push(new Polygon(points));
		polys.forEach(p => out.push(p));
		return out;
	}

	drawDebug(gfx) {
		if (!this.DEBUG)
			return;

		// this.debugSegments.forEach((item) => {
		// 	let displayPosA = item.a.sub(GameScene.view).sub(GameScene.viewOffset);
		// 	let displayPosB = item.b.sub(GameScene.view).sub(GameScene.viewOffset);
		// 	gfx.lineStyle(1, 0x700010, 0.5);
		// 	gfx.moveTo(displayPosA.x, displayPosA.y);
		// 	gfx.lineTo(displayPosB.x, displayPosB.y);
		// });

		this.segments.forEach((item,idx) => {
			let displayPosA = item.a.sub(GameScene.view).sub(GameScene.viewOffset);
			let displayPosB = item.b.sub(GameScene.view).sub(GameScene.viewOffset);
			let col = idx*4/this.segments.length;
			let color = (Math.min(255,col*255)) | 0x00FF00;
			if (idx === 0) color = 0xFFFFFF;
			gfx.lineStyle(2, color, 1);
			gfx.moveTo(displayPosA.x, displayPosA.y);
			gfx.lineTo(displayPosB.x, displayPosB.y);
		});

		this.points.forEach((item,idx) => {
			let displayPos = item.point.sub(GameScene.view).sub(GameScene.viewOffset);
			let col = idx*4/this.points.length;
			gfx.lineStyle(0);
			gfx.beginFill((Math.min(255,col*255) << 8) | 0xFF0000, 1);
			gfx.drawRect(displayPos.x, displayPos.y, 1, 1);
			gfx.endFill();
		});

		let point = this.segments[0].nearestPoint(GameScene.world.player.position)
			.sub(GameScene.view).sub(GameScene.viewOffset);
		gfx.beginFill(0xFF00FF, 1);
		gfx.drawRect(point.x-2, point.y-2, 4, 4);
	}
}