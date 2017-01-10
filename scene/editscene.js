var EditScene = {
    stage: null,
    selectedObstacle: null,

    init: function(params) {
        EditScene.stage = new PIXI.Container();
    },

    activate: function() {
        EditScene.selectedObstacle =
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

        EditScene.debugText = new PIXI.Text("debug: ", {
            fontFamily: "Karla",
			fontSize: 14,
			fill: 0xFFFFFF,
            dropShadow: true,
            dropShadowColor: 0x000000,
            dropShadowBlur: 0,
            dropShadowAngle: Math.PI/2,
            dropShadowDistance: 1
        });
        EditScene.debugText.position = new PIXI.Point(8,8);
        EditScene.stage.addChild(EditScene.debugText);
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
    },

    frame: function(timescale) {
        GameScene.frame(timescale);
        EditScene.debugText.text = "Editor: " + GameScene.world.levelName;
        var vertices = GameScene.world.obstacles.reduce(
            (val,o) => o.vertices.length + val, 0
        );
        var onscreen = GameScene.world.obstacles.reduce(
            (val,o) => GameScene.inView(o.poly) ? o.vertices.length + val : val, 0
        )
        EditScene.debugText.text += "\nFPS (avg): " + (1000 / Game.frametime).toFixed(0);
        EditScene.debugText.text += "\n#Vertices: " + vertices;
        EditScene.debugText.text += "\n#Visible: " + onscreen;
    }
}
