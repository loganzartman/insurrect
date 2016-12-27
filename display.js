var Display = {
	w: 320,
	h: 240,
	stage: null,
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

		//create output canvas
		Display.canvas = document.createElement("canvas");
		Display.canvas.width = Math.ceil(Display.w * scale);
		Display.canvas.height = Math.ceil(Display.h * scale);
		Display.cctx = Display.canvas.getContext("2d");
		Display.cctx.imageSmoothingEnabled = false;
		element.appendChild(Display.canvas);
	},

	frame: function(timescale) {
		//render to screen
		Display.renderer.render(Display.stage);
		Display.cctx.drawImage(
			Display.buffer, 
			0, 0, 
			Display.canvas.width, Display.canvas.height
		);
	}
}