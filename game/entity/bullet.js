class Bullet extends Projectile {
	constructor(params) {
		params = Object.assign({
			friction: 0.01,
			damage: 1,
			team: 0
		}, params);
		super(params);

		this.damage = params.damage;
	}

	handleEntityCollision(coll) {
		const entity = coll.object;
		if (entity.team === this.team)
			return;

		entity.handleDamage(this.damage, this);
		this.destroy();
	}

	serialize() {
		const data = super.serialize.apply(this, arguments);
		return Object.assign(data, {
			_constructor: "Bullet",
			damage: this.damage
		});
	}
}
Core.classMap.Bullet = Bullet;