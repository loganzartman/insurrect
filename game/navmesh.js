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
		this.pathPolys = null;
	}

	rebuild() {
		let t0 = performance.now();
		try {
			this.triangulate();
		} catch (e) {
			console.log("Triangulation failed.");
			return;
		}
		this.buildGraph();
		console.log("NavMesh rebuild took %s ms.", (performance.now()-t0).toFixed(2));
	}

	triangulate() {
		//invert world geometry (compute walkable areas)
		let bounds = this.world.getBounds();
		let polys = this.world.obstacles.map(obstacle => obstacle.poly);
		let holes = Polygon.union(polys, polys);
		holes = Polygon.offset(holes, 3.5);
		holes = Polygon.simplify(holes);

		//this is REALLY bad--fix polygon adjacency test for vertical/horizontal segments
		holes = holes.map(hole => new Polygon(hole.points.map(p => p.add(Vector.random(-0.1,0.1)))))
		
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
		//locate points
		let src = this.polys.find(poly => poly.contains(pointA));
		let dst = this.polys.find(poly => poly.contains(pointB));
		if (typeof src === "undefined")
			throw new Error("Source point not contained in navmesh.");
		if (typeof dst === "undefined")
			throw new Error("Destination point not contained in navmesh.");

		//perform search
		let dist = (a,b) => a.getCentroid().sub(b.getCentroid()).len();
		let heuristic = dist;
		this.pathPolys = this.graph.aStar(src, dst, dist, heuristic); //output polygons
		return this.pathPolys;
	}

	findPath(pointA, pointB) {
		let points = this.findGlobalPath(pointA, pointB)
			.map(poly => poly.getCentroid());
		points.unshift(pointA);
		points.push(pointB);
		
		let out = [points[0]];
		let polys = [this.pathPolys[0]];
		let prev = 0;
		for (let i=1; i<points.length-1; i++) {
			//do LoS testing
			let lineOfSight = new Segment(points[prev], points[i+1]);
			// let segments = this.world.segSpace.getIntersecting(lineOfSight);
			let segments = this.world.obstacles.reduce((s, o) => s.concat(o.getSegments()), []);
			let hit = false;
			for (let segment of segments) {
				if (Util.geom.segSegIntersect(lineOfSight, segment)) {
					hit = true;
					break;
				}
			}
			if (!hit)
				continue;
			
			out.push(points[i]);
			polys.push(this.pathPolys[i]);
			prev = i;
		}
		out.push(points[points.length-1]);
		polys.push(this.pathPolys[this.pathPolys.length-1]);
		this.pathPolys = polys;
		return out;
	}

	drawDebug(gfx) {
		if (!this.polys || !this.DEBUG)
			return;

		//render triangles
		this.polys.forEach(poly => {
			let n = poly.points[0].sub(GameScene.view).sub(GameScene.viewOffset);
			gfx.lineStyle(1, 0xFF0000, 0.25);
			gfx.moveTo(n.x, n.y);
			for (let i=0,j=poly.points.length; i<j; i++) {
				let m = poly.points[(i+1)%j].sub(GameScene.view).sub(GameScene.viewOffset);
				gfx.lineTo(m.x, m.y);
			}
		});

		this.polys.forEach(poly => {
			let n = poly.points[0].sub(GameScene.view).sub(GameScene.viewOffset);
			for (let i=0,j=poly.points.length; i<j; i++) {
				let m = poly.points[(i+1)%j].sub(GameScene.view).sub(GameScene.viewOffset);
				gfx.beginFill(0xFFFF00, 1);
				gfx.drawRect(m.x,m.y,1,1);
				gfx.endFill();
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
