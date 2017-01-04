var Core = {
	data: null,
	image: {},
	init: function() {
		Core.load.json("game.json").then(function(data){
			Core.data = data;

			//parse colors
			Core.color = {};
			Object.keys(Core.data.colors).forEach(function(key){
				Core.color[key] = parseInt(Core.data.colors[key], 16);
			});

			//load resources
			var scripts = data.scripts.sources.map(s => Core.load.script(s));
			var images = Object.keys(data.images).map(n => Core.load.image(data.images[n], n));
			var promises = scripts.concat(images);
			Promise.all(promises).then(function(){
				//call main entrypoint function
				var f = window;
				data.scripts.init.split(".").forEach(v => f = f[v]);
				f();
			}).catch(function(err){
				alert("Error loading scripts: \n"+err);
			});
		}).catch(function(err){
			alert("Could not load game data:\n"+err);
		});
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
		 * Loads a JSON file and passes the parsed result to success callback.
		 * If the file cannot be loaded, calls the fail callback.
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

		script: function(src) {
			return new Promise(function(resolve, reject){
				var script = document.createElement("script");
				script.onload = function(){
					resolve(true);
				};
				script.src = src;
				document.body.appendChild(script);
			});
		},

		image: function(src, name) {
			return new Promise(function(resolve, reject){
				var img = new Image();
				img.onload = function(){
					Core.image[name] = img;
					resolve(true);
				};
				img.onerror = function(err){
					reject(err);
				};
				img.src = src;
			});
		}
	}
};

window.addEventListener("load", Core.init, false);
