class Agent extends Controllable {
	constructor(params) {
		params = Object.assign({
			motionTarget: null,
			actionTarget: null
		}, params);
		super(params);
		
		this.motionTarget = params.target;
		this.actionTarget = params.actionTarget;
		this.route = null;
		this.routePolys = null;
		this.destinationPoly = null;

		this.createMotionState();
		this.createActionState();
	}

	/**
	 * Sets a target for this Agent.
	 * The target may have a position (e.g. an Entity) or be vector-like.
	 * This clears the current route.
	 * @param target the target to move to
	 */
	setTarget(target) {
		if ("position" in target)
			this.motionTarget = target;
		else if ("x" in target && "y" in target)
			this.motionTarget = {position: new Vector(target)};
		else
			throw new Error("Failed to set target; must be vector-like or have position.");

		this.route = null;
	}

	/**
	 * Manually sets a route for this Agent.
	 * The route may be any iterable list of waypoints (Vector-like).
	 * The Agent will automatically find a path to each waypoint.
	 * This clears the current target.
	 * @param route an iterable list of waypoints
	 */
	setRoute(route) {
		this.route = [];
		if (!(Symbol.iterator in Object(route)))
			throw new Error("Must pass iterable list of waypoints.");
		for (let point of route) {
			this.route.push(new Vector(point));
		}
		this.motionTarget = null;
	}

	isMoving() {
		return this.motionState.name !== "rest";
	}

	/**
	 * Clears target and route.
	 * The agent will return to the "rest" state.
	 */
	stopMoving() {
		this.motionTarget = null;
		this.route = null;
	}

	stopAction() {
		if (this.actionState.name !== "idle")
			this.actionState.transition("idle");
	}

	setActionTarget(target) {
		if ("position" in target)
			this.actionTarget = target;
		else if ("x" in target && "y" in target)
			this.actionTarget = {position: new Vector(target)};
		else
			throw new Error("Failed to set action target; must be vector-like or have position.");
	}

	attack(target) {
		this.setActionTarget(target);
		if (this.actionState.name === "idle")
			this.actionState.transition("attack");
		else if (this.actionState.name !== "attack")
			this.actionState.transition("idle");
	}

	/**
	 * Initializes the FSM for agent movement.
	 * Called by constructor.
	 */
	createMotionState() {
		this.motionState = new StateMachine();

		let colors = Util.color.hueGenerator(4, Util.color.rgb);

		let restColor = 0x0//colors.next().value;
		let restState = new State({
			name: "rest",
			update: this.motionRest.bind(this),
			onEnter: () => {
				if (Agent.DEBUG)
					this.color = restColor;
			}
		});

		let rerouteColor = 0xFFFF00//colors.next().value;
		let rerouteState = new State({
			name: "reroute",
			onEnter: () => {
				if (Agent.DEBUG)
					this.color = rerouteColor;

				if (this.motionTarget) {
					this.world.navmesh.findPath(this.position, this.motionTarget.position).then(path => {
						if (path !== null) {
							this.route = path;
							let routePolys = this.world.navmesh.pathPolys;
							this.destinationPoly = routePolys[routePolys.length-1];
							this.emit("routeSuccess");
							this.motionState.transition("navigate");
						}
						else {
							this.route = null;
							this.emit("routeFail");
							this.motionState.transition("return");
						}
					});
				}
				else if (this.route) {
					this.world.navmesh.findPath(this.position, this.route[0]).then(path => {
						if (path !== null) {
							this.route.shift();
							this.route = path.concat(this.route);
							let routePolys = this.world.navmesh.pathPolys;
							this.destinationPoly = routePolys[routePolys.length-1];
							this.emit("routeSuccess");
							this.motionState.transition("navigate");
						}
						else {
							this.route = null;
							this.emit("routeFail");
							this.motionState.transition("return");
						}
					});
				}
				else {
					this.motionState.transition("rest");
				}
			}
		});

		let navigateColor = 0xFF00FF//colors.next().value;
		let navigateState = new State({
			name: "navigate",
			update: this.motionNavigate.bind(this),
			onEnter: () => {
				if (Agent.DEBUG)
					this.color = navigateColor;
			},
			onExit: () => {
				if (this.route)
					this.route.shift();
				else
					return;

				//check route move completed
				if (this.route.length === 0) {
					this.route = null;
					this.motionState.transition("rest");
					this.emit("routeComplete");
				}
			}
		});

		let returnColor = 0x0000FF//colors.next().value;
		let returnState = new State({
			name: "return",
			update: this.motionReturn.bind(this),
			onEnter: () => {
				if (Agent.DEBUG)
					this.color = returnColor;
			}
		});

		this.motionState.addStates([restState, rerouteState, navigateState, returnState]);
		this.motionState.addTransitions({
			"rest": ["reroute"],
			"reroute": ["navigate", "return", "rest"],
			"navigate": ["navigate", "reroute", "rest"],
			"return": ["rest"]
		});
		this.motionState.state = restState;
	}

	/**
	 * Initializes the FSM for agent actions.
	 * Called by constructor.
	 */
	createActionState() {
		this.actionState = new StateMachine();

		let idleState = new State({
			name: "idle"
		});

		let attackState = new State({
			name: "attack",
			update: this.actionAttack.bind(this),
			onEnter: () => {this.color = 0xFFFFFF},
			onExit: () => {
				this.emit("input", {
					fire: false
				});
			}
		});

		this.actionState.addStates([idleState, attackState]);
		this.actionState.addTransitions({
			"idle": ["attack"],
			"attack": ["idle"]
		});
		this.actionState.state = idleState;
	}

	frame(timescale, ticks) {
		this.motionState.update();
		this.actionState.update();
		super.frame.apply(this, arguments);
	}

	actionAttack() {
		this.emit("input", {
			look: this.actionTarget.position.sub(this.position),
			fire: true
		});
	}

	motionRest() {
		this.emit("input", {
			move: new Vector()
		});
		if (this.target || this.route && this.route.length > 0)
			this.motionState.transition("reroute");
	}

	motionReturn() {
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
			this.motionState.transition("rest");
		}
	}

	motionNavigate() {
		//determine if route should be recomputed
		if (!this.checkRoute()) {
			this.motionState.transition("reroute");
			return;
		}
		//update ending position to target
		else if (this.route !== null && this.motionTarget) {
			this.route[this.route.length-1] = this.motionTarget.position;
		}

		//test for LoS
		//todo: add
		
		//choose next waypoint
		let waypoint = this.route[0];

		//compute movement
		let dx = waypoint.sub(this.position);
		
		//move to waypoint
		if (dx.len() > this.radius) {
			let move = dx.unit();
			let look = move;
			
			this.emit("input", {
				move: move,
				look: look
			});
		}
		else if (this.route.length > 1) {
			this.motionState.transition("navigate");	
		}
		else {
			this.motionState.transition("rest");
			this.emit("routeComplete");
		}
	}

	/**
	 * Determines whether the current route is valid.
	 * @return whether the Agent has a valid route to its target
	 */
	checkRoute() {
		if (this.route === null)
			return false;
		if (this.route.length === 0)
			return false;
		if (this.destinationPoly === null)
			return false;
		if (this.motionTarget) {
			if (this.destinationPoly.contains(this.motionTarget.position))
				return true;
			else
				return false;
		}
		return true;
	}

    serialize() {
        let data = super.serialize.apply(this, arguments);
        return Object.assign(data, {
            _constructor: "Agent"
        });
    }
}
Agent.DEBUG = false;
Core.classMap.Agent = Agent;