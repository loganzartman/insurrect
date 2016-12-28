var Game = {
	targetFps: 60,
	time: 0,
	activeScene: null,
	objects: null,

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

	/**
	 * Restarts the game.
	 */
	start: function() {
		//do stuff
		Game.objects = [];
		Game.buildLevel("demo");
		// Game.objects.push(new Obstacle({
		// 	vertices: [V(0,0), V(64,0), V(64,16), V(0,16)],
		// 	position: V(0,0)
		// }));
		// Game.objects.push(new Obstacle({
		// 	vertices: [V(0,64), V(64,64), V(64,64+16), V(0,64+16)],
		// 	position: V(0,0)
		// }));

		Game.setScene(GameScene);
	},

	/**
	 * Constructs an entire level and adds it to the game world.
	 * @param name name of the level as defined in game.json
	 */
	buildLevel: function(name) {
		var data = Core.data.levels[name];
		data.prefabs.forEach(function(prefab){
			Game.buildPrefab(prefab.name, V(prefab.position));
		});
	},

	/**
	 * Constructs a prefab at a given position and inserts it into the game.
	 * @param name the type of prefab as defined in game.json
	 * @param position a vector at which to insert the prefab
	 */
	buildPrefab: function(name, position) {
		var data = Core.data.prefabs[name];
		data.forEach(function(prefab){
			var type = prefab.type;
			var vertices = prefab.vertices;
			if (type === "obstacle") {
				vertices = vertices.map(v => V(v));
				Game.objects.push(new Obstacle({
					vertices: vertices,
					position: position
				}));
			}
		});
	},

	/**
	 * Called every frame by the game loop
	 * @param timescale time elapsed as a fraction of the time per frame at
	 *        the target framerate.
	 */
	frame: function(timescale) {
		if (Game.activeScene === null) {
			console.log("scene is null; skipping frame. (this is a problem)");
			return;
		}
		Game.activeScene.frame(timescale);
		Display.frame(timescale);
	}
}