class Obstacle {
	constructor(params) {
		if (!params.hasOwnProperty("vertices"))
			throw new Error("Obstacle must have vertices!");
		
		params = Object.assign({
			prefabName: null
		}, params);

		this.position = params.position;
		this.vertices = params.vertices.map(v => new Vector(v).add(this.position));
		this.poly = new Polygon(this.vertices);
		this.prefabName = params.prefabName;

		this.gfx = new PIXI.Graphics();
		this.gfx.hitArea = this.poly.toPixiPolygon();
		this.gfx.interactive = true;
		this.gfxDirty = true;
	}

	contains(point) {
		return this.poly.contains(point.x, point.y);
	}

	getBounds() {
		return this.poly.getBounds();
	}

	getSegments() {
		if (!this.hasOwnProperty("segments")) {
			this.segments = this.poly.getSegments();
		}
		return this.segments;
	}

	draw() {
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
	}

	serialize() {
		var data = {
			position: this.position.serialize()
		};

		if (this.prefabName === null) {
			data.type = "obstacle";
			data.vertices = this.vertices.map(
				vertex => vertex.sub(this.position).serialize());
		}
		else {
			data.type = "prefab";
			data.name = this.prefabName;
		}

		return data;
	}
}
