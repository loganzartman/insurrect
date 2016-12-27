var Game = {
	targetFps: 60,
	init: function() {
		Display.init(3, document.querySelector("#container"));
		Input.init(Display.canvas, Core.data.inputBindings);
		
		var t0 = Date.now();
		var frameFunc = function() {
			var dt = -t0 + (t0 = Date.now());
			Display.frame(dt * Game.targetFps * 0.001);
			requestAnimationFrame(frameFunc);
		};
		frameFunc();
		
		console.log("Initialized.");
	}
}