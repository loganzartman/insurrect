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
			suspectRange: 64,
			targetRange: Util.rand(80,140)
		}, params);
		super(params);

		this.basePos = this.position.clone();
		this.patrolRoute = params.patrolRoute;
		this.patrolFlip = false;
		this.wanderRange = params.wanderRange;
		this.suspectRange = params.suspectRange;
		this.targetRange = params.targetRange;
		this.mode = params.mode;
		this.engaged = false;
		this.timer = 0;
		this.suspicion = 0;
	}

	frame(timescale, ticks) {
		this.timer -= ticks;
		if (this.timer < 0)
			this.timer = 0;

		if (this.state === Agent.state.RETURN) {
			super.frame.apply(this, arguments);
			return;
		}

		let dist = this.world.player.position.sub(this.position).len();

		//update suspicion
		if (dist < this.suspectRange)
			this.suspicion = Math.min(this.suspicion + this.world.player.suspiciousness/Game.targetFps, 1);
		else
			this.suspicion = Math.max(this.suspicion - ticks*0.1/Game.targetFps, 0);

		if (this.suspicion >= 1) {
			this.engaged = true;
		}
		if (this.engaged && this.suspicion < 0.1) {
			this.engaged = false;
			this.state = Agent.state.REST;
		}

		//engaged behaviour
		if (this.engaged) {
			this.target = this.world.player;
			if (dist < this.targetRange) {
				let los = new Segment(this.position, this.target.position);
				if (!Segment.hitsAny(los, this.world.segSpace.getIntersecting(los)))
					this.state = Agent.state.ATTACK;
				else
					this.state = Agent.state.FOLLOW;
			}
			else
				this.state = Agent.state.FOLLOW;
		}
		//idle behavior
		else {
			switch (this.mode) {
				case Guard.mode.WAIT:
					this.state = Agent.state.REST;
					break;

				case Guard.mode.WANDER:
					if (this.state === Agent.state.REST && this.timer === 0) {
						let points = this.world.navmesh.centers
							.filter(c => c.sub(this.basePos).len() <= this.wanderRange)
							.filter(c => {
								let los = new Segment(this.position, c);
								let segs = this.world.segSpace.getIntersecting(los);
								return !Segment.hitsAny(los, segs);
							});
						if (points.length > 0) {
							this.route = [points[Math.floor(Math.random()*points.length)]];
							this.state = Agent.state.NAVIGATE;
						}
						this.timer = Math.floor(Util.rand(20,120));
					}
					break;

				case Guard.mode.PATROL:
					if (this.state === Agent.state.REST) {
						let route = this.patrolRoute.map(x => x);
						this.route = this.patrolFlip ? route.reverse() : route;
						this.state = Agent.state.NAVIGATE;
					}
					break;
			}
		}

		super.frame.apply(this, arguments);
	}

	draw() {
		this.gfxDirty = true;
		super.draw.apply(this, arguments);
		
		const min = 0.1;
		if (this.suspicion > min) {
			this.gfx.lineStyle(1, Core.color.acc1b, 1);
			const start = 0.5*Math.PI;
			this.gfx.arc(0,0,this.radius+2,start-Math.PI*this.suspicion,start+Math.PI*this.suspicion);
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
}
Guard.mode = {
	WAIT: 0,
	WANDER: 1,
	PATROL: 2
};