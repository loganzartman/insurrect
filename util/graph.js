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
	
	aStar(start, goal, dist, heuristic) {
		let open = new TinyQueue([], (a,b) => a._f-b._f);
		start._f = 0;
		open.push(start);

		let cameFrom = new Map();
		cameFrom.set(start, null);
		let currentCost = new Map();
		currentCost.set(start, 0);

		//perform search
		while (open.length > 0) {
		    let current = open.pop();
		    if (current === goal)
		    	break;

		    for (let next of this.neighbors(current)) {
		    	let newCost = currentCost.get(current) + dist(current, next);
		    	if (!currentCost.has(next) || newCost < currentCost.get(next)) {
		    		currentCost.set(next, newCost);
		    		let priority = newCost + heuristic(goal, next);
		    		next._f = priority;
		    		open.push(next);
		    		cameFrom.set(next, current);
		    	}
		    }
		}

		//reconstruct path
		let path = [goal];
		let node = goal;
		while (node !== start) {
			node = cameFrom.get(node);
			path.unshift(node);
			if (node === null)
				throw new Error("bad path");
		}

		return path;
	}
}