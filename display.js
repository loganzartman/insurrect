var Display = {
	w: 320,
	h: 240,
	padding: 4,
	stage: null,
	init: function(scale, element) {
		Display.scale = scale;

		//create rendering canvas
		Display.buffer = document.createElement("canvas");
		Display.buffer.width = Display.w;
		Display.buffer.height = Display.h;

		//rig PIXI interaction to work with custom display scaling
	    PIXI.interaction.InteractionManager.prototype.mapPositionToPoint = function mapPositionToPoint(point, x, y) {
	        var rect = void 0;

	        // IE 11 fix
	        if (!this.interactionDOMElement.parentElement) {
	            rect = { x: 0, y: 0, width: 0, height: 0 };
	        } else {
	            rect = this.interactionDOMElement.getBoundingClientRect();
	        }

	        var resolutionMultiplier = navigator.isCocoonJS ? this.resolution : 1.0 / this.resolution;

	        //////////////////////////////////////
	        // This is the only modification:
	        resolutionMultiplier /= scale;
	        //////////////////////////////////////

	        point.x = (x - rect.left) * (this.interactionDOMElement.width / rect.width) * resolutionMultiplier;
	        point.y = (y - rect.top) * (this.interactionDOMElement.height / rect.height) * resolutionMultiplier;
	    };

		//create pixi renderer
		PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
		Display.renderer = new PIXI.WebGLRenderer(Display.w, Display.h, {
			view: Display.buffer,
			antialias: false
		});
		Display.gfx = new PIXI.Graphics();

		//create output canvas
		Display.canvas = document.createElement("canvas");
		Display.canvas.width = Math.ceil(Display.w * scale);
		Display.canvas.height = Math.ceil(Display.h * scale);
		Display.cctx = Display.canvas.getContext("2d");
		Display.cctx.imageSmoothingEnabled = false;
		element.appendChild(Display.canvas);

		//rig PIXI interaction to work with custom display scaling
		Display.renderer.plugins.interaction.setTargetElement(Display.canvas);
	},

	frame: function(timescale) {
		//draw stuff
		Display.gfx.clear();
		Display.gfx.lineStyle(1, Core.color.acc1, 1);
		Display.gfx.drawCircle(
			Input.mouse.x, Input.mouse.y,
			Input.mouse.left || Input.mouse.right ? 5 + Math.random() : 3
		);

		//render to screen
		Display.renderer.render(Display.stage);
		Display.cctx.drawImage(
			Display.buffer,
			0, 0,
			Display.canvas.width, Display.canvas.height
		);
	},

	makeButton: function(text, color1, color2, action) {
		var cont = new PIXI.Container();

		//create text
		var txt = new PIXI.extras.BitmapText(text, {
			font: "Andina",
			align: "left",
			tint: 0xFFFFFF
		});
		txt.updateText();
		txt.position.x = Display.padding;
		txt.position.y = Display.padding;

		//create button
		var gfx = new PIXI.Graphics();
		gfx.lineStyle(1, 0xFFFFFF);
		gfx.drawRect(0, 0, txt.width + Display.padding * 2, 10 + Display.padding * 2);
		txt.tint = gfx.tint = color1;

		//add interactivity
		gfx.interactive = true;
		gfx.hitArea = new PIXI.Rectangle(0, 0, gfx.width, gfx.height);
		gfx.on("mouseover", function(){
			txt.tint = gfx.tint = color2;
		});
		gfx.on("mouseout", function(){
			txt.tint = gfx.tint = color1;
		});
		gfx.on("click", action);

		cont.addChild(gfx);
		cont.addChild(txt);
		return cont;
	},

	centerObj: function(displayObj, h, v) {
		if (h)
			displayObj.position.x = Math.floor((Display.w - displayObj.width) / 2);
		if (v)
			displayObj.position.y = Math.floor((Display.h - displayObj.height) / 2);
	}
}
