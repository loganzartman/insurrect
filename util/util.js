var Util = {
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