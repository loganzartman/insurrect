class Player extends Controllable {
	constructor(params) {
		super(params);
	}

	frame(timescale) {
		//calculate movement input
		var move = new Vector(0,0);
		if (Input.keys[Input.key.UP])
			move.y -= 2;
		if (Input.keys[Input.key.DOWN])
			move.y += 2;
		if (Input.keys[Input.key.LEFT])
			move.x -= 2;
		if (Input.keys[Input.key.RIGHT])
			move.x += 2;
		
		//calculate look direction
		var look = new Vector(Input.mouse.x, Input.mouse.y)
			.add(GameScene.viewOffset);

		//apply inputs
		this.emit("input", {
			move: move,
			look: look,
			fire: Input.mouse.left
		});

		super.frame(timescale);
	}

	fire(lookVector) {
		for (let i=0; i<2; i++) {
			let ent = new Projectile({
				position: this.position.clone(),
				velocity: Vector.fromDir(
					lookVector.dir() + Math.random()*0.2 - 0.1,
					4 + Math.random()*3
				),
				radius: 2,
				world: this.world,
				color: Core.color.acc1
			});
			this.world.addEntity(ent);
		}
	}
}
