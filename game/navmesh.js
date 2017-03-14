class NavMesh extends Emitter {
	constructor(params) {
		super(params);
		if (!("world" in params))
			throw new Error("Must specify world.");

		this.world = params.world;
	}

	rebuild() {
		this.triangulate();
	}

	triangulate() {
		//invert world geometry (compute walkable areas)
		let bounds = this.world.getBounds();
		let polys = this.world.obstacles.map(obstacle => obstacle.poly);
		polys = Polygon.offset(polys, 1);
		let holes = Polygon.union(polys, polys);
		holes = Polygon.simplify(holes);
		holes.forEach(hole => bounds.addHole(hole));
		this.polys = holes;

		//triangulate walkable area
		let ctx = bounds.toP2TContext();
		ctx.triangulate();
		let triangles = ctx.getTriangles();
		let output = triangles.map(tri => Polygon.fromP2TTriangle(tri));
		this.polys = output;
	}

	drawDebug(gfx) {
		if (!this.polys)
			return;
		gfx.lineStyle(1, 0xFF0000, 0.5);
		this.polys.forEach(poly => {
			let n = poly.points[0].sub(GameScene.view).sub(GameScene.viewOffset);
			gfx.moveTo(n.x, n.y);
			for (let i=0,j=poly.points.length; i<j; i++) {
				let m = poly.points[(i+1)%j].sub(GameScene.view).sub(GameScene.viewOffset);
				gfx.lineTo(m.x, m.y);
			}
		});
	}
}