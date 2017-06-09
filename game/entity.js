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
			world: null,
			flocks: true
		}, params);
		super(params);

		this.position = params.position;
		this.velocity = params.velocity;
		this.radius = params.radius;
		this.world = params.world;
		this.color = params.color;
		this.flocks = params.flocks;
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
		let steps = Math.ceil(dx.len()*4);
		let step = dx.div(steps);
		while (steps-- > 0) {
			this.position = this.position.add(step);
			let others = this.getAllCollisions();
			let walls = others.filter(x => x.type === Collision.SEGMENT).map(x => x.object);
			if (walls.length > 0) {
				this.position = this.position.sub(step);
				
				let wall;
				if (walls.length > 1)
					wall = walls[Math.floor(Math.random()*walls.length)];
				else
					wall = walls[0];

				let wallDir = wall.b.sub(wall.a);
				let newStep = wallDir.unit().project(step.unit());
				step = newStep.mult(step.len());
			}
		}
	}

	frame(timescale, ticks) {
		this.emit("frameStart");
		if (!this.velocity.isZero())
			this.move(this.velocity.mult(timescale));
		if (this.flocks) {
			this.world.entities.forEach(other => {
				if (other !== this && other.flocks) {
					let dx = other.position.sub(this.position);
					let dist = dx.len();
					if (dist < this.radius + other.radius) {
						let overlap = (this.radius + other.radius) - dist;
						this.velocity = this.velocity.sub(dx.unit().mult(overlap * 0.2));
					}
				}
			})
		}
		this.emit("frameEnd");
	}

	draw() {
		this.gfx.position.x = this.position.x;
		this.gfx.position.y = this.position.y;

		if (!this.gfxDirty)
			return;
		this.gfx.clear();
		this.gfx.beginFill(this.color, 0.5);
		this.gfx.lineStyle(1, this.color, 1);
		this.gfx.drawCircle(0, 0, this.radius);
		this.gfx.endFill();
		this.gfxDirty = false;
	}

	getAllCollisions() {
		var entity = this;
		var collisions = [];
		this.world.segSpace.getNearby(this, this.radius).forEach(function(segment) {
			if (Util.geom.circleSegIntersect(entity.position, entity.radius, segment))
				collisions.push(new Collision({
					self: this,
					type: Collision.SEGMENT,
					object: segment,
					point: null
				}));
		});
		return collisions;
	}

	handleCollision() {

	}
}
