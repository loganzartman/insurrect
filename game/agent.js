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
				this.doFollow();
				break;
			case Agent.state.RETURN:
				this.doReturn();
		}

		if (Agent.DEBUG) {
			switch (this.state) {
				case Agent.state.REST:
					this.color = 0x700040;
					break;
				case Agent.state.FOLLOW:
					this.color = 0xA00000;
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
		
		if (dx.len() > this.radius) {
			let move = dx.unit();
			let look = move;
			this.emit("input", {
				move: move,
				look: look,
				fire: false
			});
		}
		else {
			this.route = null;
			this.state = Agent.state.FOLLOW;
		}
	}

	doFollow() {
		if (this.target === null || this.route === null)
			return false;
		console.log("following");
		
		let waypoint = this.route[0];
		let waypoly = this.routePolys[0];

		//if the agent has been moved outside of its route, invalidate it.
		if (false && !waypoly.contains(this.position)) {
			this.route = null;
			return;
		}

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
			this.routePolys.shift();

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

	draw() {
		if (Agent.DEBUG) {
			this.gfxDirty = true;
			this.gfx.clear();
			PathTestEntity.prototype.draw.apply(this, arguments);
			this.gfx.lineStyle(1, this.color, 1);
			this.gfx.drawCircle(this.position.x,this.position.y,this.radius);
		}
		else
			super.draw.apply(this, arguments);
	}
}
Agent.DEBUG = false;
Agent.state = {
	REST: 0,
	FOLLOW: 1,
	RETURN: 2
};