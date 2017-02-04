var Game = {
	targetFps: 60,
	activeScene: null,
	WALLHACKS: false,

	init: function() {
		//initialize core functionality
		Display.calculateDimensions();
		Display.init(document.querySelector("#container"));
		Input.init(Display.canvas, Core.data.inputBindings);

		Game.events = new Emitter();

		//initialize scenes
		TitleScene.init();
		var world = new World({levelName: "demo"});
		GameScene.init({world: world});
		EditScene.init();
		Game.setScene(TitleScene);

		//emit a display resize event
		Display.events.emit("resize");

		//fps monitoring
		var frametimes = [];
		Object.defineProperty(Game, "frametime", {
			set: function(val) {
				frametimes.push(val);
				if (frametimes.length > 60)
					frametimes.shift();
			},
			get: function() {
				return frametimes.reduce((t,s) => t+s, 0) / frametimes.length;
			}
		});

		//start game loop
		var t0 = Date.now();
		var ticks = 0;
		var frameFunc = function() {
			//calculate time changes
			var dt = -t0 + (t0 = Date.now());
			Game.frametime = dt;
			var timescale = dt / (1000 / Game.targetFps);
			ticks += timescale;

			//discard frames that take too long
			if (dt < 500)
				Game.frame(timescale, Math.floor(ticks));

			ticks -= Math.floor(ticks);

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
		Game.events.emit("sceneChanged", {
			active: scene,
			previous: Game.activeScene
		});
		Game.activeScene = scene;
	},

	/**
	 * Restarts the game.
	 */
	start: function() {
		GameScene.world.reset(); //TODO: maybe reactivation will occur without
		                         //resetting the game?
		Game.events.emit("gameStart");
	},

	/**
	 * Called every frame by the game loop
	 * @param timescale time elapsed as a fraction of the time per frame at
	 *        the target framerate.
	 * @param ticks the number of 60fps "ticks" that have elapsed
	 */
	frame: function(timescale, ticks) {
		Game.activeScene.frame(timescale, ticks);
		Display.frame(timescale);
	}
}
