var Util = {
	rand: function(a,b) {
		if (typeof a === "undefined")
			return Util.rand(0,1);
		if (typeof b === "undefined")
			return Util.rand(0,a);
		return Math.random()*(b-a)+a;
	},

	color: {
		rgb: function(r,g=r,b=r) {
			const f = Util.color.clipScale;
			return (f(r) << 16) | (f(g) << 8) | f(b);
		},
		rgba: function(r,g,b,a=1) {
			const f = Util.color.clipScale;
			return (f(r) << 24) | (f(g) << 16) | (f(b) << 8) | f(a);
		},
		unRgb: function(rgb) {
			return {
				b: (rgb) & 0xFF,
				g: (rgb >>= 8) & 0xFF,
				r: (rgb >>= 8) & 0xFF
			};
		},
		unRgba: function(rgba) {
			return {
				a: (rgba) & 0xFF / 255,
				b: (rgba >>= 8) & 0xFF,
				g: (rgba >>= 8) & 0xFF,
				r: (rgba >>= 8) & 0xFF
			};
		},
		clipScale: c => Math.round(Math.max(0, Math.min(c, 1)) * 255),
		hslaToRgba: function(h,s,l,a=1) {
			let r, g, b;
			if (s == 0) {
				r = g = b = l; // achromatic
			}
			else {
				const hue2rgb = function hue2rgb(p, q, t){
					if(t < 0) t += 1;
					if(t > 1) t -= 1;
					if(t < 1/6) return p + (q - p) * 6 * t;
					if(t < 1/2) return q;
					if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
					return p;
				}

				let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
				let p = 2 * l - q;
				r = hue2rgb(p, q, h + 1/3);
				g = hue2rgb(p, q, h);
				b = hue2rgb(p, q, h - 1/3);
			}
			return [r,g,b,a];
		},
		hueGenerator: function*(n, f=()=>arguments) {
			for (let i=0; i<n; i++)
				yield f.apply(this, Util.color.hslaToRgba((i+0.5)/n, 1, 0.5));
		}
	},

	geom: {
		/**
		 * Checks for an intersection between a circle of given radius and
		 * a line segment.
		 * Returns true if there is an intersection, false otherwise.
		 * @param circlePos Vector position of the circle
		 * @param radius radius of the cirlce
		 * @param pointA first point in the line segment
		 * @param pointB second point in the line segment
		 * @return whether an intersection exists.
		 */
		circleSegIntersect: function(circlePos,radius,segment) {
			var pointA = segment.a;
			var pointB = segment.b;
			//todo: check parallel things to avoid doing this
			pointB = pointB.add(new Vector(0.0001,0.0001));

			var d1 = circlePos.sub(pointA).len();
			var d2 = circlePos.sub(pointB).len();
			if (d1<=radius || d2<=radius)
				return true;

			var k1 = ((pointB.y-pointA.y)/(pointB.x-pointA.x));
			var k2 = pointA.y;
			var k3 = -1/k1;
			var k4 = circlePos.y;

			var xx = (k1*pointA.x-k2-k3*circlePos.x+k4)/(k1-k3);
			var yy = k1*(xx-pointA.x)+pointA.y;

			var onSegment = true;
			if (pointB.x>pointA.x) {
				if (!(xx >= pointA.x && xx <= pointB.x))
					onSegment = false;
			}
			else {
				if (!(xx >= pointB.x && xx <= pointA.x))
					onSegment = false;
			}

			if (pointB.y > pointA.y) {
				if (!(yy >= pointA.y && yy <= pointB.y))
					onSegment = false;
			}
			else {
				if (!(yy >= pointB.y && yy <= pointA.y))
					onSegment = false;
			}

			if (onSegment && circlePos.sub(new Vector(xx,yy)).len() < radius)
					return true;
			return false;
		},

		/**
		 * Find the intersection, if any, between a ray of infinite length and
		 * a line segment.
		 * Returns null if no intersection exists, or an object with position
		 * and the line parameter.
		 * @param rayPoint start point of the ray
		 * @param rayDir direction of the ray
		 * @param pointA first point in the segment
		 * @param pointB second point in the segment
		 * @return intersection, if any
		 */
		raySegIntersect: function(rayPoint, rayDir, segment) {
			var pointA = segment.a;
			var pointB = segment.b;

			// var segDx = pointB.sub(pointA);
			var segDx = pointB.x - pointA.x;
			var segDy = pointB.y - pointA.y;
			// if (rayDir.dir() === segDx.dir())
			// 	return null;

			//solve for line parameters
			var T2 = (rayDir.x * (pointA.y - rayPoint.y) + rayDir.y * (rayPoint.x - pointA.x));
			T2 /= (segDx*rayDir.y - segDy*rayDir.x);
			var T1 = (pointA.x + segDx * T2 - rayPoint.x) / rayDir.x;

			//parameters out of bounds indicates no intersection
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

		/**
		 * Determines whether two line segments intersect and returns the a
		 * Vector representing the intersection position if they do.
		 * @param a1 point 1 in the first segment
		 * @param a2 point 2 in the first segment
		 * @param b1 point 1 in the second segment
		 * @param b2 point 2 in the second segment
		 * @return intersection Vector, or null if there is none
		 */
		segSegIntersect: function(segA, segB) {
			var a1 = segA.a;
			var a2 = segA.b;
			var b1 = segB.a;
			var b2 = segB.b;
			var x0 = a1.x, x1 = b1.x, x2 = a2.x, x3 = b2.x;
			var y0 = a1.y, y1 = b1.y, y2 = a2.y, y3 = b2.y;

			//solve for parameters t and u
			//where t and u are the parameters of the parametric forms of lines
			//A and B respectively
			var fraction = 1/(x0*(y1-y3) - x1*(y0-y2) - x2*(y1-y3) + x3*(y0-y2));
			var t = x0*(y1-y3) - x1*(y0-y3) + x3*(y0-y1);
			t *= fraction;
			var u = x0*(y1-y2) - x1*(y0-y2) + x2*(y0-y1);
			u *= fraction;

			//parameters out of the bounds [0,1] indicates no intersection
			if (t < 0 || t > 1)
				return null;
			if (u < 0 || u > 1)
				return null;

			//calculate intersection position using parametric forms
			return new Vector(
				x0 + t*(x2 - x0),
				y0 + t*(y2 - y0)
			);
		},

		segLineIntersect: function(seg, line) {
			var a1 = seg.a;
			var a2 = seg.b;
			var b1 = line.a;
			var b2 = line.b;
			var x0 = a1.x, x1 = b1.x, x2 = a2.x, x3 = b2.x;
			var y0 = a1.y, y1 = b1.y, y2 = a2.y, y3 = b2.y;

			//solve for parameters t and u
			//where t and u are the parameters of the parametric forms of lines
			//A and B respectively
			var fraction = 1/(x0*(y1-y3) - x1*(y0-y2) - x2*(y1-y3) + x3*(y0-y2));
			var t = x0*(y1-y3) - x1*(y0-y3) + x3*(y0-y1);
			t *= fraction;
			var u = x0*(y1-y2) - x1*(y0-y2) + x2*(y0-y1);
			u *= fraction;

			//parameters out of the bounds [0,1] indicates no intersection
			if (isNaN(t) || t < 0 || t > 1)
				return null;

			//calculate intersection position using parametric forms
			return new Vector(
				x0 + t*(x2 - x0),
				y0 + t*(y2 - y0)
			);
		},

		lineLineIntersect: function(lineA, lineB) {
			var a1 = lineA.a;
			var a2 = lineA.b;
			var b1 = lineB.a;
			var b2 = lineB.b;
			var x0 = a1.x, x1 = b1.x, x2 = a2.x, x3 = b2.x;
			var y0 = a1.y, y1 = b1.y, y2 = a2.y, y3 = b2.y;

			//solve for parameters t and u
			//where t and u are the parameters of the parametric forms of lines
			//A and B respectively
			var fraction = 1/(x0*(y1-y3) - x1*(y0-y2) - x2*(y1-y3) + x3*(y0-y2));
			var t = x0*(y1-y3) - x1*(y0-y3) + x3*(y0-y1);
			t *= fraction;
			var u = x0*(y1-y2) - x1*(y0-y2) + x2*(y0-y1);
			u *= fraction;

			// if (isNaN(t))
			// 	return null;

			//calculate intersection position using parametric forms
			return new Vector(
				x0 + t*(x2 - x0),
				y0 + t*(y2 - y0)
			);
		},

		/**
		 * Finds all intersections between segments in list 1 and segments in
		 * list 2.
		 * @param segs1 list 1
		 * @param segs2 list 2
		 * @return array of Vectors representing intersections
		 */
		segIntersections: function(segs1, segs2) {
			var intersections = [];
			segs1.forEach(function(a){
				segs2.forEach(function(b){
					if (a === b)
						return;
					var i = Util.geom.segSegIntersect(a, b);
					if (i)
						intersections.push(i);
				});
			});
			return intersections;
		},

		fixSegments: function(segments) {
			let out = [];
			segments.forEach(segment => {
				let src = [segment];
				src.forEach(segA => {
					segments.forEach(segB => {
						segA.divide(segB).forEach(seg => out.push(seg));
					});
				});
			});
			return out;
		}
	}
};

Array.prototype.random = function() {
	return this[Math.floor(Math.random()*this.length)];
};