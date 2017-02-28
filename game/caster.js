class Caster extends Emitter {
	constructor(params) {
		if (!params.hasOwnProperty("world"))
			throw new Error("Must pass a World.");

		super(params);
		params = Object.assign(params, {

		});

		this.world = params.world;
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
	preprocess(viewpoint, viewport) {
		//add viewport geometry
		viewport.getSegments().forEach(segment => {
			segment.VIEWPORT_GEOM = true;
			this.segments.push(segment);
		});
		viewport.points.forEach(point => {
			this.points.push({point: point, VIEWPORT_GEOM: true});
		});

		this.segments.sort((a,b) => {
			let distanceA = a.distanceFrom(viewpoint);
			let distanceB = b.distanceFrom(viewpoint);
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
			this.postprocess(viewpoint, viewport);
			this.preprocess(viewpoint, viewport);
		}

		let points = [];
		let polys = [];

		//iterate over casting directions
		this.angles.forEach(angle => {
			let dirVector = Vector.fromDir(angle, 1);
			let point = null;

			//iterate over segments in order of distance
			for (let i=0, j=this.segments.length; i<j; i++) {
				let segment = this.segments[i];
				let isect = Util.geom.raySegIntersect(viewpoint, dirVector, segment);

				if (isect) {
					point = new Vector(isect);
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
		this.segments.forEach((item,idx) => {
			let displayPosA = item.a.sub(GameScene.view).sub(GameScene.viewOffset);
			let displayPosB = item.b.sub(GameScene.view).sub(GameScene.viewOffset);
			let col = idx*4/this.segments.length;
			let color = (Math.min(255,col*255)) | 0x00FF00;
			if (idx === 0) color = 0xFFFFFF;
			gfx.lineStyle(1, color, 1);
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