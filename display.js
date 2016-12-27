var Display = {
	w: 320,
	h: 240,
	scale: 1,
	init: function(scale, element) {
		Display.scale = scale;

		//create rendering canvas
		Display.buffer = document.createElement("canvas");
		Display.buffer.width = Display.w;
		Display.buffer.height = Display.h;
		
		//create pixi renderer

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
		with (Display.buffer.getContext("2d")) {
			//todo: remove this
			fillStyle = "black";
			fillRect(0,0,Display.w,Display.h);
			fillStyle = "red";
			fillRect(16, 16, 16, 16);
		}

		Display.cctx.drawImage(
			Display.buffer, 
			0, 0, 
			Display.canvas.width, Display.canvas.height
		);
	}
}