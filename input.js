var Input = {
	//key press array
	keys: [],

	//key codes
	key: {},
	
	//mouse/touch coord
	mouse: {x: 0, y: 0, left: false, right: false},

	init: function(displayElement, bindingMap) {
		console.log("Input init")

		//register event listeners
		document.addEventListener("keydown", Input.handleKeydown, false);
		document.addEventListener("keyup", Input.handleKeyup, false);
		document.addEventListener("mousemove", Input.handleMousemove, false);
		displayElement.addEventListener("mousedown", Input.handleMousedown, false);
		document.addEventListener("mouseup", Input.handleMouseup, false);
		document.addEventListener("contextmenu", function(e){e.preventDefault();}, false);
		Input.displayElement = displayElement;

		Input.events = new Emitter();

		//load keybindings
		Input.loadBindings(bindingMap);
	},

	loadBindings: function(bindingMap) {
		Input.key = {};
		Object.keys(bindingMap).forEach(function(name){
			Input.key[name] = bindingMap[name];
		});

		//store list of registered keycodes
		Input.vkList = [];
		Object.keys(Input.key).forEach(function(key){
			Input.vkList.push(Input.key[key]);
		});
	},

	//key press handler
	handleKeydown: function(event){
		Input.keys[event.keyCode] = true;
		if (Input.vkList.indexOf(event.keyCode) >= 0)
			event.preventDefault();
		Input.events.emit("keydown", {
			keyCode: event.keyCode
		});
	},

	//key release handler
	handleKeyup: function(event){
		Input.keys[event.keyCode] = false;
		Input.events.emit("keyup", {
			keyCode: event.keyCode
		});
	},

	handleMousemove: function(event){
		var x = event.pageX - Input.displayElement.offsetLeft;
		var y = event.pageY - Input.displayElement.offsetTop;
		Input.mouse.x = Math.max(0, Math.min(Input.displayElement.offsetWidth, x)) / Display.scale * window.devicePixelRatio;
		Input.mouse.y = Math.max(0, Math.min(Input.displayElement.offsetHeight, y)) / Display.scale * window.devicePixelRatio;
		Input.events.emit("mousemove");
	},

	handleMousedown: function(event){
		if (event.which === 3)
			Input.mouse.right = true;
		else if (event.which === 1)
			Input.mouse.left = true;
		if (event.target === Input.displayElement)
			event.preventDefault();
		Input.events.emit("mousedown");
	},

	handleMouseup: function(event){
		if (event.which === 3)
			Input.mouse.right = false;
		else if (event.which === 1)
			Input.mouse.left = false;
		if (event.target === Input.displayElement)
			event.preventDefault();
		Input.events.emit("mouseup");
	}
};