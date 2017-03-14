class Graph {
	constructor() {
		this.nodes = [];
		this.edges = [];
		this.neighborCache = new Map();
	}

	addEdge(a,b) {
		//add nodes if necessary
		if (this.nodes.indexOf(a) < 0)
			this.nodes.push(a);
		if (this.nodes.indexOf(b) < 0)
			this.nodes.push(b);

		//create edges
		this.edges.push([a, b]);
		this.edges.push([b, a]);

		//invalidate cache
		this.neighborCache.delete(a);
		this.neighborCache.delete(b);
	}

	neighbors(a) {
		if (!this.neighborCache.has(a))
			this.neighborCache.set(a, 
				this.edges.filter(e => e[0] === a).map(e => e[1]));
		return this.neighborCache.get(a);
	}
}