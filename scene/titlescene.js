var TitleScene = {
	stage: null,
	t0: 0,

	init: function() {
		TitleScene.stage = new PIXI.Container();
		TitleScene.gfx = new PIXI.Graphics();
		TitleScene.title = PIXI.Sprite.from(Core.image.title);
		TitleScene.stage.addChild(TitleScene.gfx);
		TitleScene.stage.addChild(TitleScene.title);
	},
	
	/**
	 * Called when a scene regains focus.
	 */
	activate: function() {
		TitleScene.t0 = Game.time;
	},

	/**
	 * Called when a scene loses focus.
	 */
	deactivate: function() {

	},

	frame: function(timescale) {
		var t = Game.time - TitleScene.t0;
		TitleScene.title.position.x = (Display.w-TitleScene.title.width)/2;
		var f = 1 - Math.pow(Math.max(0, 1-t/2), 2);
		TitleScene.title.position.y = Math.floor(f * 40 - 30);
		TitleScene.title.alpha = f;

		//draw background
		TitleScene.gfx.clear();
		TitleScene.gfx.beginFill(0xD9CEBA, 1);
		TitleScene.gfx.drawRect(0, 0, Display.w, Display.h);
		TitleScene.gfx.endFill();

		TitleScene.gfx.lineStyle(1, 0xAA0000, 1);
		TitleScene.gfx.drawCircle(
			Input.mouse.x, Input.mouse.y,
			Input.mouse.left ? 9 : 4
		);
	}
};