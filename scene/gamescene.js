var GameScene = {
	stage: null,
	t0: 0,
	view: V(0,0),

	init: function() {
		GameScene.stage = new PIXI.Container();
		
		//unmasked things
		GameScene.unmaskedBg = new PIXI.Graphics();
		GameScene.stage.addChild(GameScene.unmaskedBg);

		//contains anything that is masked by player sight
		GameScene.maskedContainer = new PIXI.Container();
		GameScene.mask = new PIXI.Graphics();
		GameScene.mask.cacheAsBitmap = true;
		GameScene.maskedContainer.mask = GameScene.mask;
		GameScene.stage.addChild(GameScene.maskedContainer);

		//background
		GameScene.bg = new PIXI.Graphics();
		GameScene.maskedContainer.addChild(GameScene.bg);

		//contains anything that should pan with view
 		GameScene.viewContainer = new PIXI.Container();
		GameScene.maskedContainer.addChild(GameScene.viewContainer);

		//contains world objects
		GameScene.objectContainer = new PIXI.Container();
		GameScene.viewContainer.addChild(GameScene.objectContainer);
	},
	
	/**
	 * Called when a scene regains focus.
	 */
	activate: function() {
		GameScene.t0 = Game.time;
		GameScene.objectContainer.removeChildren();
		Game.objects.forEach(function(object){
			GameScene.objectContainer.addChild(object.gfx);
		});
	},

	/**
	 * Called when a scene loses focus.
	 */
	deactivate: function() {

	},

	frame: function(timescale) {
		var t = Game.time - GameScene.t0;
		GameScene.viewContainer.position.x = Math.floor(-GameScene.view.x + Display.w/2);
		GameScene.viewContainer.position.y = Math.floor(-GameScene.view.y + Display.h/2);
		Game.objects.forEach(function(object){
			object.draw();
		});

		//update mask
		var dummyMaskPos = GameScene.view.add(Input.mouse);
		GameScene.mask.clear();
		GameScene.mask.beginFill(0.5, 0x777777);
		GameScene.mask.drawCircle(dummyMaskPos.x, dummyMaskPos.y, 64);
		GameScene.mask.endFill();

		//draw background
		GameScene.bg.clear();
		GameScene.bg.beginFill(Core.color.bg1, 1);
		GameScene.bg.drawRect(0, 0, Display.w, Display.h);
		GameScene.bg.endFill();

		GameScene.unmaskedBg.clear();
		GameScene.unmaskedBg.beginFill(Core.color.bg2, 1);
		GameScene.unmaskedBg.drawRect(0, 0, Display.w, Display.h);
		GameScene.unmaskedBg.endFill();
	}
};