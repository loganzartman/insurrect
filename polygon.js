class Polygon {
    constructor(points) {
        //ensure that all points are Vectors
        this.points = points.map(function(point){
            if (point instanceof Vector)
                return point
            return V(point.x, point.y);
        });
    }

    /**
     * Determine whether this Polygon contains a given point.
     * @param point a Vector
     * @return whether point is within this Polygon
     */
    contains(point) {
        //ported from pixi.js
        var inside = false;
        var x = point.x, y = point.y;

        // use some raycasting to test hits
        // https://github.com/substack/point-in-polygon/blob/master/index.js
        var length = this.points.length;
        for (var i = 0, j = length - 1; i < length; j = i++) {
            var xi = this.points[i].x;
            var yi = this.points[i].y;
            var xj = this.points[j].x;
            var yj = this.points[j].y;
            var intersect = yi > y !== yj > y && x < (xj - xi) * ((y - yi) / (yj - yi)) + xi;

            if (intersect)
                inside = !inside;
        }
        return inside;
    }

    /**
     * Generates an array of all segments in this Polygon.
     * Each segment is represented by an array containing two Vectors.
     * @return all segments
     */
    getSegments() {
        var segments = [];
        for (var i=0,j=this.points.length; i<j; i++)
            segments.push([this.points[i], this.points[(i+1)%j]]);
        return segments;
    }
    
    toPixiPolygon() {
        return new PIXI.Polygon(this.points.map(v => v.toPixiPoint()));
    }
}
