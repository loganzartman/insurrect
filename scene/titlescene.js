var TitleScene = {
	stage: null,
	t0: 0,

	init: function() {
		TitleScene.stage = new PIXI.Container();
		TitleScene.gfx = new PIXI.Graphics();
		TitleScene.title = PIXI.Sprite.from(Core.resource.title.texture);
		TitleScene.stage.addChild(TitleScene.gfx);
		TitleScene.stage.addChild(TitleScene.title);

		//create buttons
		TitleScene.playbtn = Display.makeButton("Let's go!", Core.color.acc3, Core.color.acc1, function(){
			Game.start();
			Game.setScene(GameScene);
		});
		TitleScene.playbtn._y = TitleScene.title.height + Display.margin;
		Display.centerObj(TitleScene.playbtn, true, false);
		TitleScene.stage.addChild(TitleScene.playbtn);

		TitleScene.editbtn = Display.makeButton("Edit level", Core.color.acc3, Core.color.acc1, function(){
			Game.start();
			Game.setScene(EditScene);
		});
		TitleScene.editbtn._y = TitleScene.playbtn._y + TitleScene.playbtn.height + Display.margin;
		Display.centerObj(TitleScene.editbtn, true, false);
		TitleScene.stage.addChild(TitleScene.editbtn);
	},

	/**
	 * Called when a scene regains focus.
	 */
	activate: function() {
		TitleScene.time = 0;
	},

	/**
	 * Called when a scene loses focus.
	 */
	deactivate: function() {

	},

	frame: function(timescale) {
		var t = TitleScene.time += timescale / Game.targetFps;
		TitleScene.title.position.x = Math.floor((Display.w-TitleScene.title.width)/2);
		var f = 1 - Math.pow(Math.max(0, 1-t/1.5), 2);
		TitleScene.title.position.y = Math.floor(-f * 30 + 40);
		TitleScene.title.alpha = f;

		TitleScene.playbtn.position.y = Math.floor(TitleScene.playbtn._y - 25 + f*25);
		TitleScene.playbtn.alpha = f;
		TitleScene.editbtn.position.y = Math.floor(TitleScene.editbtn._y - 50 + f*50);
		TitleScene.editbtn.alpha = f;

		//draw background
		TitleScene.gfx.clear();
		TitleScene.gfx.beginFill(Core.color.bg1, 1);
		TitleScene.gfx.drawRect(0, 0, Display.w, Display.h);
		TitleScene.gfx.endFill();
	}
};
