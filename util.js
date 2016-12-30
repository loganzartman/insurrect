var Util = {
	geom: {
		circleSegIntersect: function(circlePos,radius,pointA,pointB) {
			//todo: check parallel things to avoid doing this
			pointB = pointB.add(V(0.0001,0.0001));

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

			if (onSegment && circlePos.sub(V(xx,yy)).len() < radius)
					return true;
			return false;
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
		}
	}
};