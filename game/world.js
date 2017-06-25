/**
 * Manages game state
 */
class World extends Emitter {
    constructor(params) {
        super(params);
        this.scene = null;
        this.levelName = params.levelName;
        this.listnrs = [];
        this.entities = [];
        this.obstacles = [];
        this.caster = new Caster({world: this});
        this.navmesh = new NavMesh({world: this});
    }

    /**
     * Resets entire world state.
     */
    reset(levelData) {
        //reset state
        this.time = 0;
        this.removeAllEntities();
        this.removeAllObstacles();
        this.prefabs = [];

        this.listnrs.forEach(listener => listener.remove());
        this.listnrs = [];

        //build level
        this.ready = false;
        let data = levelData ? levelData : Core.data.levels[this.levelName];
        this.buildLevel(data);
        this.ready = true;
        this.rebuildStructures();

        this.listnrs.push(
            Input.events.listen("keydown", this.eventKeyDown.bind(this)));
    }

    eventKeyDown(event) {
        if (event.keyCode === Input.key.X)
            this.addEntity(new Guard({
                world: this,
                position: GameScene.view.add(GameScene.viewOffset).add(Input.mouse),
                mode: Guard.mode.WANDER,
                target: this.player
            }));
    }

    /**
     * Check one or more lines of sight from a single point.
     * @param from the source Vector
     * @param angle a unit vector representing look direction
     * @param maxlen an optional maximum look distance. If this distance is
     * exceeded, then the line of sight is considered to be clear.
     * @return whether there is a clear line of sight
     */
    checkLoS(from, to) {
    	if (!(from instanceof Vector))
    		throw new Error("Source point must be Vector.");
    	if (!(to instanceof Vector))
    		throw new Error("Angle must be a Vector.");
    	
    	let los = new Segment(from, to);
		let candidates = this.segSpace.getIntersecting(los);
		return !Segment.hitsAny(los, candidates);
    }

    /**
     * Gets the "field of sight" from a given point in a particular direction.
     * Returns a Polygon representing the visible area.
     */
    getFoS({from, lookAngle=0, range=128, fov=Math.PI*2}) {
        let viewport = Polygon.circle(from, range, 15);

        let result = this.caster.cast({
            viewpoint: from,
            viewport: viewport,
            lookAngle: lookAngle,
            fov: fov
        });
        return result;
    }

    /**
     * Adds a given entity to this World.
     * @param ent the entity
     */
    addEntity(ent) {
		this.entities.push(ent);
		this.emit("addEntity", ent);
	}

	/**
	 * Removes a given entity from this World.
	 * @param ent the entity to find and remove
	 * @return whether the entity was found and removed
	 */
	removeEntity(ent) {
		var idx = this.entities.indexOf(ent);
		if (idx < 0)
			return false;
		this.entities.splice(idx, 1);
		this.emit("removeEntity", ent);
        return true;
	}

	/**
	 * Removes all entities from this World.
	 * @return true
	 */
    removeAllEntities() {
        this.entities.forEach(ent => {
            this.emit("removeEntity", ent);
        });
        this.entities = [];
        return true;
    }

    /**
     * Accepts a serialized entity and reconstructs it for this World.
     * The Entity is NOT added to the World; it is only returned.
     * See addEntity() to add it to the World.
     * @param data an object containing serialized entity data
     * @return a new Entity
     */
	deserializeEntity(data) {
		let type = Core.classMap[data._constructor];
		let ent = new type(Object.assign(data, {world: this}));
		return ent;
	}

	/**
	 * Adds an Obstacle to this World.
	 * @param obs the Obstacle.
	 */
    addObstacle(obs) {
        this.obstacles.push(obs);
        this.listnrs.push(obs.listen("verticesChanged", () => this.rebuildStructures()));
        this.emit("addObstacle", obs);
        this.rebuildStructures();
    }

    /**
	 * Removes a given Obstacle from this World.
	 * @param obs the Obstacle to find and remove
	 * @return whether the Obstacle was found and removed
	 */
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

    /**
	 * Removes all Obstacles from this World.
	 * @return true
	 */
    removeAllObstacles() {
        this.obstacles.forEach(obs => {
            obs.gfx.destroy();
            this.emit("removeObstacle", obs);
        });
        this.obstacles = [];
        this.rebuildStructures();
        return true;
    }

    /**
     * Updates internal structures when World geometry changes.
     * This is slow.
     */
    rebuildStructures() {
    	//rebuild space-partitioning structures for Obstacle segments
        this.segments = [];
        this.segSpace = new SegmentSpace({binSize: 24});
        this.obstacles.forEach(obstacle => {
            obstacle.getSegments().forEach(segment => {
                this.segSpace.add(segment);
                this.segments.push(segment);
            });
        });

        //prepare Caster for new geometry
        this.caster.init();

        if (!this.ready)
            return false;
        //rebuild navmesh (VERY slow)
        this.navmesh.rebuild();
    }

    /**
	 * Constructs an entire level and adds it to the game world.
	 * @param name name of the level as defined in game.json
	 */
    buildLevel(data) {
		if ("objects" in data) {
			data.objects.forEach(object => {
				if (object.type === "obstacle")
					this.buildObstacle(object);
	            else if (object.type === "prefab")
	                this.buildPrefab(object);
			});
		}
		if ("entities" in data) {
			data.entities.forEach(entity => {
				let obj = this.deserializeEntity(entity);
                if (obj instanceof Player)
                    this.player = obj;
				this.addEntity(obj);
			});
		}
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

        //process navmesh jobs
        this.navmesh.processJobs();

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

    /**
     * Generates a Polygon representing a bounding box for this World.
     * The bounds will be arbitrarily larger than the tightest-fitted bounding box
     * that could be generated.
     * @return a Polygon representing World bounds
     */
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
    	data.objects = this.obstacles.map(x => x.serialize());
    }

    serializeEntities(data) {
    	data.entities = this.entities.map(x => x.serialize());
    }

    serialize() {
    	var data = {};
    	this.serializeObstacles(data);
    	this.serializeEntities(data);
    	return data;
    }
}
