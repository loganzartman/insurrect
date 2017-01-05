class Entity extends Emitter {
	constructor(params) {
		params = Object.assign({
			velocity: V(0,0),
			radius: 4
		}, params);
		if (!params.hasOwnProperty("position"))
			throw new Error("Entity must have position");
		super(params);

		this.position = params.position;
		this.velocity = params.velocity;
		this.radius = params.radius;
		this.world = params.world;
		this.listen("collision", this.handleCollision);

		this.t0 = this.world.time;
		this.gfx = new PIXI.Graphics();
		this.gfxDirty = true;
	}

	get age() {
		return this.world.time - this.t0;
	}

	move(dx) {
		var steps = Math.ceil(dx.len());
		var step = dx.div(steps);
		while (steps-- > 0) {
			this.position = this.position.add(step);
			var others = this.getAllCollisions();
			if (others.length > 0) {
				this.position = this.position.sub(step);
				var minstep = others[0][1].sub(others[0][0]).project(step);
				others.forEach(function(coll){
					var nstep = coll[1].sub(coll[0]).project(step);
					if (nstep.len() < minstep.len())
						minstep = nstep;
				});
				step = minstep.unit().mult(step.len());
				this.emit("collision", others);
			}
		}
	}

	frame(timescale) {
		this.emit("frameStart");
		this.move(this.velocity.mult(timescale));
		this.emit("frameEnd");
	}

	draw() {
		this.gfx.position.x = this.position.x;
		this.gfx.position.y = this.position.y;

		if (!this.gfxDirty)
			return;
		this.gfx.clear();
		this.gfx.lineStyle(1, Core.color.acc2, 1);
		this.gfx.drawCircle(0, 0, this.radius);
		this.gfxDirty = false;
	}

	getAllCollisions() {
		var entity = this;
		var collisions = [];
		this.world.obstacles.forEach(function(object) {
			if (object instanceof Obstacle) {
				object.getSegments().forEach(function(segment){
					if (Util.geom.circleSegIntersect(entity.position, entity.radius, segment[0], segment[1]))
						collisions.push(segment);
				});
			}
		});
		return collisions;
	}

	handleCollision() {

	}
}
