var EditScene = {
    stage: null,
    selectIndex: 0,
    selectedPrefab: null,
    phantomObstacle: null,
    allowPlayerFire: false,
    gridScale: 1,
    mergeMode: "Off",
    mergedObstacles: [],
    mergeRemoveEnabled: true,
    NONE: "Off",
    UNION: "Add",
    DIFFERENCE: "Subtract",

    init: function(params) {
        EditScene.stage = new PIXI.Container();

        EditScene.gui = Core.gui.addFolder("Editor");
        EditScene.gui.add({
            "Rebuild NavMesh": function() {
                GameScene.world.navmesh.rebuild();
            }
        }, "Rebuild NavMesh");
        EditScene.gui.add({"Export Level": EditScene.doExport}, "Export Level");
        EditScene.gui.add({"Import Level": EditScene.doImport}, "Import Level");
        EditScene.gui.add({"Spawn Entity": function(){
            let ctor = prompt("Class name: \n" + Object.keys(Core.classMap).join(", "));
            let params = JSON.parse(prompt("Params:", "{\"position\": [0,0]}"));
            if (ctor) {
                try {
                    let ent = GameScene.world.deserializeEntity(Object.assign(params, {_constructor: ctor}));
                    GameScene.world.addEntity(ent);
                }
                catch (e) {
                    alert(e);
                    console.log(e);
                }
            }
        }}, "Spawn Entity");
        EditScene.gui.add(EditScene, "mergeMode", [EditScene.NONE, EditScene.UNION, EditScene.DIFFERENCE]).listen(function(){
            EditScene.mergedObstacles = [];
        });
        EditScene.gui.add(EditScene, "selectedPrefab", Object.keys(Core.data.prefabs))
            .onFinishChange(value => {
                EditScene.selectPrefab(value);
            })
            .listen();
    },

    activate: function() {
        GameScene.activate();
        GameScene.world.ready = false;
        GameScene.world.listen("addObstacle", this.handleAddObstacle);
        GameScene.world.obstacles.forEach(this.handleAddObstacle);

        //Hijack GameScene stage
        EditScene.stage.addChild(GameScene.stage);
        GameScene.stage.interactive = true;

        //Override player fire action to prevent it
        var playerFire = GameScene.world.player.fire;
        GameScene.world.player.fire = function(){
            if (EditScene.allowPlayerFire)
                playerFire.apply(GameScene.world.player, arguments);
        };

        EditScene.initUI();

        //Set up editor interaction
        GameScene.stage.on("click", function(){
            if (EditScene.selectedPrefab !== null) {
                //construct the selected prefab
                var obs = GameScene.world.buildPrefab({
                    type: "prefab",
                    name: EditScene.selectedPrefab,
                    position: EditScene.calculatePlaceLocation(new Vector(Input.mouse), EditScene.phantomObstacle),
                    rotation: EditScene.phantomObstacle.rotation
                });

                //if geometry merge mode is enabled, remove it and reinsert a merged obstacle
                if (EditScene.mergeMode !== EditScene.NONE) {
                    EditScene.mergeRemoveEnabled = false;
                    GameScene.world.removeObstacle(obs); //remove the new obstacle
                    EditScene.mergeRemoveEnabled = true;

                    //compile a list of merge geometry polygons
                    var polys = EditScene.mergedObstacles.map(obs => obs.poly);

                    //remove the existing merged geometry from the world
                    EditScene.mergedObstacles.forEach(obs => GameScene.world.removeObstacle(obs));
                    EditScene.mergedObstacles = [];

                    var merged;
                    if (polys.length === 0 || EditScene.mergeMode === EditScene.UNION)
                        merged = Polygon.union(polys, [obs.poly]);
                    else
                        merged = Polygon.difference(polys, [obs.poly]); //merge all merge geometry

                    merged.forEach(poly => {
                        var obs = new Obstacle({vertices: poly.points});
                        GameScene.world.addObstacle(obs); //add merged geometry to world
                        EditScene.mergedObstacles.push(obs); //keep track of merged geometry
                    });
                }
            }
        });

        EditScene.selectPrefab(Object.keys(Core.data.prefabs)[0]);

        Game.WALLHACKS = true;
        GameScene.LOOK_INTENSITY = 0;
    },

    selectPrefab: function(name) {
        EditScene.selectedPrefab = name;
        var data = Core.data.prefabs[name];

        //remove old phantom object graphics if any
        if (EditScene.phantomObstacle !== null)
            EditScene.stage.removeChild(EditScene.phantomObstacle.gfx);
        
        //create phantom object
        EditScene.phantomObstacle = new Obstacle(Object.assign({position: new Vector(0,0)}, data));
        EditScene.phantomObstacle.draw();
        EditScene.phantomObstacle.gfx.alpha = 0.75;
        EditScene.phantomObstacle.gfx.hitArea = new PIXI.Rectangle(0,0,0,0);

        //add new phantom object graphics
        idx = EditScene.stage.children.indexOf(EditScene.overlayGfx);
        EditScene.stage.addChildAt(EditScene.phantomObstacle.gfx, idx+1);
    },

    initUI: function() {
        //listeners
        EditScene.inputListeners = [];

        //cycles through prefabs that can be placed in level
        EditScene.inputListeners.push(Input.events.listen("keydown", function(event){
            //increment or decrement selected prefab index           
            if (event.keyCode === Input.key.NEXT)
                EditScene.selectIndex++;
            else if (event.keyCode === Input.key.PREV)
                EditScene.selectIndex--;
            else
                return;

            //wrap around
            var prefabKeys = Object.keys(Core.data.prefabs);
            var N = prefabKeys.length;
            EditScene.selectIndex %= N;
            if (EditScene.selectIndex < 0)
                EditScene.selectIndex += N;

            EditScene.selectPrefab(prefabKeys[EditScene.selectIndex]);
        }));

        //changes grid scale
        EditScene.inputListeners.push(Input.events.listen("keydown", function(event){
            if (event.keyCode === Input.key.LESS)
                EditScene.gridScale/=2;
            else if (event.keyCode === Input.key.MORE)
                EditScene.gridScale*=2;
            EditScene.gridScale = Math.min(16, Math.ceil(EditScene.gridScale));
        }));

        //rotates object
        EditScene.inputListeners.push(Input.events.listen("keydown", function(event){
            if (event.keyCode === Input.key.R) {
                EditScene.phantomObstacle.rotation = (EditScene.phantomObstacle.rotation + 45) % 360;
                EditScene.phantomObstacle.updateTransform();
                EditScene.phantomObstacle.gfx.hitArea = new PIXI.Rectangle(0,0,0,0);
                EditScene.phantomObstacle.draw();
            }
        }));

        //create graphics overlay
        EditScene.overlayGfx = new PIXI.Graphics();

        EditScene.stage.addChild(EditScene.overlayGfx);
    },

    doExport: function() {
        var data = GameScene.world.serialize();
        var str = JSON.stringify(data);
        var url = "data:;base64,";
        url += btoa(str);
        window.open(url);
    },

    doImport: function() {
        let text = prompt("Paste level data:");
        if (!text)
            return;

        try {
            let data = JSON.parse(text);
            GameScene.world.reset(data);
        }
        catch (e) {
            alert("Bad level data.");
        }
    },

    doMerge: function(obstacle) {
        var polygons = GameScene.world.obstacles.map(obstacle => obstacle.poly);
        var result = Polygon.union(polygons, polygons);
        GameScene.world.removeAllObstacles();
        result.forEach(poly => GameScene.world.addObstacle(new Obstacle({vertices: poly.points})));
        GameScene.world.rebuildStructures();
    },

    /**
     * Updates the contents of the graphical overlay, including the placement
     * grid and phantom object.
     */
    updateOverlay: function() {
        var gfx = EditScene.overlayGfx;
        gfx.clear();
        gfx.blendMode = PIXI.BLEND_MODES.ADD;
        var pos = EditScene.calculatePlaceLocation(new Vector(Input.mouse));
        pos = pos.sub(GameScene.view).sub(GameScene.viewOffset);

        if (EditScene.gridScale > 1) {
            //placement grid calculations
            const GRID_RANGE_PX = 64;
            var steps = Math.ceil(GRID_RANGE_PX / EditScene.gridScale);
            var x0 = pos.x - GRID_RANGE_PX;
            var x1 = pos.x + GRID_RANGE_PX;
            var y0 = pos.y - GRID_RANGE_PX;
            var y1 = pos.y + GRID_RANGE_PX;
            var opacity = 0.1;

            //draw placement grid
            for (let y=-steps; y<=steps; y++) { 
                gfx.lineStyle(1, 0xFFFFFF, opacity);
                gfx.moveTo(x0, pos.y+y*EditScene.gridScale);
                gfx.lineTo(x1, pos.y+y*EditScene.gridScale);
            }
            for (let x=-steps; x<=steps; x++) { 
                gfx.lineStyle(1, 0xFFFFFF, opacity);
                gfx.moveTo(pos.x+x*EditScene.gridScale, y0);
                gfx.lineTo(pos.x+x*EditScene.gridScale, y1);
            }
        }

        //move phantom object
        if (EditScene.phantomObstacle !== null) {
            pos = EditScene.calculatePlaceLocation(new Vector(Input.mouse), EditScene.phantomObstacle);
            pos = pos.sub(GameScene.view).sub(GameScene.viewOffset);
            EditScene.phantomObstacle.gfx.position = pos;
        }
    },

    /**
     * Accepts a screen-relative mouse position.
     * Returns a position representing the world-relative position where an
     * object should be placed, aligning it to the placement grid.
     * @param mouse screen-relative mouse Vector (i.e. Input.mouse)
     * @return world-relative placement Vector
     */
    calculatePlaceLocation: function(mouse, object) {
        var offset = new Vector();
        
        if (typeof object !== "undefined") {
            var bounds = new Polygon(object.originalVertices).getBounds();
            offset = bounds.max.sub(bounds.min).sub(object.position).div(-2);
            offset = offset.sub(bounds.min);
        }
        
        mouse = mouse.add(offset).add(GameScene.view).add(GameScene.viewOffset)
            .div(EditScene.gridScale);
        mouse.x = Math.round(mouse.x);
        mouse.y = Math.round(mouse.y);
        mouse = mouse.mult(EditScene.gridScale);
        return mouse;
    },

    /**
     * An event handler for the creation of an obstacle.
     * Attaches necessary event handlers to the obstacle.
     */
    handleAddObstacle: function(obs) {
        obs.gfx.on("mouseover", function(){
            obs.gfx.tint = 0xFF0000;
        });
        obs.gfx.on("mouseout", function(){
            obs.gfx.tint = 0xFFFFFF;
        });
        obs.gfx.on("rightclick", function(){
            GameScene.world.removeObstacle(obs);
            if (EditScene.mergeRemoveEnabled && EditScene.mergedObstacles.includes(obs))
                EditScene.mergedObstacles.splice(EditScene.mergedObstacles.indexOf(obs), 1);
        });
    },

    deactivate: function() {
        GameScene.deactivate();
        EditScene.stage.removeChild(GameScene.stage);
        GameScene.world.unlisten("addObstacle", this.handleAddObstacle);
        EditScene.inputListeners.forEach(l => Input.events.unlisten(l.event, l.callback));
        GameScene.LOOK_INTENSITY = 0.4;
    },

    frame: function(timescale, ticks) {
        EditScene.updateOverlay();
        
        //update debug text
        GameScene.debugText.text += "\nEditor: " + GameScene.world.levelName;
        var vertices = GameScene.world.obstacles.reduce(
            (val,o) => o.vertices.length + val, 0
        );
        var onscreen = GameScene.world.obstacles.reduce(
            (val,o) => GameScene.inView(o.poly) ? o.vertices.length + val : val, 0
        );
        var entities = GameScene.world.entities.length;
        GameScene.debugText.text += "\n#Vertices: " + vertices;
        GameScene.debugText.text += "\n#Visible: " + onscreen;
        GameScene.debugText.text += "\n#Entities: " + entities;
        // GameScene.debugText.text += "\nBSP Size: " + GameScene.world.bsp.size;
        GameScene.debugText.text += "\n[ and ] cycle prefabs.";
        GameScene.debugText.text += "\n; and ' change grid size.";
        
        GameScene.frame(timescale, ticks);
    }
}
