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
			health: 1,
			team: 0,
			radius: 7.5,
			color: Core.color.acc2,
			world: null,
			flocks: false
		}, params);
		super(params);

		this.position = new Vector(params.position);
		this.velocity = new Vector(params.velocity);
		this.health = params.health;
		this.team = params.team;
		this.radius = params.radius;
		this.world = params.world;
		this.color = params.color;
		this.flocks = params.flocks;
		// this.listen("collision", this.handleCollision);

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

	/**
	 * Updates the position and velocity of this entity.
	 * Called by frame()
	 */
	move(dx) {
		let steps = Math.ceil(dx.len()*4);
		let step = dx.div(steps);
		while (steps-- > 0) {
			this.position = this.position.add(step);
			let others = this.getObstacleCollisions();
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

		this.processCollisions(this.velocity);

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
		this.gfx.beginFill(this.color, 0.5);
		this.gfx.lineStyle(1, this.color, 1);
		this.gfx.drawCircle(0, 0, this.radius);
		this.gfx.endFill();
		this.gfxDirty = false;
	}

	/**
	 * Computes any collisions with level obstacles.
	 * Returns a list of collisions.
	 */
	getObstacleCollisions(dx) {
		return this.world.segSpace.getNearby(this, this.radius)
			.filter(seg => Util.geom.circleSegIntersect(this.position, this.radius, seg))
			.map(seg => new Collision({
				self: this,
				type: Collision.SEGMENT,
				object: seg,
				point: null
			}));
	}

	/**
	 * Computes any collisions with entities.
	 * Returns a list of collisions.
	 */
	getEntityCollisions(dx) {
		return this.world.entities
			.filter(ent => ent !== this)
			.filter(ent => ent.position.sub(this.position).len() <= this.radius + ent.radius)
			.map(ent => new Collision({
				self: this,
				type: Collision.ENTITY,
				object: ent,
				point: this.position.add(ent.position).mult(0.5)
			}));
	}

	processCollisions(dx) {
		this.getObstacleCollisions(dx)
			.forEach(other => this.handleObstacleCollision(other));
		this.getEntityCollisions(dx)
			.forEach(other => this.handleEntityCollision(other));
	}

	handleObstacleCollision(other) {

	}

	handleEntityCollision(other) {
		if (this.flocks)
			this.doFlocking(other);
	}

	handleDamage(amount=0, source=null) {
		this.health -= amount;
		if (this.health <= 0)
			this.die();
	}

	/**
	 * A behavior that separates overlapping entities.
	 */
	doFlocking(other) {
		if (other !== this && other.flocks) {
			const dx = other.position.sub(this.position);
			const dist = dx.len();
			if (dist < this.radius + other.radius) {
				const overlap = (this.radius + other.radius) - dist;
				this.velocity = this.velocity.sub(dx.unit().mult(overlap * 0.2));
			}
		}
	}

	die() {
		this.destroy();
	}

	/**
	 * Called to destroy the entity.
	 * Should free resources that will not be GC'd.
	 */
	destroy() {
		if (this.world !== null)
			this.world.removeEntity(this);
		this.gfx.destroy();
	}

	serialize() {
		return {
			_constructor: "Entity",
			position: this.position.serialize(),
			velocity: this.velocity.serialize(),
			health: this.health,
			team: this.team,
			color: this.color,
			radius: this.radius,
			flocks: this.flocks
		};
	}
}
Core.classMap.Entity = Entity;