/**
 * Manages game state
 */
class World extends Emitter {
    constructor(params) {
        super(params);
        this.levelName = params.levelName;
        this.reset();
    }

    reset() {
        //reset state
        this.time = 0;
        this.entities = [];
        this.obstacles = [];

        //build level
        this.buildLevel(this.levelName);

        //create player
        this.player = new Player({
			position: V(-10,-10),
            world: this
		});
		this.addEntity(this.player);
    }

    addEntity(ent) {
		this.entities.push(ent);
		this.emit("addEntity", ent);
	}

	removeEntity(ent) {
		var idx = this.entities.indexOf(ent);
		if (idx < 0)
			return false;
		this.entities.splice(idx, 1);
		this.emit("removeEntity", ent);
        return true;
	}

    addObstacle(obs) {
        this.obstacles.push(obs);
        this.emit("addObstacle", obs);
    }

    removeObstacle(obs) {
        var idx = this.obstacles.indexOf(obs);
        if (idx < 0)
            return false;
        this.obstacles.splice(idx, 1);
        obs.gfx.destroy();
        this.emit("removeObstacle", obs);
        return true;
    }

    /**
	 * Constructs an entire level and adds it to the game world.
	 * @param name name of the level as defined in game.json
	 */
    buildLevel(name) {
        var data = Core.data.levels[name];
		data.objects.forEach(object => {
			if (object.type === "obstacle")
				this.buildObstacle(object, V(object.position));
            else if (object.type === "prefab")
                this.buildPrefab(object.name, V(object.position));
		});
    }

    /**
	 * Constructs a prefab at a given position and inserts it into the world.
	 * @param name the type of prefab as defined in game.json
	 * @param position a vector at which to insert the prefab
	 */
	buildPrefab(name, position) {
		var data = Core.data.prefabs[name];
		data.forEach(item => {
			var type = item.type;
			if (type === "obstacle")
				this.buildObstacle(item, position);
		});
	}

	/**
	 * Constructs an obstacle at a given position and inserts it into the world.
	 * @param data the data for this obstacle
	 * @param position a vector at which to insert the obstacle
	 */
    buildObstacle(data, position) {
		var vertices = data.vertices.map(v => V(v));
		var obstacle = new Obstacle({
			vertices: vertices,
			position: position
		});
        this.addObstacle(obstacle);
	}

    frame(timescale) {
        this.time += timescale / Game.targetFps;

        //update obstacles
		this.obstacles.forEach(function(obstacle){
			obstacle.draw();
		});

		//update entities
		this.entities.forEach(function(entity){
			entity.frame(timescale);
			entity.draw();
		});
    }
}
