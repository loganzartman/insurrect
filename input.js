var Input = {
	//key press array
	keys: [],

	//key codes
	key: {},
	
	//mouse/touch coord
	mouse: {x: 0, y: 0, left: false, right: false},

	init: function(displayElement, bindingMap) {
		//register event listeners
		document.addEventListener("keydown", Input.handleKeydown, false);
		document.addEventListener("keyup", Input.handleKeyup, false);
		document.addEventListener("mousemove", Input.handleMousemove.bind(this, displayElement), false);
		displayElement.addEventListener("mousedown", Input.handleMousedown, false);
		document.addEventListener("mouseup", Input.handleMouseup, false);

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
		if (Input.vkList.indexOf(event.keyCode) >= 0) event.preventDefault();
	},

	//key release handler
	handleKeyup: function(event){
		Input.keys[event.keyCode] = false;
	},

	handleMousemove: function(displayElement, event){
		var x = event.pageX - displayElement.offsetLeft;
		var y = event.pageY - displayElement.offsetTop;
		Input.mouse.x = Math.max(0, Math.min(displayElement.offsetWidth, x));
		Input.mouse.y = Math.max(0, Math.min(displayElement.offsetHeight, y));
	},

	handleMousedown: function(event){
		if (event.which === 2)
			Input.mouse.right = true;
		else if (event.which === 1)
			Input.mouse.left = true;
	},

	handleMouseup: function(event){
		if (event.which === 2)
			Input.mouse.right = false;
		else if (event.which === 1)
			Input.mouse.left = false;
	}
};