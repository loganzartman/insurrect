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

	start: function() {
		//do stuff
		Game.objects = [];
		Game.buildLevel("demo");

		Game.setScene(GameScene);
	},

	buildLevel: function(name) {
		var data = Core.data.levels[name];
		data.prefabs.forEach(function(prefab){
			Game.buildPrefab(prefab.name, V(prefab.position));
		});
	},

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

	frame: function(timescale) {
		if (Game.activeScene === null) {
			console.log("scene is null; skipping frame. (this is a problem)");
			return;
		}
		Game.activeScene.frame(timescale);
		Display.frame(timescale);
	}
}