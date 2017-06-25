class Guard extends Agent {
	constructor(params) {
		params = Object.assign({
			color: Core.color.acc1,
			maxSpeed: Util.rand(0.9,1.1),
			acceleration: Util.rand(0.25,0.35),
			deceleration: 0.1,
			fireInterval: 10,
			mode: Guard.mode.WAIT,
			patrolRoute: [],
			wanderRange: 64,
			suspectRange: 110,
			targetRange: Util.rand(70,110),
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
	}

	frame(timescale, ticks) {
		if (this.target === null)
			this.target = this.world.player;

		//update decision timer
		this.timer -= ticks;
		if (this.timer < 0)
			this.timer = 0;

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
	}

	fire(lookVector) {
		let ent = new Projectile({
			position: this.position.clone(),
			velocity: Vector.fromDir(
				lookVector.dir() + Math.random()*0.2 - 0.1,
				23 + Math.random()*5
			),
			elasticity: 0.3,
			friction: 0.2,
			life: 0.6,
			radius: 0.5,
			world: this.world,
			color: Core.color.acc2
		});
		this.world.addEntity(ent);

		super.fire.apply(this, arguments);
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