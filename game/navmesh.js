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

	findGlobalPath(pointA, pointB) {
		let src = this.polys.find(poly => poly.contains(pointA));
		let dst = this.polys.find(poly => poly.contains(pointB));
		return this.aStar(src, dst);
	}

	findPath(pointA, pointB) {
		return this.findGlobalPath(pointA, pointB);
	}

	aStar(start, goal) {
		let closed = new Set();
		let open = new Set();
		open.add(start);

		let cameFrom = new Map();
		let gScore = new Map();
		gScore.set(start, 0);
		let fScore = new Map();
		fScore.set(start, this.aStarDist(start, goal));

		while (open.length > 0) {
			let min = fScore.entries().next().key;
			fScore.entries().forEach(kv => {
				if (kv.value < fScore.get(min))
					min = kv.key;
			});
			let current = min;

			if (current === goal)
				return this.aStarReconstruct(cameFrom, current);

			open.delete(current);
			closed.add(current);
			this.graph.neighbors(current).forEach(neighbor => {
				if (closed.has(neighbor))
					return;
				let newG = gScore.get(current) + this.aStarDist(current, neighbor);
				if (!open.has(neighbor))
					open.add(neighbor);
				else if (newG >= gScore.get(neighbor))
					return;

				cameFrom.set(neighbor, current);
				gScore.set(neighbor, newG);
				fScore.set(gScore.get(neighbor) + this.aStarDist(neighbor, goal));
			});
		}

		return null;
	}

	aStarDist(a, b) {
		return b.getCentroid().sub(a.getCentroid()).len();
	}

	aStarReconstruct(cameFrom, current) {
		let path = [current];
		while (cameFrom.has(current)) {
			current = cameFrom.get(current);
			path.push(current);
		}
		return path;
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
		gfx.lineStyle(1, 0x00FF00, 1);
		for (let i=0,j=this.graph.edges.length; i<j; i+=1) {
			let edge = this.graph.edges[i];
			let cA = edge[0].getCentroid().sub(GameScene.view).sub(GameScene.viewOffset);
			let cB = edge[1].getCentroid().sub(GameScene.view).sub(GameScene.viewOffset);
			gfx.moveTo(cA.x, cA.y);
			gfx.lineTo(cB.x, cB.y);
		}
	}
}