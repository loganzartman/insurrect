var GameScene = {
	stage: null,
	t0: 0,

	init: function() {
		GameScene.stage = new PIXI.Container();
		GameScene.gfx = new PIXI.Graphics();
		GameScene.stage.addChild(GameScene.gfx);
	},
	
	/**
	 * Called when a scene regains focus.
	 */
	activate: function() {
		GameScene.t0 = Game.time;
	},

	/**
	 * Called when a scene loses focus.
	 */
	deactivate: function() {

	},

	frame: function(timescale) {
		var t = Game.time - GameScene.t0;

		//draw background
		GameScene.gfx.clear();
		GameScene.gfx.beginFill(Core.color.bg2, 1);
		GameScene.gfx.drawRect(0, 0, Display.w, Display.h);
		GameScene.gfx.endFill();
	}
};