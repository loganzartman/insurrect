var Game = {
	targetFps: 60,
	time: 0,
	activeScene: null,
	objects: null,
	entities: null,

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
			//calculate time changes
			var dt = -t0 + (t0 = Date.now());
			Game.time += dt * 0.001;
			var timescale = dt * Game.targetFps * 0.001;

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
		//do stuff
		Game.objects = [];
		Game.entities = [];

		Game.player = new Player({
			position: V(-10,-10)
		});
		Game.addEntity(Game.player);

		Game.buildLevel("demo");
		Game.setScene(GameScene);
	},

	addEntity: function(ent) {
		Game.entities.push(ent);
		GameScene.objectContainer.addChild(ent.gfx);
	},

	removeEntity: function(ent) {
		var idx = Game.entities.indexOf(ent);
		if (idx < 0)
			return false;
		Game.entities.splice(idx, 1);
		GameScene.objectContainer.removeChild(ent.gfx);
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
		data.objects.forEach(function(object){
			if (object.type === "obstacle")
				Game.buildObstacle(object, V(object.position));
		});
	},

	/**
	 * Constructs a prefab at a given position and inserts it into the game.
	 * @param name the type of prefab as defined in game.json
	 * @param position a vector at which to insert the prefab
	 */
	buildPrefab: function(name, position) {
		var data = Core.data.prefabs[name];
		data.forEach(function(item){
			var type = item.type;
			if (type === "obstacle") {
				Game.buildObstacle(item, position);
			}
		});
	},

	/**
	 *
	 */
	buildObstacle: function(data, position) {
		var vertices = data.vertices.map(v => V(v));
		Game.objects.push(new Obstacle({
			vertices: vertices,
			position: position
		}));
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
