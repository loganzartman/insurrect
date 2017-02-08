/**
 * Manages game state
 */
class World extends Emitter {
    constructor(params) {
        super(params);
        this.scene = null;
        this.levelName = params.levelName;
        this.reset();
    }

    reset() {
        //reset state
        this.time = 0;
        this.entities = [];
        this.obstacles = [];
        this.prefabs = [];

        //build level
        this.buildLevel(this.levelName);

        //create player
        this.player = new Player({
			position: new Vector(-10,-10),
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
				this.buildObstacle(object, new Vector(object.position));
            else if (object.type === "prefab")
                this.buildPrefab(object.name, new Vector(object.position));
		});
    }

    /**
	 * Constructs a prefab at a given position and inserts it into the world.
	 * @param name the type of prefab as defined in game.json
	 * @param position a vector at which to insert the prefab
	 */
	buildPrefab(name, position) {
		var data = Core.data.prefabs[name];
		var type = data.type;
		if (type === "obstacle") {
			var obs = this.buildObstacle(data, position);
            obs.prefabName = name;
            return obs;
        }
        return null;
	}

	/**
	 * Constructs an obstacle at a given position and inserts it into the world.
	 * @param data the data for this obstacle
	 * @param position a vector at which to insert the obstacle
	 */
    buildObstacle(data, position) {
		var obstacle = new Obstacle({
			vertices: data.vertices,
			position: position
		});
        this.addObstacle(obstacle);
        return obstacle;
	}

    frame(timescale, ticks) {
        this.time += timescale / Game.targetFps;

        //update obstacles
		this.obstacles.forEach(function(obstacle){
			obstacle.draw(timescale);
		});

		//update entities
		this.entities.forEach(function(entity){
			entity.frame(timescale, ticks);
			entity.draw(timescale);
		});
    }

    serializeObstacles(data) {
    	if (!data.hasOwnProperty("obstacles"))
    		data.objects = [];
    	this.obstacles.forEach(obstacle => {
    		data.objects.push(obstacle.serialize());
    	});
    }

    serializeEntities(data) {

    }

    serialize() {
    	var data = {};
    	this.serializeObstacles(data);
    	this.serializeEntities(data);
    	return data;
    }
}
