class PathTestEntity extends Entity {
	constructor(params) {
		params = Object.assign({
			color: 0x00FFFF
		}, params);
		super(params);
		this.target = this.world.player;
		this.route = [];
	}

	draw() {
		if (!this.gfxDirty || this.route.length === 0)
			return;
		this.gfx.clear();
		this.gfx.lineStyle(1, 0x00FFFF, 1);
		this.gfx.moveTo(this.position.x, this.position.y);
		this.route.forEach(point => this.gfx.lineTo(point.x, point.y));
		this.gfx.lineTo(this.target.position.x, this.target.position.y);
		this.gfx.drawCircle(0,0,this.radius);
		this.gfx.position.x = 0;
		this.gfx.position.y = 0;
	}

	frame(timescale, ticks) {
		this.route = this.world.navmesh.findPath(this.position, this.target.position);
		this.gfxDirty = true;
		super.frame.apply(this, arguments);
	}
}