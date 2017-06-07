class TestAgent extends Agent {
	constructor(params) {
		params = Object.assign({
			color: 0x007070,
			maxSpeed: 1,
			acceleration: 0.3,
			deceleration: 0.05
		}, params);
		super(params);

		this.state = Agent.state.FOLLOW;
	}

	frame(timescale, ticks) {
		let dist = this.target.position.sub(this.position).len();
		if (this.state === Agent.state.REST && dist > 20)
			this.state = Agent.state.FOLLOW;
		else if (this.state === Agent.state.FOLLOW && dist <= 20)
			this.state = Agent.state.REST;

		super.frame.apply(this, arguments);
	}
}