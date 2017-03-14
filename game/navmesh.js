class NavMesh extends Emitter {
	constructor(params) {
		super(params);
		if (!("world" in params))
			throw new Error("Must specify world.");

		params = Object.assign(params, {
			DEBUG: false
		});

		this.world = params.world;
		this.DEBUG = params.DEBUG;
	}

	rebuild() {
		this.triangulate();
		this.buildGraph();
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

	buildGraph() {
		this.graph = new Graph();
		this.polys.forEach(poly => {
			this.polys.forEach(other => {
				if (poly.adjacentTo(other))
					this.graph.addEdge(poly, other);
			});
		});
	}

	drawDebug(gfx) {
		if (!this.polys || !this.DEBUG)
			return;

		//render triangles
		gfx.lineStyle(1, 0xFF0000, 0.5);
		this.polys.forEach(poly => {
			let n = poly.points[0].sub(GameScene.view).sub(GameScene.viewOffset);
			gfx.moveTo(n.x, n.y);
			for (let i=0,j=poly.points.length; i<j; i++) {
				let m = poly.points[(i+1)%j].sub(GameScene.view).sub(GameScene.viewOffset);
				gfx.lineTo(m.x, m.y);
			}
		});

		//render connections
		let center = (poly) => {
			let z = poly.points;
			return new Vector(
				(z[0].x + z[1].x + z[2].x) / 3,
				(z[0].y + z[1].y + z[2].y) / 3
			);
		};
		gfx.lineStyle(1, 0x00FF00, 1);
		for (let i=0,j=this.graph.edges.length; i<j; i+=1) {
			let edge = this.graph.edges[i];
			let cA = center(edge[0]).sub(GameScene.view).sub(GameScene.viewOffset);
			let cB = center(edge[1]).sub(GameScene.view).sub(GameScene.viewOffset);
			gfx.moveTo(cA.x, cA.y);
			gfx.lineTo(cB.x, cB.y);
		}
	}
}