class StateMachine extends Emitter {
	constructor(params) {
		super(params);
		this._state = null;
		this.states = new Set();
		this.transitions = new Map();
	}

	set state(x) {
		if (!(x instanceof State))
			throw new Error("Must pass a state");
		if (this._state !== null)
			console.warn("Assigned state without transitioning");
		this._state = x;
		this._state.emit("enter");
	}

	get state() {
		return this._state;
	}

	get name() {
		return this._state.name;
	}

	/**
	 * Gets a state by name
	 */
	stateByName(name) {
		for (let state of this.states)
			if (state.name === name)
				return state;
		return null;
	}

	update() {
		this.state.update();
	}

	/**
	 * @param state a State to add
	 * @return whether the state was added
	 */
	addState(state) {
		if (this.states.has(state))
			return false;
		this.states.add(state);
		return true;
	}

	addStates(states) {
		states.forEach(s => this.addState(s));
	}

	/**
	 * Creates a transition
	 * @param from the name of a State
	 * @param to the name of a State
	 * @return whether the transition was added
	 */
	addTransition(from, to) {
		from = this.stateByName(from);
		to = this.stateByName(to);

		if (!from || !to)
			return false;
		if (!this.transitions.has(from))
			this.transitions.set(from, new Set());
		this.transitions.get(from).add(to);
		return true;
	}

	addTransitions(map) {
		Object.keys(map).forEach(k => {
			map[k].forEach(v => {
				this.addTransition(k, v);
			});
		});
	}

	/**
	 * See if it is possible to make a transition
	 * @param to the destination State (NOT its name)
	 * @return whether the transition could be made
	 */
	canTransition(state) {
		if (!state)
			return false;
		if (!this.transitions.has(this.state))
			return false;
		if (!this.transitions.get(this.state).has(state))
			return false;
		return true;
	}

	/**
	 * Move from current state to another if transition exists
	 * THROWS if the transition does not exist.
	 * @param to name of destination State
	 */
	transition(to) {
		to = this.stateByName(to);

		if (!this.canTransition(to))
			throw new Error(`Transition from ${this.name} to ${to.name} does not exist.`);
		this.state.exit();
		this._state = to;
		this.state.enter();
		return true;
	}
}

/**
 * Events:
 * - enter
 * - exit
 */
class State extends Emitter {
	constructor(params) {
		if (!("name" in params))
			throw new Error("State must have name parameter.");
		params = Object.assign({
			onEnter: function(){},
			onExit: function(){},
			update: function(){}
		}, params);
		super(params);
		this.name = params.name;
		this._onenter = this.listen("enter", params.onEnter.bind(this));
		this._onexit = this.listen("exit", params.onExit.bind(this));
		this.update = params.update;
	}
	enter() {
		this.emit("enter", this);
	}
	exit() {
		this.emit("exit", this);
	}
}