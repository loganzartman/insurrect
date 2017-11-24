class Player extends Controllable {
	constructor(params) {
		params = Object.assign({
			fireInterval: 16,
			fireCount: 8
		}, params);
		super(params);
		this.suspiciousness = 0;
	}

	frame(timescale, ticks) {
		//calculate movement input
		var move = new Vector(0,0);
		if (Input.keys[Input.key.UP])
			move.y -= 1;
		if (Input.keys[Input.key.DOWN])
			move.y += 1;
		if (Input.keys[Input.key.LEFT])
			move.x -= 1;
		if (Input.keys[Input.key.RIGHT])
			move.x += 1;
		
		//calculate look direction
		var look = new Vector(Input.mouse.x, Input.mouse.y)
			.add(GameScene.viewOffset).sub(GameScene.viewTarget).add(GameScene.view);

		//apply inputs
		this.emit("input", {
			move: move,
			look: look,
			fire: Input.mouse.left
		});

		super.frame(timescale, ticks);
	}

	fire(lookVector) {
		let ent = new Bullet({
			position: this.position.clone(),
			velocity: Vector.fromDir(lookVector.dir() + Util.rand(-0.05,0.05), 40),
			elasticity: 0.5,
			friction: 0.02,
			life: 1,
			radius: 0.5,
			world: this.world,
			team: 0,
			color: Core.color.acc1
		});
		this.world.addEntity(ent);
	}

	serialize() {
		let data = super.serialize.apply(this, arguments);
		return Object.assign(data, {
			_constructor: "Player"
		});
	}
}
Core.classMap.Player = Player;