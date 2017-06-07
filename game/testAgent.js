class TestAgent extends Agent {
	constructor(params) {
		params = Object.assign({
			color: 0x00FFFF,
			maxSpeed: 0.8,
			acceleration: 0.1,
			deceleration: 0.1,
			radius: 5
		}, params);
		super(params);

		//continuously follow target
		this.listen("routeComplete", function(data){
			this.state = Agent.state.FOLLOW;
		});
		this.state = Agent.state.FOLLOW;
	}

	frame(timescale, ticks) {
		switch (this.state) {
			case Agent.state.REST:
				this.color = 0x906000;
				break;
			case Agent.state.FOLLOW:
				this.gfxDirty = true;
				this.color = 0x609000;
				break;
		}
		super.frame.apply(this, arguments);
	}

	draw() {
		this.gfxDirty = true;
		PathTestEntity.prototype.draw.apply(this, arguments);
		this.gfx.lineStyle(1, this.color, 1);
		this.gfx.drawCircle(this.position.x,this.position.y,this.radius);
	}
}