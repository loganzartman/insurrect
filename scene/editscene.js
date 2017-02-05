var EditScene = {
    stage: null,
    selectIndex: 0,
    selectedObstacle: null,
    phantomObstacle: null,
    allowPlayerFire: false,
    gridScale: 1,

    init: function(params) {
        EditScene.stage = new PIXI.Container();
    },

    activate: function() {
        GameScene.activate();
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
            if (EditScene.selectedObstacle !== null)
                GameScene.world.buildPrefab(
                    EditScene.selectedObstacle,
                    EditScene.calculatePlaceLocation(new Vector(Input.mouse), EditScene.phantomObstacle)
                );
        });

        EditScene.selectObstacle(Object.keys(Core.data.prefabs)[0]);

        Game.WALLHACKS = true;
        GameScene.LOOK_INTENSITY = 0;
    },

    selectObstacle: function(name) {
        EditScene.selectedObstacle = name;
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
            if (event.keyCode === Input.key.PREV)
                EditScene.selectIndex++;
            else if (event.keyCode === Input.key.NEXT)
                EditScene.selectIndex--;
            else
                return;

            //wrap around
            var prefabKeys = Object.keys(Core.data.prefabs);
            var N = prefabKeys.length;
            EditScene.selectIndex %= N;
            if (EditScene.selectIndex < 0)
                EditScene.selectIndex += N;

            EditScene.selectObstacle(prefabKeys[EditScene.selectIndex]);
        }));

        //changes grid scale
        EditScene.inputListeners.push(Input.events.listen("keydown", function(event){
            if (event.keyCode === Input.key.LESS)
                EditScene.gridScale/=2;
            else if (event.keyCode === Input.key.MORE)
                EditScene.gridScale*=2;
            EditScene.gridScale = Math.min(16, Math.ceil(EditScene.gridScale));
        }));

        //create graphics overlay
        EditScene.overlayGfx = new PIXI.Graphics();

        //create debug text
        EditScene.debugText = new PIXI.extras.BitmapText("debug: ", {
            font: "AndinaBold",
            tint: 0xFFFFFF
        });
        EditScene.debugText.position = new PIXI.Point(8,8);
        
        //create text shadow
        EditScene.debugTextTexture = new PIXI.RenderTexture(Display.w, Display.h);
        var dbtDisplayFore = new PIXI.Sprite(EditScene.debugTextTexture);
        dbtDisplayFore.tint = Core.color.acc1;
        var dbtDisplayShadow = new PIXI.Sprite(EditScene.debugTextTexture);
        dbtDisplayShadow.position.y = 1;
        dbtDisplayShadow.tint = Core.color.bg2;

        //create export button
        var exportBtn = Display.makeButton("Export", Core.color.acc3,
            Core.color.acc1, EditScene.doExport);
        exportBtn.position.x = Display.w - exportBtn.width - 8;
        exportBtn.position.y = 8;

        EditScene.stage.addChild(EditScene.overlayGfx);
        EditScene.stage.addChild(dbtDisplayShadow);
        EditScene.stage.addChild(dbtDisplayFore);
        EditScene.stage.addChild(exportBtn);
    },

    doExport: function() {
        var data = GameScene.world.serialize();
        var str = JSON.stringify(data);
        var url = "data:text/plain;base64,";
        url += btoa(str);
        window.open(url);
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
            var bounds = object.getBounds();
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
        });
    },

    deactivate: function() {
        GameScene.deactivate();
        EditScene.stage.removeChild(GameScene.stage);
        GameScene.world.unlisten("addObstacle", this.handleAddObstacle);
        EditScene.inputListeners.forEach(l => Input.events.unlisten(l.event, l.callback));
        Game.WALLHACKS = false;
        GameScene.LOOK_INTENSITY = 0.4;
    },

    frame: function(timescale, ticks) {
        GameScene.frame(timescale, ticks);
        EditScene.updateOverlay();
        
        //update debug text
        EditScene.debugText.text = "Editor: " + GameScene.world.levelName;
        var vertices = GameScene.world.obstacles.reduce(
            (val,o) => o.vertices.length + val, 0
        );
        var onscreen = GameScene.world.obstacles.reduce(
            (val,o) => GameScene.inView(o.poly) ? o.vertices.length + val : val, 0
        );
        var entities = GameScene.world.entities.length;
        EditScene.debugText.text += "\nFPS (avg): " + (1000 / Game.frametime).toFixed(0);
        EditScene.debugText.text += "\n#Vertices: " + vertices;
        EditScene.debugText.text += "\n#Visible: " + onscreen;
        EditScene.debugText.text += "\n#Entities: " + entities;
        EditScene.debugText.text += "\n[ and ] cycles prefabs.";
        EditScene.debugText.text += "\n+ and - to change grid size.";
        Display.renderer.render(EditScene.debugText, EditScene.debugTextTexture);
    }
}
