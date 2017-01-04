var Game = {
	targetFps: 60,
	activeScene: null,

	init: function() {
		//initialize core functionality
		Display.init(3, document.querySelector("#container"));
		Input.init(Display.canvas, Core.data.inputBindings);

		//initialize scenes
		TitleScene.init();
		var world = new World({levelName: "demo"});
		GameScene.init({world: world});
		Game.setScene(TitleScene);

		//start game loop
		var t0 = Date.now();
		var frameFunc = function() {
			//calculate time changes
			var dt = -t0 + (t0 = Date.now());
			var timescale = dt / (1000 / Game.targetFps);

			//discard frames that take too long
			if (dt < 500)
				Game.frame(timescale);

			//request another update
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

	/**
	 * Restarts the game.
	 */
	start: function() {
		//TODO: possibly move world reset etc. back here
		Game.setScene(GameScene);
	},

	/**
	 * Called every frame by the game loop
	 * @param timescale time elapsed as a fraction of the time per frame at
	 *        the target framerate.
	 */
	frame: function(timescale) {
		Game.activeScene.frame(timescale);
		Display.frame(timescale);
	}
}
