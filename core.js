var Core = {
	data: null,
	init: function() {
		Core.load.json("game.json").then(function(data){
			Core.data = data;
			var promises = data.scripts.sources.map(s => Core.load.script(s));
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
		}
	}
};

window.addEventListener("load", Core.init, false);