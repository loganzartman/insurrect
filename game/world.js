/**
 * Manages game state
 */
class World extends Emitter {
    constructor(params) {
        super(params);
        this.scene = null;
        this.levelName = params.levelName;
        this.listnrs = [];
        this.caster = new Caster({world: this});
        this.navmesh = new NavMesh({world: this});
        this.reset();
    }

    reset() {
        //reset state
        this.time = 0;
        this.entities = [];
        this.obstacles = [];
        this.prefabs = [];

        this.listnrs.forEach(listener => listener.remove());
        this.listnrs = [];

        //build level
        this.ready = false;
        this.buildLevel(this.levelName);
        this.ready = true;
        this.rebuildStructures();

        //create player
        this.player = new Player({
			position: new Vector(-10,-10),
            world: this
		});
		this.addEntity(this.player);

        this.addEntity(new TestAgent({
            world: this,
            position: new Vector(5,5),
            target: this.player
        }));
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
        this.listnrs.push(obs.listen("verticesChanged", () => this.rebuildStructures()));
        this.emit("addObstacle", obs);
        this.rebuildStructures();
    }

    removeObstacle(obs) {
        var idx = this.obstacles.indexOf(obs);
        if (idx < 0)
            return false;
        this.obstacles.splice(idx, 1);
        obs.gfx.destroy();
        this.rebuildStructures();
        this.emit("removeObstacle", obs);
        return true;
    }

    removeAllObstacles() {
        this.obstacles.forEach(obs => {
            obs.gfx.destroy();
            this.emit("removeObstacle", obs);
        });
        this.obstacles = [];
        this.rebuildStructures();
        return true;
    }

    rebuildStructures() {
        if (!this.ready)
            return false;
        this.segments = [];
        this.segSpace = new SegmentSpace({binSize: 24});
        this.obstacles.forEach(obstacle => {
            obstacle.getSegments().forEach(segment => {
                this.segSpace.add(segment);
                this.segments.push(segment);
            });
        });

        this.caster.init();
        this.navmesh.rebuild();
    }

    /**
	 * Constructs an entire level and adds it to the game world.
	 * @param name name of the level as defined in game.json
	 */
    buildLevel(name) {
        var data = Core.data.levels[name];
		data.objects.forEach(object => {
			if (object.type === "obstacle")
				this.buildObstacle(object);
            else if (object.type === "prefab")
                this.buildPrefab(object);
		});
    }

    /**
	 * Constructs a prefab at a given position and inserts it into the world.
	 * @param name the type of prefab as defined in game.json
	 * @param position a vector at which to insert the prefab
	 */
	buildPrefab(data) {
		var prefabData = Object.assign({}, Core.data.prefabs[data.name]);
        var type = prefabData.type;
        prefabData = Object.assign(prefabData, data);
        
		if (type === "obstacle") {
			var obs = this.buildObstacle(prefabData);
            obs.prefabName = data.name;
            return obs;
        }
        return null;
	}

	/**
	 * Constructs an obstacle at a given position and inserts it into the world.
	 * @param data the data for this obstacle
	 * @param position a vector at which to insert the obstacle
	 */
    buildObstacle(data) {
        data = Object.assign({}, data); //clone
		var obstacle = new Obstacle(data);
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

    getBounds() {
        //collect points
        let points = [];
        this.obstacles.forEach(obs => {
            obs.poly.points.forEach(point => points.push(point));
        });
        if (points.length === 0)
            points.push(new Vector(0,0));
        
        //find min/max points
        let min = new Vector(points[0]);
        let max = new Vector(points[0]);
        points.forEach(point => {
            min.x = Math.min(min.x, point.x);
            min.y = Math.min(min.y, point.y);
            max.x = Math.max(max.x, point.x);
            max.y = Math.max(max.y, point.y);
        });
        
        //offset path
        max = max.add(new Vector(20,20));
        min = min.sub(new Vector(20,20));
        return new Polygon([
            new Vector(min.x, min.y),
            new Vector(max.x, min.y),
            new Vector(max.x, max.y),
            new Vector(min.x, max.y)
        ]);
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
