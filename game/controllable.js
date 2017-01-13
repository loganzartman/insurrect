/**
 * Represents an Entity that can be controlled by a set of arbitrary inputs.
 * Use cases: Player, Hostile AIs
 */
class Controllable extends Entity {
	/**
	 * Params:
	 * acceleration: rate of acceleration in pixels/s
	 * deceleration: rate of deceleration when no movement input provided
	 * maxSpeed: maximum speed in pixels/s
	 */
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

	/**
	 * "Fires" whatever item the Entity is using.
	 * Called by Controllable.frame
	 * @param lookVector a vector representing the direction the Entity is aiming
	 */
	fire(lookVector) {

	}

	/**
	 * Accepts an object containing any or all of the supported inputs.
	 * Applies these inputs.
	 * @param inputs current input values
	 */
	handleInputs(inputs) {
		this.input = Object.assign(this.input, inputs);
	}
}