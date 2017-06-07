class PathTestEntity extends Entity {
	constructor(params) {
		params = Object.assign({
			color: 0x00FFFF,
			target: params.world.player
		}, params);
		super(params);
		this.target = params.target;
		this.route = [];
	}

	draw() {
		if (!this.gfxDirty || !(this.route instanceof Array) || this.route.length === 0)
			return;
		this.gfx.clear();
		this.gfx.lineStyle(1, this.color, 1);
		
		this.gfx.moveTo(this.route[0].x, this.route[0].y);
		for (let i=1; i<this.route.length; i++)
			this.gfx.lineTo(this.route[i].x, this.route[i].y);

		this.gfx.drawCircle(this.position.x,this.position.y,this.radius);
		this.gfx.lineStyle(1, 0xFF7700, 1);
		this.route.forEach(point => this.gfx.drawRect(point.x,point.y,1,1));
		this.gfx.position.x = 0;
		this.gfx.position.y = 0;
	}

	frame(timescale, ticks) {
		try {
			this.route = this.world.navmesh.findPath(this.position, this.target.position);
			this.color = 0x00FFFF;
		}
		catch (e){
			this.color = 0x770000;
		}
		this.gfxDirty = true;
		super.frame.apply(this, arguments);
	}
}