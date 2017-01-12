class Controllable extends Entity {
	constructor(params) {
		params = Object.assign({
			maxSpeed: 1.7,
			acceleration: 0.4,
			deceleration: 0.4
		}, params);
		super(params);
		this.acceleration = params.acceleration;
		this.deceleration = params.deceleration;
		this.maxSpeed = params.maxSpeed;
		this.input = {
			move: new Vector(0,0),
			look: new Vector(0,0),
			fire: false
		};
		this.listen("input", this.handleInputs);
	}

	frame(timescale) {
		//handle movement input
		var controlled = false;
		if (!this.input.move.isZero()) {
			var acc = this.input.move.unit().mult(this.acceleration);
			this.velocity = this.velocity.add(acc);
			controlled = true;
		}

		//limit speed
		var speed = Math.min(this.maxSpeed, this.velocity.len());
		
		//decelerate if no input
		if (!controlled)
			speed -= this.deceleration;
		speed = Math.max(0, speed);
		
		//apply modified speed
		this.velocity = this.velocity.unit().mult(speed);

		//handle click input
		if (this.input.fire) {
			this.fire(this.input.look);
		}

		super.frame(timescale);
	}

	fire(lookVector) {

	}

	handleInputs(inputs) {
		this.input = Object.assign(this.input, inputs);
	}
}