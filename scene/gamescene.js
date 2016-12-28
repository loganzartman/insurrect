var GameScene = {
	stage: null,
	t0: 0,
	view: V(0,0),
	viewOffset: V(-Display.w/2, - Display.h/2),

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

	/**
	 * Generates a polygon representing visible areas from a given position.
	 * @param position where from?
	 */
	calculateVision: function(position) {
		// return new PIXI.Polygon([position]);
		//collect visible polygons
		var polygons = [GameScene.getViewRect()];
		Game.objects.forEach(function(object){
			if (object instanceof Obstacle)
				//TODO: visibility check
				polygons.push(object.poly);
		});

		//cast ray from position to each vertex
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

		angles.forEach(function(dir){
			var min = null;
			polygons.forEach(function(polygon){
				for (var i=0,j=polygon.points.length; i<j; i++) {
					var pointA = polygon.points[i];
					var pointB = polygon.points[(i+1)%j];
					var result = GameScene.rayLineIntersect(
						position, Vector.fromDir(dir), pointA, pointB);
					if (result !== null)
						if (min === null || result.param < min.param)
							min = result;
				}
			});
			if (min !== null)
				intersections.push(V(min.x, min.y));
		});
		
		//sort intersections by angle
		intersections.sort((a,b) => a.sub(position).dir() - b.sub(position).dir());

		//construct polygon representing vision
		return new PIXI.Polygon(intersections);
	},

	rayLineIntersect: function(rayPoint, rayDir, pointA, pointB) {
		var segDx = pointB.sub(pointA);
		if (rayDir.dir() === segDx.dir())
			return null;

		//do math
		var T2 = (rayDir.x * (pointA.y - rayPoint.y) + rayDir.y * (rayPoint.x - pointA.x));
		T2 /= (segDx.x*rayDir.y - segDx.y*rayDir.x);
		var T1 = (pointA.x + segDx.x * T2 - rayPoint.x) / rayDir.x;

		//determine intersection
		if (T1<0)
			return null;
		if (T2<0 || T2>1)
			return null;

		// Return the POINT OF INTERSECTION
		return {
			x: rayPoint.x+rayDir.x*T1,
			y: rayPoint.y+rayDir.y*T1,
			param: T1
		};
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

		//update mask
		var dummyMaskPos = V(Input.mouse.x, Input.mouse.y);
		GameScene.mask.clear();
		GameScene.mask.beginFill(1, 0xFFFFFF);
		// GameScene.mask.drawCircle(dummyMaskPos.x, dummyMaskPos.y, 320);
		//TODO: remove
		if (Input.keys[Input.key.UP])
			GameScene.view.y -= 5;
		if (Input.keys[Input.key.LEFT])
			GameScene.view.x -= 5;
		if (Input.keys[Input.key.DOWN])
			GameScene.view.y += 5;
		if (Input.keys[Input.key.RIGHT])
			GameScene.view.x += 5;
		var poly = GameScene.calculateVision(dummyMaskPos.add(GameScene.view).add(GameScene.viewOffset));
		// GameScene.mask.lineStyle(1, 0x00FF00, 1);
		var points = poly.points.map(p => p.sub(GameScene.view).sub(GameScene.viewOffset));
		GameScene.mask.moveTo(points[points.length-1].x, points[points.length-1].y);
		for (var i=0; i<points.length; i++)
			// GameScene.mask.drawCircle(points[i].x, points[i].y, 3);
			GameScene.mask.lineTo(points[i].x, points[i].y);
		// poly.points.map(p => p.sub(GameScene.view).sub(GameScene.viewOffset))
		// points.forEach(p => GameScene.mask.drawRect(
		// 	p.x - 3, p.y - 3, 6, 6
		// ));
		// GameScene.mask.drawShape();
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