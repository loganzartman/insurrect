var Display = {
	w: 320,
	h: 240,
	init: function(scale, element) {
		Display.scale = scale;

		//create rendering canvas
		Display.buffer = document.createElement("canvas");
		Display.buffer.width = Display.w;
		Display.buffer.height = Display.h;
		
		//create pixi renderer
		Display.renderer = PIXI.autoDetectRenderer(Display.w, Display.h, {
			view: Display.buffer,
			antialias: false
		});
		Display.stage = new PIXI.Container();

		Display.testgfx = new PIXI.Graphics();
		Display.stage.addChild(Display.testgfx);

		//create output canvas
		Display.canvas = document.createElement("canvas");
		Display.canvas.width = Math.ceil(Display.w * scale);
		Display.canvas.height = Math.ceil(Display.h * scale);
		Display.cctx = Display.canvas.getContext("2d");
		Display.cctx.imageSmoothingEnabled = false;
		element.appendChild(Display.canvas);
	},

	frame: function(timescale) {
		//do pixi stuff
		Display.testgfx.clear();
		Display.testgfx.lineStyle(1, 0x00FFFF, 1);
		Display.testgfx.drawCircle(
			Display.w/2, Display.h/2,
			(0.5*Math.sin(Game.time*2) + 0.5)*50+50
		);

		//render to screen
		Display.renderer.render(Display.stage);
		Display.cctx.drawImage(
			Display.buffer, 
			0, 0, 
			Display.canvas.width, Display.canvas.height
		);
	}
}