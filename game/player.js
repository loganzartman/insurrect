class Player extends Entity {
	constructor(params) {
		super(params);
	}

	frame(timescale) {
		//handle movement input
		this.velocity.x = this.velocity.y = 0;
		if (Input.keys[Input.key.UP])
			this.velocity.y = -2;
		if (Input.keys[Input.key.LEFT])
			this.velocity.x = -2;
		if (Input.keys[Input.key.DOWN])
			this.velocity.y = 2;
		if (Input.keys[Input.key.RIGHT])
			this.velocity.x = 2;

		//handle click input
		if (Input.mouse.left) {
			var ent = new (class TestProjectile extends Entity {
				 frame(timescale) {
					 super.frame(timescale);
					 if (this.age > 1)
					 	this.world.removeEntity(this);
				 }

				 handleCollision(other) {
					 super.handleCollision(other);
					 this.world.removeEntity(this);
				 }
			})({
				position: this.position.clone(),
				velocity: Vector.fromDir(
					V(Input.mouse.x, Input.mouse.y).add(GameScene.viewOffset).dir() + Math.random()*0.2 - 0.1,
					4+Math.random()*3),
				radius: 2,
				world: this.world
			});
			this.world.addEntity(ent);
		}

		super.frame(timescale);
	}
}
