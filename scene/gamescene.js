var GameScene = {
	stage: null,
	t0: 0,
	view: V(0,0),
	viewOffset: V(-Display.w/2, - Display.h/2),
	viewTarget: {position: V(0,0)},

	init: function() {
		GameScene.stage = new PIXI.Container();

		//unmasked things
		GameScene.unmaskedBg = new PIXI.Graphics();
		GameScene.stage.addChild(GameScene.unmaskedBg);
		GameScene.bgtex = new PIXI.extras.TilingSprite(PIXI.Texture.fromImage("image/qmtex.png"), Display.w, Display.h);
		GameScene.bgtex.tint = Core.color.bg2;
		GameScene.stage.addChild(GameScene.bgtex);

		//contains anything that is masked by player sight
		GameScene.maskedContainer = new PIXI.Container();
		GameScene.maskGfx = new PIXI.Graphics();
		GameScene.maskTexture = PIXI.RenderTexture.create(Display.w, Display.h);
		GameScene.mask = new PIXI.Sprite(GameScene.maskTexture);
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
		Game.entities.forEach(function(entity){
			GameScene.objectContainer.addChild(entity.gfx);
		});
	},

	/**
	 * Called when a scene loses focus.
	 */
	deactivate: function() {

	},

	/**
	 * Generates a polygon representing visible areas from a given position.
	 * @param position where from?
	 */
	calculateVision: function(position, includeObjects) {
		// return new PIXI.Polygon([position]);
		//collect visible polygons
		viewRect = GameScene.getViewRect();
		viewRect.noDisplay = true;
		var polygons = [viewRect];
		Game.objects.forEach(function(object){
			if (object instanceof Obstacle)
				//TODO: visibility check
				polygons.push(object.poly);
		});

		//cast ray from position to each vertexa
		var intersections = [];
		var vertices = [];
		polygons.forEach(function(p){
			p.points.forEach(function(v){ 
				vertices.push(v);
			})
		});
		
		//avoid getting stuck on corners
		var angles = vertices.map(v => v.sub(position).dir());
		angles.forEach(a => {
			angles.push(a - 0.00001);
			angles.push(a + 0.00001);
		});

		var visiblePolys = [];
		angles.forEach(function(dir){
			var min = null;
			var minPoly = null;
			polygons.forEach(function(polygon){
				for (var i=0,j=polygon.points.length; i<j; i++) {
					var pointA = polygon.points[i];
					var pointB = polygon.points[(i+1)%j];
					var result = Util.geom.rayLineIntersect(
						position, Vector.fromDir(dir), pointA, pointB);
					if (result !== null) { 
						if (min === null || result.param < min.param) {
							min = result;
							minPoly = polygon;
						}
					}
				}
			});
			if (min !== null) {
				intersections.push(V(min.x, min.y));
				if (includeObjects && !minPoly.noDisplay && !visiblePolys.includes(minPoly))
					visiblePolys.push(minPoly);
			}
		});
		
		//sort intersections by angle
		intersections.sort((a,b) => a.sub(position).dir() - b.sub(position).dir());

		//construct polygon representing vision
		visiblePolys.push(new PIXI.Polygon(intersections));
		return visiblePolys;
	},

	getViewRect: function() {
		var left = GameScene.view.x - Display.w/2;
		var right = GameScene.view.x + Display.w/2;
		var top = GameScene.view.y - Display.h/2;
		var bottom = GameScene.view.y + Display.h/2;
		return new PIXI.Polygon([
			V(left, top),
			V(right, top),
			V(right, bottom),
			V(left, bottom),
		]);
	},

	inView: function(vector) {
		return GameScene.getViewRect()
			.contains(vector.x, vector.y);
	},

	frame: function(timescale) {
		var t = Game.time - GameScene.t0;
		GameScene.viewContainer.position.x = Math.floor(-GameScene.view.x + Display.w/2);
		GameScene.viewContainer.position.y = Math.floor(-GameScene.view.y + Display.h/2);
		Game.objects.forEach(function(object){
			object.draw();
		});
		Game.entities.forEach(function(entity){
			entity.frame(timescale);
			entity.draw();
		});

		//update mask
		var dummyMaskPos = V(Input.mouse.x, Input.mouse.y);

		//draw player vision
		GameScene.maskGfx.clear();
		GameScene.maskGfx.beginFill(0x000000, 1);
		GameScene.maskGfx.drawRect(0,0,Display.w,Display.h);
		GameScene.maskGfx.endFill();
		var polys = GameScene.calculateVision(Game.player.position.add(V(0.0001,0.0001)), true);
		polys.forEach(function(poly){
			var points = poly.points.map(p => p.sub(GameScene.view).sub(GameScene.viewOffset));
			GameScene.maskGfx.beginFill(0xFFFFFF, 1);
			GameScene.maskGfx.moveTo(~~points[points.length-1].x, ~~points[points.length-1].y);
			for (var i=0; i<points.length; i++)
				GameScene.maskGfx.lineTo(~~points[i].x, ~~points[i].y);
			GameScene.maskGfx.endFill();
		});

		Display.renderer.render(GameScene.maskGfx, GameScene.maskTexture);

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