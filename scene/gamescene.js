var GameScene = {
	stage: null,
	t0: 0,
	view: new Vector(0,0),
	viewOffset: new Vector(-Display.w/2, - Display.h/2),
	viewTarget: new Vector(0,0),
	VIEW_SPEED: 0.2,
	LOOK_INTENSITY: 0.4,

	init: function(params) {
		//world setup
		GameScene.world = params.world;

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

		//graphics setup
		GameScene.stage = new PIXI.Container();

		//unmasked things
		GameScene.unmaskedBg = new PIXI.Graphics();
		GameScene.stage.addChild(GameScene.unmaskedBg);
		GameScene.bgtex = new PIXI.extras.TilingSprite(Core.resource.qmtex.texture, Display.w, Display.h);
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
		GameScene.bgtex2 = new PIXI.extras.TilingSprite(Core.resource.floor.texture, Display.w, Display.h);
		GameScene.bgtex2.tint = Core.color.bg1;
		GameScene.maskedContainer.addChild(GameScene.bgtex2);

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

	/**
	 * Generates a polygon representing visible areas from a given position.
	 * @param position where from?
	 */
	calculateVision: function(position, includeObjects) {
		// return new PIXI.Polygon([position]);
		//collect visible polygons
		viewRect = GameScene.getViewRect();
		viewRect.noDisplay = true;
		var polygons = [];
		var segments = [];
		GameScene.world.obstacles.forEach(function(object){
			if (object instanceof Obstacle && GameScene.inView(object.poly)) {
				polygons.push(object.poly);
				object.poly.getSegments().forEach(s => segments.push(s));
			}
		});
		polygons.push(viewRect);

		//cast ray from position to each vertexa
		var intersections = [];
		var vertices = [];
		polygons.forEach(function(p){
			p.points.forEach(function(v){
				vertices.push(v);
			})
		});

		Util.geom.segIntersections(viewRect.getSegments(), segments)
			.forEach(i => vertices.push(i));

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
					var result = Util.geom.raySegIntersect(
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
				intersections.push(new Vector(min.x, min.y));
				if (includeObjects && !minPoly.noDisplay && !visiblePolys.includes(minPoly))
					visiblePolys.push(minPoly);
			}
		});

		//sort intersections by angle
		intersections.sort((a,b) => a.sub(position).dir() - b.sub(position).dir());

		//construct polygon representing vision
		visiblePolys.push(new Polygon(intersections));
		return visiblePolys;
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

		//move view toward target
		GameScene.view = GameScene.view.mult(1-GameScene.VIEW_SPEED)
			.add(GameScene.viewTarget.mult(GameScene.VIEW_SPEED));

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
		var polys = GameScene.calculateVision(
			GameScene.world.player.position.add(new Vector(0.0001,0.0001)), true);

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

		//copy mask graphics buffer to the mask texture
		Display.renderer.render(GameScene.maskGfx, GameScene.maskTexture);

		//update masked background position
		GameScene.bgtex2.tilePosition.x = Math.floor(-GameScene.view.x);
		GameScene.bgtex2.tilePosition.y = Math.floor(-GameScene.view.y);
	}
};
