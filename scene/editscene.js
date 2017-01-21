var EditScene = {
    stage: null,
    selectedObstacle: null,

    init: function(params) {
        EditScene.stage = new PIXI.Container();
    },

    activate: function() {
        GameScene.activate();
        GameScene.world.listen("addObstacle", this.handleAddObstacle);
        GameScene.world.obstacles.forEach(this.handleAddObstacle);

        EditScene.stage.addChild(GameScene.stage);
        GameScene.stage.interactive = true;
        GameScene.stage.on("click", function(){
            GameScene.world.addObstacle(new Obstacle({
                vertices: [new Vector(-8,-8), new Vector(8,-8), new Vector(8,8), new Vector(-8,8)],
                position: new Vector(Input.mouse).add(GameScene.view).add(GameScene.viewOffset)
            }));
        });

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

        EditScene.stage.addChild(dbtDisplayShadow);
        EditScene.stage.addChild(dbtDisplayFore);
        Game.WALLHACKS = true;
        GameScene.LOOK_INTENSITY = 0;
    },

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
