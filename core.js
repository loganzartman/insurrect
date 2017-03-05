var Core = {
	data: null,
	image: {},
	init: function() {
		if (!Core.sanityCheck())
			return;

		//initialize temporary graphics for loading screen
		Core.loaderGfx.init();

		//load game metadata
		Core.load.json("game.json").then(function(data){
			Core.data = data;

			//parse colors
			Core.color = {};
			Object.keys(Core.data.colors).forEach(function(key){
				Core.color[key] = parseInt(Core.data.colors[key], 16);
			});

			Core.loaderGfx.progress(0.1);

			//load scripts sequentially
			var loaded = 0;
			for (var i=0, j=data.scripts.sources.length; i<j; i++) {
				Core.load.script(data.scripts.sources[i]).then(function(){
					loaded++;
					Core.loaderGfx.progress(0.1 + loaded/j*0.9);
					if (loaded === j)
						Core.scriptsLoaded();
				}).catch(function(err){
					console.error("Error loading scripts: \n"+err);
				});
			}
		}).catch(function(err){
			console.error("Could not load game data:\n"+err);
		});
	},

	/**
	 * Quickly checks a couple arbitrary ES6 APIs to guess whether the browser
	 * will support the game and gracefully display an error message if not.
	 */
	sanityCheck: function() {
		var cont = document.getElementById("container");
		if (typeof Map === "undefined" || typeof Promise === "undefined") {
			document.documentElement.style.cursor = "default";
			cont.innerHTML += "<h2>Whoops!</h2>";
			cont.innerHTML += "It looks like your web browser doesn't support this game.<br>";
			cont.innerHTML += "You should try again with a modern web browser such as Google Chrome, Firefox, or Microsoft Edge.";
			return false;
		}
		return true;
	},

	/**
	 * Callback for script load completion (can assume that all game scripts
	 * are ready)
	 */
	scriptsLoaded: function() {
		Core.gui = new dat.GUI();

		//use Pixi resource loader to load game assets
		var loader = PIXI.loader;
		Object.keys(Core.data.resources).forEach(function(n){loader.add(n, Core.data.resources[n])});
		loader.on("complete", function(){
			Core.loaderGfx.progress(1);
			Core.resource = loader.resources; //alias
			Core.loaderGfx.destroy();

			//call main entrypoint function
			var f = window;
			Core.data.scripts.init.split(".").forEach(function(v){f = f[v]});
			f();
		});
		loader.load();
	},

	/**
	 * Small utility for displaying graphics before scripts are loaded.
	 */
	loaderGfx: {
		barWidth: 200,
		barHeight: 12,
		prog: 0,
		progTgt: 0,
		init: function() {
			Core.loaderGfx.canv = document.createElement("canvas");
			Core.loaderGfx.canv.width = window.innerWidth;
			Core.loaderGfx.canv.height = window.innerHeight;
			Core.loaderGfx.ctx = Core.loaderGfx.canv.getContext("2d");
			document.getElementById("container").appendChild(Core.loaderGfx.canv);
			Core.loaderGfx.timer = setInterval(Core.loaderGfx.redraw, 16);
		},
		color: function(packed, alpha) {
			if (typeof alpha === "undefined")
				alpha = 1.0;
			var red = (packed >>> 16) & 0xFF;
			var grn = (packed >>> 8) & 0xFF;
			var blu = (packed) & 0xFF;
			return "rgba("+red+","+grn+","+blu+","+alpha+")";
		},
		redraw: function() {
			if (Core.loaderGfx.progTgt === 0)
				return;

			//update progress
			var val = Core.loaderGfx.prog * 0.8 + Core.loaderGfx.progTgt * 0.2;
			Core.loaderGfx.prog = val;

			//aliases
			var c = Core.loaderGfx.ctx;
			var w = c.canvas.width, h = c.canvas.height;

			//set style
			c.save();
			c.fillStyle = Core.loaderGfx.color(Core.color.bg2);
			c.fillRect(0,0,w,h);
			var col = Core.loaderGfx.color(Core.color.acc1, val);
			c.strokeStyle = col;
			c.fillStyle = col;
			c.lineWidth = 1;

			c.translate(
				w/2 - Core.loaderGfx.barWidth/2,
				h/3 - Core.loaderGfx.barHeight/2 + 0.5
			);
			c.strokeRect(0,0,Core.loaderGfx.barWidth,Core.loaderGfx.barHeight);
			c.fillRect(0,0,Core.loaderGfx.barWidth*val,Core.loaderGfx.barHeight);
			c.restore();
		},
		progress: function(val) {
			Core.loaderGfx.progTgt = val;
		},
		destroy: function() {
			document.getElementById("container").removeChild(Core.loaderGfx.canv);
			clearInterval(Core.loaderGfx.timer);
		}
	},

	/**
	 * Utilities for loading files
	 */
	load: {
		/**
		 * Loads any file and passes the text result to success callback.
		 * If the file cannot be loaded, calls the fail callback.
		 */
		url: function(url) {
			return new Promise(function(resolve, reject){
				var r = new XMLHttpRequest();
				r.addEventListener("readystatechange", function(){
					if (r.readyState === 4) {
						if (r.status === 200) {
							resolve(r.responseText);
						}
						else {
							reject("Request failed.");
						}
					}
				});
				r.open("GET", url);
				r.send();
			});
		},

		/**
		 * Loads a JSON file and passes the parsed result to the resolve
		 * function.
		 * @param url url
		 * @return a Promise
		 */
		json: function(url) {
			return new Promise(function(resolve, reject){
				Core.load.url(url+"?"+Math.floor(Math.random()*10000)).then(function s(json){
					json = JSON.parse(json);
					resolve(json);
				}).catch(function f(err){
					reject(err);
				});
			});
		},

		/**
		 * Loads a script and executes it immediately upon completion.
		 * @param src url
		 * @return a Promise
		 */
		script: function(src) {
			return new Promise(function(resolve, reject){
				var script = document.createElement("script");
				script.onload = function(){
					resolve(true);
				};
				script.src = src;
				script.async = false;
				document.body.appendChild(script);
			});
		}
	}
};

window.addEventListener("load", Core.init, false);
