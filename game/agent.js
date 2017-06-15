class Agent extends Controllable {
	constructor(params) {
		params = Object.assign({
			target: null
		}, params);
		super(params);
		
		this.target = params.target;
		this.route = null;
		this.routePolys = null;
		this.destinationPoly = null;
		this.state = Agent.state.REST;
	}

	frame(timescale, ticks) {
		switch (this.state) {
			case Agent.state.REST:
				this.doRest();
				break;
			case Agent.state.FOLLOW:
				this.updateRoute();
			case Agent.state.NAVIGATE:
				this.doNavigate();
				break;
			case Agent.state.ATTACK:
				this.doAttack();
				break;
			case Agent.state.RETURN:
				this.doReturn();
				break;
		}

		if (Agent.DEBUG) {
			switch (this.state) {
				case Agent.state.REST:
					this.color = 0x700040;
					break;
				case Agent.state.FOLLOW:
				case Agent.state.NAVIGATE:
					this.color = 0xA00000;
					break;
				case Agent.state.ATTACK:
					this.color = 0xFF0000;
					break;
				case Agent.state.RETURN:
					this.color = 0xA0A000;
					break;
			}
		}

		super.frame.apply(this, arguments);
	}

	doRest() {
		this.emit("input", {
			move: new Vector(),
			fire: false
		});
	}

	doAttack() {
		this.emit("input", {
			move: new Vector(),
			look: this.target.position.sub(this.position),
			fire: true
		});
	}

	doReturn() {
		if (this.route === null) {
			let nearest = this.world.navmesh.centers[0];
			let minDist = Infinity;
			this.world.navmesh.centers.forEach(point => {
				let dist = point.sub(this.position).len();
				if (dist < minDist) {
					nearest = point;
					minDist = dist;
				}
			});
			this.route = [nearest];
		}

		let dx = this.route[0].sub(this.position);
		
		if (!this.world.navmesh.polys.find(x => x.contains(this.position))) {
			this.position = this.position.add(Vector.fromDir(dx.dir(), 2));
		}
		else {
			this.route = null;
			this.state = Agent.state.REST;
		}
	}

	doNavigate() {
		if (this.route === null)
			return false;
		
		let waypoint = this.route[0];
		// let waypoly = this.routePolys[0];

		//if the agent has been moved outside of its route, invalidate it.
		// if (!waypoly.contains(this.position)) {
		// 	this.route = null;
		// 	return;
		// }

		//compute movement
		let dx = waypoint.sub(this.position);
		
		//move to waypoint
		if (dx.len() > this.radius) {
			let move = dx.unit();
			let look = move;
			
			this.emit("input", {
				move: move,
				look: look,
				fire: false
			});
		}

		//waypoint move completed
		else {
			this.route.shift();
			// this.routePolys.shift();

			//check route move completed
			if (this.route.length === 0) {
				this.route = null;
				this.state = Agent.state.REST;
				this.emit("routeComplete");
			}
		}
	}

	/**
	 * Determines whether the current route is valid.
	 * @return whether the Agent has a valid route to its target
	 */
	checkRoute() {
		if (this.target === null)
			return true;
		if (this.route === null)
			return false;
		if (this.destinationPoly === null)
			return false;
		if (this.destinationPoly.contains(this.target.position))
			return true;
		return false;
	}

	/**
	 * Ensures that the route is up to date, if necessary.
	 */
	updateRoute() {
		//determine if route should be recomputed
		if (!this.checkRoute()) {
			try {
				this.route = this.world.navmesh.findPath(this.position, this.target.position);
				this.routePolys = this.world.navmesh.pathPolys;
				this.destinationPoly = this.routePolys[this.routePolys.length-1];
				this.emit("routeSuccess");
			}
			catch (e){
				this.route = null;
				this.state = Agent.state.RETURN;
				this.emit("routeFail");
			}
		}
		//update ending position to target
		else if (this.route !== null) {
			this.route[this.route.length-1] = this.target.position;
		}
	}
}
Agent.DEBUG = false;
Agent.state = {
	REST: 0,
	RETURN: 1,
	NAVIGATE: 2,
	FOLLOW: 3,
	ATTACK: 4
};