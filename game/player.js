class Player extends Controllable {
	constructor(params) {
		super(params);
	}

	frame(timescale) {
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
					10 + Math.random()*4
				),
				elasticity: 0.3,
				friction: 0.06,
				life: 1,
				radius: 2,
				world: this.world,
				color: Core.color.acc1
			});
			ent.listen("collision", () => {
				ent.radius /= 2;
			})
			this.world.addEntity(ent);
		}
	}
}
