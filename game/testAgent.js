class TestAgent extends Agent {
	constructor(params) {
		params = Object.assign({
			color: 0x007070,
			maxSpeed: 1,
			acceleration: 0.3,
			deceleration: 0.05
		}, params);
		super(params);
		this.target = this.world.player;
	}

	frame(timescale, ticks) {
		let dist = this.target.position.sub(this.position).len();
		if (!this.isMoving() && dist > 20)
			this.setTarget(this.target);
		else if (this.isMoving() && dist < 20)
			this.stopMoving();

		super.frame.apply(this, arguments);
	}

	draw() {
		this.gfxDirty = true;
		this.gfx.clear();
		PathTestEntity.prototype.draw.apply(this, arguments);
		this.gfx.lineStyle(1, this.color, 1);
		this.gfx.drawCircle(this.position.x,this.position.y,this.radius);
	}

	serialize() {
        let data = super.serialize.apply(this, arguments);
        return Object.assign(data, {
            _constructor: "TestAgent"
        });
    }
}
Core.classMap.TestAgent = TestAgent;