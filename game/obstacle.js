class Obstacle {
	constructor(params) {
		if (!params.hasOwnProperty("vertices"))
			throw new Error("Obstacle must have vertices!");
		
		params = Object.assign({
			rotation: 0,
			prefabName: null
		}, params);

		this.position = new Vector(params.position);
		this.rotation = params.rotation;
		
		//save un-transformed vertices
		this.originalVertices = params.vertices.map(v => new Vector(v));

		this.prefabName = params.prefabName;
		this.gfx = new PIXI.Graphics();
		this.gfx.interactive = true;

		this.updateTransform();
	}

	updateTransform() {
		//rotate and offset vertices
		var bounds = new Polygon(this.originalVertices).getBounds();
		var offset = bounds.max.sub(bounds.min).div(-2).sub(bounds.min); //offset to center object on origin
		this.vertices = this.originalVertices.map(v => {
			var centered = v.add(offset); //use centered vertices to perform rotation
			var dir = centered.dir() + this.rotation * Math.PI / 180;
			var len = centered.len();
			return Vector.fromDir(dir, len).add(this.position).sub(offset);
		});

		//construct polygon
		this.poly = new Polygon(this.vertices);

		//update graphics
		this.gfx.hitArea = this.poly.toPixiPolygon();
		this.gfxDirty = true;

		delete this.segments; //one sneaky trick to regenerate segments
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
			data.vertices = this.originalVertices.map(v => v.serialize());
		}
		else {
			data.type = "prefab";
			data.name = this.prefabName;
		}

		return data;
	}
}
