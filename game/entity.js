class Entity extends Emitter {
	/**
	 * Params:
	 * position: (required) the position of this Entity in the world
	 * velocity: the current velocity of this Entity
	 * radius: the radius of this Entity for collision checks
	 * world: reference to the World in which this Entity currently exists
	 * color: color used to tint this Entity
	 */
	constructor(params) {
		if (!params.hasOwnProperty("position"))
			throw new Error("Entity must have position");
		params = Object.assign({
			velocity: new Vector(0,0),
			radius: 4,
			color: Core.color.acc2,
			world: null
		}, params);
		super(params);

		this.position = params.position;
		this.velocity = params.velocity;
		this.radius = params.radius;
		this.world = params.world;
		this.color = params.color;
		this.listen("collision", this.handleCollision);

		this.t0 = this.world.time;
		this.gfx = new PIXI.Graphics();
		this.gfxDirty = true;
	}

	set radius(val) {
		this._radius = val;
		this.gfxDirty = true;
	}

	get radius() {
		return this._radius;
	}

	set color(val) {
		this._color = val;
		this.gfxDirty = true;
	}

	get color() {
		return this._color;
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
				var minstep = others[0].object.b.sub(others[0].object.a).project(step);
				others.forEach(function(coll){
					var nstep = coll.object.b.sub(coll.object.a).project(step);
					if (nstep.len() < minstep.len())
						minstep = nstep;
				});
				step = minstep.unit().mult(step.len());
				this.emit("collision", others);
			}
		}
	}

	frame(timescale, ticks) {
		this.emit("frameStart");
		if (!this.velocity.isZero())
			this.move(this.velocity.mult(timescale));
		this.emit("frameEnd");
	}

	draw() {
		this.gfx.position.x = this.position.x;
		this.gfx.position.y = this.position.y;

		if (!this.gfxDirty)
			return;
		this.gfx.clear();
		this.gfx.lineStyle(1, this.color, 1);
		this.gfx.drawCircle(0, 0, this.radius);
		this.gfxDirty = false;
	}

	getAllCollisions() {
		var entity = this;
		var collisions = [];
		this.world.obstacles.forEach(function(object) {
			if (object instanceof Obstacle) {
				object.getSegments().forEach(function(segment){
					if (Util.geom.circleSegIntersect(entity.position, entity.radius, segment))
						collisions.push(new Collision({
							self: this,
							type: Collision.SEGMENT,
							object: segment,
							point: null
						}));
				});
			}
		});
		return collisions;
	}

	handleCollision() {

	}
}
