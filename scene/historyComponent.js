class HistoryComponent extends Emitter {
	constructor(params) {
		params = Object.assign({

		}, params);
		super(params);

		this.world = params.world;
		this.undoStack = [];
		this.redoStack = [];
		this.enabled = true;
	}

	getState() {
		let data = this.world.serialize();
		return data;
	}

	setState(data) {
		this.enabled = false;
		this.world.reset(data);
		this.enabled = true;
	}

	undo() {
		if (this.undoStack.length > 0) {
			this.redoStack.push(this.getState());
			let state = this.undoStack.pop();
			this.setState(state);
			return true;
		}
		return false;
	}

	redo() {
		if (this.redoStack.length > 0) {
			this.undoStack.push(this.getState());
			let state = this.redoStack.pop();
			this.setState(state);
			return true;
		}
		return false;
	}

	pushState() {
		if (!this.enabled)
			return false;

		let state = this.getState();
		this.undoStack.push(state);
		this.redoStack = [];
		this.emit("pushState");
	}
}