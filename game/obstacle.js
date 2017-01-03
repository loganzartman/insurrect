var Obstacle = function(params) {
	if (!params.hasOwnProperty("vertices"))
		throw new Error("Obstacle must have vertices!");
	this.position = params.position;
	this.vertices = params.vertices.map(
		v => V(v.x + this.position.x, v.y + this.position.y)
	);
	this.poly = new Polygon(this.vertices);
	Object.keys(params).forEach(function(key){
		this[key] = params[key];
	});

	this.gfx = new PIXI.Graphics();
	this.gfx.hitArea = this.poly;
	this.gfx.interactive = true;
	this.gfx.on("mouseover", function(){
		this.gfx.tint = 0xFF0000;
	});
	this.gfx.on("mouseout", function(){
		this.gfx.tint = 0xFFFFFF;
	});
	this.gfxDirty = true;
};
Obstacle.prototype.contains = function(point) {
	return this.poly.contains(point.x, point.y);
};
Obstacle.prototype.getSegments = function() {
	if (!this.hasOwnProperty("segments")) {
		this.segments = this.poly.getSegments();
	}
	return this.segments;
};
Obstacle.prototype.draw = function() {
	if (!this.gfxDirty)
		return;
	this.gfx.clear();
	this.gfx.lineStyle(1, Core.color.acc2b, 1);
	this.gfx.beginFill(Core.color.acc2, 1);
	this.gfx.moveTo(this.vertices[0].x, this.vertices[0].y);
	for (var i=1; i<this.vertices.length; i++)
		this.gfx.lineTo(this.vertices[i].x, this.vertices[i].y);
	this.gfx.lineTo(this.vertices[0].x, this.vertices[0].y);
	this.gfx.endFill();
	this.gfxDirty = false;
};
