var Game = {
	targetFps: 60,
	time: 0,
	activeScene: null,

	init: function() {
		//initialize core functionality
		Display.init(3, document.querySelector("#container"));
		Input.init(Display.canvas, Core.data.inputBindings);

		//initialize scenes
		TitleScene.init();
		GameScene.init();
		Game.setScene(TitleScene);

		//start game loop
		var t0 = Date.now();
		var frameFunc = function() {
			var dt = -t0 + (t0 = Date.now());
			Game.time += dt * 0.001;
			var timescale = dt * Game.targetFps * 0.001;
			Game.frame(timescale);
			requestAnimationFrame(frameFunc);
		};
		frameFunc();
		
		console.log("Initialized.");
	},

	/**
	 * Switches scenes instantly.
	 * Performs deactivation of old scene and activation of new scene.
	 */
	setScene: function(scene) {
		if (Game.activeScene !== null) {
			Game.activeScene.deactivate();
			Game.activeScene.stage.removeChild(Display.gfx);
		}

		scene.activate();
		Display.stage = scene.stage;
		Display.stage.addChildAt(Display.gfx, Display.stage.children.length);
		Game.activeScene = scene;
	},

	start: function() {
		Game.setScene(GameScene);
		//do stuff
	},

	frame: function(timescale) {
		if (Game.activeScene === null) {
			console.log("scene is null; skipping frame.");
			return;
		}
		Game.activeScene.frame(timescale);
		Display.frame(timescale);
	}
}