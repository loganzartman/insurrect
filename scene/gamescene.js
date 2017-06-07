var GameScene = {
	stage: null,
	t0: 0,
	view: new Vector(0,0),
	viewOffset: null,
	viewTarget: new Vector(0,0),
	viewVelocity: new Vector(0,0),
	VIEW_ACC: 0.025,
	VIEW_DAMP: 0.3,
	VIEW_MOVE: 0.8,
	VIEW_MOVE_EXP: 2,
	LOOK_INTENSITY: 0.33,

	init: function(params) {
		//world setup
		GameScene.world = params.world;
		GameScene.world.scene = GameScene;

		GameScene.world.listen("addEntity", ent => {
			GameScene.objectContainer.addChild(ent.gfx);
		});
		GameScene.world.listen("removeEntity", ent => {
			GameScene.objectContainer.removeChild(ent.gfx);
		});

		GameScene.world.listen("addObstacle", obs => {
			GameScene.objectContainer.addChild(obs.gfx);
		});
		GameScene.world.listen("removeObstacle", obs => {
			GameScene.objectContainer.removeChild(obs.gfx);
		});

		GameScene.initGfx();
		Display.gui.add({
			x: false,
			get debugCaster() {return this.x},
			set debugCaster(z) {this.x = z; GameScene.world.caster.DEBUG = z;}
		}, "debugCaster");
		Display.gui.add({
			x: false,
			get debugNavMesh() {return this.x},
			set debugNavMesh(z) {this.x = z; GameScene.world.navmesh.DEBUG = z;}
		}, "debugNavMesh");
		Display.gui.add({
			x: false,
			get debugAI() {return this.x},
			set debugAI(z) {this.x = z; Agent.DEBUG = z;}
		}, "debugAI");

		//handle display resizes
		Display.events.listen("resize", evt => {
			GameScene.viewOffset = new Vector(-Display.w/2, - Display.h/2);
			GameScene.maskTexture.resize(Display.w, Display.h);
			GameScene.bgtex.width = Display.w;
			GameScene.bgtex.height = Display.h;
			GameScene.bgtex2.width = Display.w;
			GameScene.bgtex2.height = Display.h;
		});
	},

	/**
	 * Prepares graphics
	 */
	initGfx: function() {
		//graphics setup
		GameScene.stage = new PIXI.Container();
		GameScene.gameStage = new PIXI.Container();
		GameScene.stage.addChild(GameScene.gameStage);

		// GameScene.initFilters();

		//unmasked things
		GameScene.unmaskedBg = new PIXI.Graphics();
		GameScene.gameStage.addChild(GameScene.unmaskedBg);
		GameScene.bgtex = new PIXI.extras.TilingSprite(Core.resource.qmtex.texture, Display.w, Display.h);
		GameScene.bgtex.tint = Core.color.bg2;
		GameScene.gameStage.addChild(GameScene.bgtex);

		//contains anything that is masked by player sight
		GameScene.maskedContainer = new PIXI.Container();
		GameScene.maskGfx = new PIXI.Graphics();
		GameScene.maskTexture = PIXI.RenderTexture.create(Display.w, Display.h);
		GameScene.mask = new PIXI.Sprite(GameScene.maskTexture);
		GameScene.maskedContainer.mask = GameScene.mask;
		GameScene.gameStage.addChild(GameScene.maskedContainer);

		//background
		GameScene.bg = new PIXI.Graphics();
		GameScene.bgtex2 = new PIXI.extras.TilingSprite(Core.resource.floor.texture, Display.w, Display.h);
		GameScene.bgtex2.tint = Core.color.bg1;
		GameScene.maskedContainer.addChild(GameScene.bgtex2);

		//contains anything that should pan with view
 		GameScene.viewContainer = new PIXI.Container();
		GameScene.maskedContainer.addChild(GameScene.viewContainer);

		//contains world objects
		GameScene.objectContainer = new PIXI.Container();
		GameScene.viewContainer.addChild(GameScene.objectContainer);

		//create debug text
        GameScene.debugText = new PIXI.extras.BitmapText("debug: ", {
            font: "AndinaBold",
            tint: 0xFFFFFF
        });
        GameScene.debugText.position = new PIXI.Point(8,8);
        
        //create text shadow
        GameScene.debugTextTexture = PIXI.RenderTexture.create(Display.w, Display.h);
        var dbtDisplayFore = new PIXI.Sprite(GameScene.debugTextTexture);
        dbtDisplayFore.tint = Core.color.acc1;
        var dbtDisplayShadow = new PIXI.Sprite(GameScene.debugTextTexture);
        dbtDisplayShadow.position.y = 1;
        dbtDisplayShadow.tint = Core.color.bg2;

        GameScene.stage.addChild(dbtDisplayShadow);
        GameScene.stage.addChild(dbtDisplayFore);

        GameScene.debugGfx = new PIXI.Graphics();
        GameScene.stage.addChild(GameScene.debugGfx);
	},

	initFilters: function() {
		GameScene.bloom = new BloomFilter();
		GameScene.bloom.blurXFilter.passes = 4;
		GameScene.bloom.blurYFilter.passes = 4;
		GameScene.bloom.blurXFilter.blur = 3;
		GameScene.bloom.blurYFilter.blur = 3;
		GameScene.rgbsplit = new RGBSplitFilter();
		GameScene.rgbsplit.red = new PIXI.Point(0,1);
		GameScene.rgbsplit.blue = new PIXI.Point(0,-1);
		GameScene.rgbsplit.green = new PIXI.Point(0,0);
		GameScene.gameStage.filters = [GameScene.bloom, GameScene.rgbsplit];

		var filterOptions = {
			bloom: true,
			aberration: true,
			bloomStr: 0.75,
			bloomSat: 0.5,
			bloomThresh: 0.3,
			set enableBloom(bool) {
				filterOptions.bloom = bool;
				filterOptions.update();
			},
			get enableBloom() {
				return filterOptions.bloom;
			},
			set enableAberration(bool) {
				filterOptions.aberration = bool;
				filterOptions.update();
			},
			get enableAberration() {
				return filterOptions.aberration;
			},
			set bloomStrength(s) {
				filterOptions.bloomStr = s;
				filterOptions.update();
			},
			get bloomStrength() {
				return filterOptions.bloomStr;
			},
			set bloomSaturation(s) {
				filterOptions.bloomSat = s;
				filterOptions.update();
			},
			get bloomSaturation() {
				return filterOptions.bloomSat;
			},
			set bloomThreshold(s) {
				filterOptions.bloomThresh = s;
				filterOptions.update();
			},
			get bloomThreshold() {
				return filterOptions.bloomThresh;
			},
			update() {
				GameScene.bloom.enabled = filterOptions.bloom;
				GameScene.rgbsplit.enabled = filterOptions.aberration;
				GameScene.bloom.cmFilter.saturate(-1 + 3 * filterOptions.bloomSat);
			    GameScene.bloom.cmFilter.brightness(0.08, true);
			    GameScene.bloom.cmFilter.contrast(30 * filterOptions.bloomStr, true);
			    GameScene.bloom.threshold.threshold = filterOptions.bloomThresh;
			}
		};
		filterOptions.update();
		Display.gui.add(filterOptions, "enableBloom");
		Display.gui.add(filterOptions, "enableAberration");
		Display.gui.add(filterOptions, "bloomStrength").min(0).max(1).step(0.05);
		Display.gui.add(filterOptions, "bloomSaturation").min(0).max(1).step(0.05);
		Display.gui.add(filterOptions, "bloomThreshold").min(0).max(1).step(0.05);
	},

	/**
	 * Called when a scene regains focus.
	 */
	activate: function() {
		Game.WALLHACKS = true;

		//cleanup graphics
		GameScene.objectContainer.removeChildren();

		//readd graphics
 		GameScene.world.obstacles.forEach(function(obstacle){
 			GameScene.objectContainer.addChild(obstacle.gfx);
 		});
 		GameScene.world.entities.forEach(function(entity){
 			GameScene.objectContainer.addChild(entity.gfx);
 		});
	},

	/**
	 * Called when a scene loses focus.
	 */
	deactivate: function() {

	},

	getViewRect: function() {
		var left = GameScene.view.x - Display.w/2;
		var right = GameScene.view.x + Display.w/2;
		var top = GameScene.view.y - Display.h/2;
		var bottom = GameScene.view.y + Display.h/2;
		return new Polygon([
			new Vector(left, top),
			new Vector(right, top),
			new Vector(right, bottom),
			new Vector(left, bottom),
		]);
	},

	inView: function(thing) {
		var rect = GameScene.getViewRect();
		if (thing.hasOwnProperty("points")) {
			for (var i=0; i<thing.points.length; i++)
				if (rect.contains(thing.points[i]))
					return true;
			return false;
		}
		else
			return rect.contains(thing);
	},

	updateView: function(timescale) {
		//update target position
		GameScene.viewTarget = GameScene.world.player.position
			.add(new Vector(Input.mouse)
			.add(GameScene.viewOffset).mult(GameScene.LOOK_INTENSITY));

		//accelerate toward target
		var viewAcc = GameScene.viewTarget.sub(GameScene.view).mult(GameScene.VIEW_ACC);
		GameScene.viewVelocity = GameScene.viewVelocity.add(viewAcc).mult(1-GameScene.VIEW_DAMP);

		//apply view velocity
		GameScene.view = GameScene.view.add(GameScene.viewVelocity);

		//move view toward target without respect to velocity
		var dView = GameScene.viewTarget.sub(GameScene.view).div(Display.w);
		var len = Math.pow(dView.len(), GameScene.VIEW_MOVE_EXP);
		dView = dView.unit().mult(len);
		GameScene.view = GameScene.view.add(dView.mult(Display.w * GameScene.VIEW_MOVE));

		//move container to apply view position
		GameScene.viewContainer.position = GameScene.view.negate().sub(GameScene.viewOffset);
	},

	frame: function(timescale, ticks) {
		//update
		GameScene.updateView(timescale, ticks);
		GameScene.world.frame(timescale, ticks);

		//draw player vision
		//clear buffer
		GameScene.maskGfx.clear();
		GameScene.maskGfx.beginFill(0x000000, 1);
		GameScene.maskGfx.drawRect(0,0,Display.w,Display.h);
		GameScene.maskGfx.endFill();

		//calculate visible polygons
		var polys = GameScene.world.caster.cast(
			GameScene.world.player.position.add(new Vector(0.0001,0.0001)),
			GameScene.getViewRect(),
			true
		);

		GameScene.debugGfx.clear();
		GameScene.world.caster.drawDebug(GameScene.debugGfx);
		GameScene.world.navmesh.drawDebug(GameScene.debugGfx);

		//render each visible polygon to mask graphics
		polys.forEach(function(poly){
			var points = poly.points.map(p =>
				p.sub(GameScene.view).sub(GameScene.viewOffset));
			GameScene.maskGfx.lineStyle(1, 0xFFFFFF, 1);
			GameScene.maskGfx.beginFill(0xFFFFFF, 1);
			GameScene.maskGfx.moveTo(
				(points[points.length-1].x),
				(points[points.length-1].y)
			);
			for (var i=0; i<points.length; i++)
				GameScene.maskGfx.lineTo((points[i].x), (points[i].y));
			GameScene.maskGfx.endFill();
		});

		if (Game.WALLHACKS) {
			GameScene.maskGfx.beginFill(0xFFFFFF, 0.7);
			GameScene.maskGfx.lineStyle(0);
			GameScene.maskGfx.drawRect(0,0,Display.w,Display.h);
			GameScene.maskGfx.endFill();
		}

		// GameScene.world.bsp.renderDebug(GameScene.debugGfx);
		// GameScene.world.segSpace.drawDebug(GameScene.debugGfx);
		GameScene.debugGfx.hitArea = new PIXI.Rectangle(0,0,0,0);

		//copy mask graphics buffer to the mask texture
		Display.renderer.render(GameScene.maskGfx, GameScene.maskTexture);

		//update masked background position
		GameScene.bgtex2.tilePosition.x = Math.floor(-GameScene.view.x);
		GameScene.bgtex2.tilePosition.y = Math.floor(-GameScene.view.y);

		//redraw debug text
		Display.renderer.render(GameScene.debugText, GameScene.debugTextTexture);
		GameScene.debugText.text = "";
		GameScene.debugText.text += "FPS: " + (1000 / Game.frametime).toFixed(0);
	}
};
