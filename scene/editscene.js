var EditScene = {
    stage: null,
    selectedObstacle: null,
    phantomObstacle: null,
    allowPlayerFire: false,
    gridScale: 8,

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
                GameScene.world.buildObstacle(
                    EditScene.selectedObstacle,
                    EditScene.calculatePlaceLocation(new Vector(Input.mouse)).add(GameScene.viewOffset)
                );
        });

        EditScene.selectObstacle({
            type: "obstacle",
            vertices: [new Vector(0,0), new Vector(16,0), new Vector(16,16), new Vector(0,16)]
        });

        Game.WALLHACKS = true;
        GameScene.LOOK_INTENSITY = 0;
    },

    selectObstacle(data) {
        EditScene.selectedObstacle = data;
        EditScene.phantomObstacle = new Obstacle(Object.assign({position: new Vector(0,0)}, data));
        EditScene.phantomObstacle.draw();
        EditScene.phantomObstacle.gfx.alpha = 0.75;
        EditScene.phantomObstacle.gfx.hitArea = new PIXI.Rectangle(0,0,0,0);

        //remove old phantom object graphics if any
        var idx = EditScene.stage.children.indexOf(EditScene.phantomObstacle.gfx);
        if (idx >= 0) {
            EditScene.stage.removeChild(EditScene.phantomObstacle.gfx);
        }

        //add new phantom object graphics
        idx = EditScene.stage.children.indexOf(EditScene.overlayGfx);
        EditScene.stage.addChildAt(EditScene.phantomObstacle.gfx, idx+1);
    },

    initUI: function() {
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

        EditScene.stage.addChild(EditScene.overlayGfx);
        EditScene.stage.addChild(dbtDisplayShadow);
        EditScene.stage.addChild(dbtDisplayFore);
    },

    /**
     * Updates the contents of the graphical overlay, including the placement
     * grid and phantom object.
     */
    updateOverlay: function() {
        var gfx = EditScene.overlayGfx;
        gfx.clear();
        var pos = EditScene.calculatePlaceLocation(new Vector(Input.mouse));
        pos = pos.sub(GameScene.view);

        //placement grid calculations
        const GRID_RANGE_PX = 64;
        var steps = Math.ceil(GRID_RANGE_PX / EditScene.gridScale);
        var x0 = pos.x - GRID_RANGE_PX;
        var x1 = pos.x + GRID_RANGE_PX;
        var y0 = pos.y - GRID_RANGE_PX;
        var y1 = pos.y + GRID_RANGE_PX;
        var opacity = z => (1-Math.abs(z/steps))*0.25;

        //draw placement grid
        for (let y=-steps; y<=steps; y++) { 
            gfx.lineStyle(1, 0x900000, opacity(y));
            gfx.moveTo(x0, pos.y+y*EditScene.gridScale);
            gfx.lineTo(x1, pos.y+y*EditScene.gridScale);
        }
        for (let x=-steps; x<=steps; x++) { 
            gfx.lineStyle(1, 0x900000, opacity(x));
            gfx.moveTo(pos.x+x*EditScene.gridScale, y0);
            gfx.lineTo(pos.x+x*EditScene.gridScale, y1);
        }

        //move phantom object
        if (EditScene.phantomObstacle !== null) {
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
    calculatePlaceLocation: function(mouse) {
        mouse = mouse.add(GameScene.view).div(EditScene.gridScale);
        mouse.x = Math.floor(mouse.x);
        mouse.y = Math.floor(mouse.y);
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
        Display.renderer.render(EditScene.debugText, EditScene.debugTextTexture);
    }
}
