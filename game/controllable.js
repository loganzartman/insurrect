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
			deceleration: 0.2,
			fireInterval: 0,
			fireCount: 1
		}, params);
		super(params);
		this.acceleration = params.acceleration;
		this.deceleration = params.deceleration;
		this.maxSpeed = params.maxSpeed;
		this.fireInterval = params.fireInterval;
		this.fireCount = params.fireCount;
		this.fireTimer = 0;
		this.input = {
			move: new Vector(0,0),
			look: new Vector(0,0),
			fire: false
		};
		this.listen("input", this.handleInputs);
		this.indicatorGfx = new PIXI.Graphics();
		this.gfx.addChild(this.indicatorGfx);
	}

	frame(timescale, ticks) {
		//handle fire timer
		this.fireTimer = Math.max(0, this.fireTimer - ticks);

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
		if (this.input.fire && this.fireTimer === 0) {
			for (let i=0; i<ticks*this.fireCount; i++)
				this.fire(this.input.look);
			this.fireTimer = this.fireInterval;
		}

		super.frame(timescale, ticks);
	}

	/**
	 * "Fires" whatever item the Entity is using.
	 * Called by Controllable.frame
	 * @param lookVector a vector representing the direction the Entity is aiming
	 */
	fire(lookVector) {

	}

	draw() {
		this.indicatorGfx.rotation = this.input.look.dir();
		
		let dirty = this.gfxDirty;
		super.draw.apply(this, arguments);
		if (dirty) {
			this.indicatorGfx.clear();
			this.indicatorGfx.lineStyle(2, this.color, 1);
			this.indicatorGfx.moveTo(this.radius*0.2,0);
			this.indicatorGfx.lineTo(this.radius*0.8,0);
		}
	}

	/**
	 * Accepts an object containing any or all of the supported inputs.
	 * Applies these inputs.
	 * @param inputs current input values
	 */
	handleInputs(inputs) {
		this.input = Object.assign(this.input, inputs);
	}

	serialize() {
		let data = super.serialize.apply(this, arguments);
		return Object.assign(data, {
			_constructor: "Controllable",
			maxSpeed: this.maxSpeed,
			acceleration: this.acceleration,
			deceleration: this.deceleration,
			fireInterval: this.fireInterval,
			fireCount: this.fireCount
		});
	}
}
Core.classMap.Controllable = Controllable;