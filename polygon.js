var Polygon = function(points) {
    //ensure that all points are Vectors
    this.points = points.map(function(point){
        if (point instanceof Vector)
            return point
        return V(point.x, point.y);
    });
};
Polygon.prototype.contains = function(point) {
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
};
Polygon.prototype.getSegments = function() {
    var segments = [];
    for (var i=0,j=this.points.length; i<j; i++)
        segments.push([this.points[i], this.points[(i+1)%j]]);
    return segments;
};
Polygon.prototype.toPixiPolygon = function() {
    return new PIXI.Polygon(this.points.map(v => v.toPixiPoint()));
};
