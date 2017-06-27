class Guard extends Agent {
	constructor(params) {
		params = Object.assign({
			color: Core.color.acc1,
			maxSpeed: Util.rand(1.5,1.6),
			acceleration: Util.rand(0.2,0.21),
			deceleration: 0.2,
			fireInterval: 10,
			mode: Guard.mode.WAIT,
			patrolRoute: [],
			wanderRange: 128,
			suspectRange: 220,
			targetRange: Util.rand(140,200),
			target: null
		}, params);
		super(params);

		this.basePos = this.position.clone();
		this.patrolRoute = params.patrolRoute.map(x => new Vector(x));
		this.patrolFlip = false;
		this.wanderRange = params.wanderRange;
		this.suspectRange = params.suspectRange;
		this.targetRange = params.targetRange;
		this.target = params.target;
		this.mode = params.mode;
		this.engaged = false;
		this.timer = 0;
		this.suspicion = 0;

		this.fov = Math.PI*0.33;
		this.fos = null;

		this.fovGfx = new PIXI.Graphics();
		this.gfx.addChild(this.fovGfx);
	}

	frame(timescale, ticks) {
		if (this.target === null)
			this.target = this.world.player;

		//update decision timer
		this.timer -= ticks;
		if (this.timer < 0)
			this.timer = 0;

		//recompute what this Guard can see
		this.fos = this.world.getFoS({
			from: this.position,
			range: this.suspectRange,
			lookAngle: this.input.look.dir(),
			fov: this.fov
		});
		let contains = this.fos.find(x => x.contains(this.target.position));

		//update suspicion value
		this.updateSuspicion(timescale, ticks);

		//engaged behaviour
		if (this.engaged)
			this.doEngage();
		//idle behavior
		else
			this.doIdle();

		super.frame.apply(this, arguments);
	}

	doEngage() {
		let dist = this.target.position.sub(this.position).len();

		if (dist < this.targetRange && this.world.checkLoS(this.position, this.target.position)) {
			this.stopMoving();
			this.attack(this.target);
		}
		else if (!this.isMoving()) {
			this.stopAction();
			this.setRoute([this.target.position]);
		}
	}

	doIdle() {
		switch (this.mode) {
			case Guard.mode.WAIT:
				this.stopMoving();
			break;

			case Guard.mode.WANDER:
				if (!this.isMoving() && this.timer <= 0) {
					//find nearby NavMesh points
					let points = this.world.navmesh.centers
						.filter(c => c.sub(this.basePos).len() <= this.wanderRange);
					
					//if there are any points, choose one and move to it.
					if (points.length > 0) {
						this.setTarget(points.random());
					}
					this.timer = Math.floor(Util.rand(20,120));
				}
			break;

			case Guard.mode.PATROL:
				if (!this.isMoving()) {
					//restart patrol route in opposite direction
					let route = this.patrolRoute.map(x => x);
					this.route = this.patrolFlip ? route.reverse() : route;
					this.patrolFlip = !this.patrolFlip;
				}
			break;
		}
	}

	updateSuspicion(timescale, ticks) {
		let dist = this.target.position.sub(this.position).len();

		//update suspicion
		if (dist < this.suspectRange) {
			if (this.engaged)
				this.suspicion = 1;
			else
				this.suspicion = Math.min(this.suspicion + this.target.suspiciousness/Game.targetFps, 1);
		}
		else
			this.suspicion = Math.max(this.suspicion - ticks*0.1/Game.targetFps, 0);

		//toggle engagement based on suspicion level
		if (this.suspicion >= 1) {
			this.engaged = true;
		}
		if (this.engaged && this.suspicion < 0.1) {
			this.engaged = false;
			this.route = [];
		}
	}

	draw() {
		this.gfxDirty = true;
		super.draw.apply(this, arguments);
		
		const min = 0.1;
		if (this.suspicion > min) {
			this.gfx.lineStyle(2, Core.color.acc1, 0.7);
			const start = 0.5*Math.PI;
			this.gfx.arc(0,0,this.radius+1,start-Math.PI*this.suspicion,start+Math.PI*this.suspicion);
		}

		this.drawFoV();
	}

	drawFoV() {
		const bg = Core.color.acc2;
		const fg = Core.color.acc2b;

		this.fovGfx.clear();
		this.fos.forEach(poly => {
			let point0 = poly.points[0].sub(this.position);
			this.fovGfx.beginFill(bg, 0.25);
			this.fovGfx.moveTo(point0.x, point0.y);
			for (let i=1; i<poly.points.length; i++) {
				let point = poly.points[i].sub(this.position);
				this.fovGfx.lineTo(point.x, point.y);
			}
			this.fovGfx.endFill();

			for (let i=0; i<poly.points.length; i++) {
				let pointA = poly.points[i].sub(this.position);
				let pointB = poly.points[(i+1)%poly.points.length].sub(this.position);
				
				this.fovGfx.lineStyle(1, fg, 1);
				this.fovGfx.moveTo(pointA.x, pointA.y);
				this.fovGfx.lineTo(pointB.x, pointB.y);
			}
		});
	}

	fire(lookVector) {
		let ent = new Projectile({
			position: this.position.clone(),
			velocity: Vector.fromDir(
				lookVector.dir() + Math.random()*0.2 - 0.1,
				46 + Math.random()*10
			),
			elasticity: 0.3,
			friction: 0.4,
			life: 0.6,
			radius: 0.5,
			world: this.world,
			color: Core.color.acc2
		});
		this.world.addEntity(ent);

		super.fire.apply(this, arguments);
	}

	destroy() {
		super.destroy.apply(this, arguments);
		this.fovGfx.destroy();
	}

	serialize() {
        let data = super.serialize.apply(this, arguments);
        return Object.assign(data, {
            _constructor: "Guard",
			mode: this.mode,
			patrolRoute: this.patrolRoute.map(x => x.serialize()),
			wanderRange: this.wanderRange,
			suspectRange: this.suspectRange,
			targetRange: this.targetRange
        });
    }
}
Guard.mode = {
	WAIT: 0,
	WANDER: 1,
	PATROL: 2
};
Core.classMap.Guard = Guard;