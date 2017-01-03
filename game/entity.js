var Entity = function(params) {
	if (!params.hasOwnProperty("position"))
		throw new Error("Entity must have position");
	if (!params.hasOwnProperty("velocity"))
		params.velocity = V(0,0);
	if (!params.hasOwnProperty("radius"))
		params.radius = 4;
	this.position = params.position;
	this.velocity = params.velocity;
	this.radius = params.radius;
	this.listen("collision", this.handleCollision);

	this.gfx = new PIXI.Graphics();
	this.gfxDirty = true;
};
Entity = Core.mixin(Entity, Emitter);
Entity.prototype.move = function(dx) {
	var steps = Math.ceil(dx.len());
	var step = dx.div(steps);
	while (steps-- > 0) {
		this.position = this.position.add(step);
		var others = this.getAllCollisions();
		if (others.length > 0) {
			this.position = this.position.sub(step);
			var minstep = others[0][1].sub(others[0][0]).project(step);
			others.forEach(function(coll){
				var nstep = coll[1].sub(coll[0]).project(step);
				if (nstep.len() < minstep.len())
					minstep = nstep;
			});
			step = minstep.unit().mult(step.len());
			this.emit("collision", others);
		}
	}
};
Entity.prototype.frame = function(timescale) {
	this.emit("frameStart");
	this.move(this.velocity.mult(timescale));
	this.emit("frameEnd");
};
Entity.prototype.draw = function() {
	this.gfx.position.x = this.position.x;
	this.gfx.position.y = this.position.y;

	if (!this.gfxDirty)
		return;
	this.gfx.clear();
	this.gfx.lineStyle(1, Core.color.acc3, 1);
	this.gfx.drawCircle(0, 0, this.radius);
	this.gfxDirty = false;
};
Entity.prototype.getAllCollisions = function() {
	var entity = this;
	var collisions = [];
	Game.objects.forEach(function(object) {
		if (object instanceof Obstacle) {
			object.getSegments().forEach(function(segment){
				if (Util.geom.circleSegIntersect(entity.position, entity.radius, segment[0], segment[1]))
					collisions.push(segment);
			});
		}
	});
	return collisions;
};
Entity.prototype.handleCollision = function(others) {
	//
};