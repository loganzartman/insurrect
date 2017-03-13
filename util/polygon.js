class Polygon {
    constructor(points, holes) {
        if (typeof holes === "undefined")
            holes = [];

        //ensure that all points are Vectors
        this.points = points.map(function(point){
            if (point instanceof Vector)
                return point
            return new Vector(point);
        });

        this.holes = holes;
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
        for (var i=0,j=this.points.length; i<j; i++) {
            var seg = new Segment(this.points[i], this.points[(i+1)%j]);
            seg.parentPolygon = this;
            segments.push(seg);
        }
        return segments;
    }

    /**
     * Returns an AABB of this polygon
     */
    getBounds() {
        var max = new Vector(this.points[0]), min = new Vector(this.points[0]);
        this.points.forEach(point => {
            max.x = Math.max(max.x, point.x);
            max.y = Math.max(max.y, point.y);
            min.x = Math.min(min.x, point.x);
            min.y = Math.min(min.y, point.y);
        });
        return {
            max: max,
            min: min
        };
    }

    toPixiPolygon() {
        return new PIXI.Polygon(this.points.map(v => v.toPixiPoint()));
    }

    toClipperPath() {
        return this.points.map(v => {return {X: v.x, Y: v.y}});
    }

    static fromClipperPath(path) {
        return new Polygon(path.map(point => new Vector(point.X, point.Y)));
    }

    static fromClipperExPoly(exPoly) {
        return new Polygon(
            exPoly.outer.map(point => new Vector(point.X, point.Y)),
            exPoly.holes.map(hole => hole.map(point => new Vector(point.X, point.Y)))
        );
    }

    static toClipperPaths(polygons) {
        let paths = [];
        polygons.forEach(poly => paths.push(poly.toClipperPath()));
        return paths;
    }

    static fromClipperPaths(paths) {
        return paths.map(path => Polygon.fromClipperPath(path));
    }

    static fromClipperExPolys(exPolys) {
        return exPolys.map(poly => Polygon.fromClipperExPoly(poly));
    }

    static triangulate() {

    }

    static clip(subjects, clips, clipType) {
        let clip = new ClipperLib.Clipper();
        
        //prepare paths
        let subjPaths = Polygon.toClipperPaths(subjects);
        let clipPaths = Polygon.toClipperPaths(clips);
        ClipperLib.JS.ScaleUpPaths(subjPaths, 100);
        ClipperLib.JS.ScaleUpPaths(clipPaths, 100);

        //perform clipping
        clip.AddPaths(subjPaths, ClipperLib.PolyType.ptSubject, true);
        clip.AddPaths(clipPaths, ClipperLib.PolyType.ptClip, true);
        let solnTree = new ClipperLib.PolyTree();
        let success = clip.Execute(
            clipType,
            solnTree,
            ClipperLib.PolyFillType.pftNonZero,
            ClipperLib.PolyFillType.pftNonZero
        );
        if (!success)
            throw new Error("Clipping failed!");

        let exPolys = ClipperLib.JS.PolyTreeToExPolygons(solnTree);
        Polygon.scaleExPolygons(exPolys, 1/100);
        
        return Polygon.fromClipperExPolys(exPolys);
    }

    static scaleExPolygons(exPolygons, scale) {
        exPolygons.forEach(poly => {
            poly.outer.forEach(point => {
                point.X *= scale;
                point.Y *= scale;
            });
            poly.holes.forEach(hole => {
                hole.forEach(point => {
                    point.X *= scale;
                    point.Y *= scale;
                });
            });
        });
    }

    static union(subjects, clips) {
        return Polygon.clip(subjects, clips, ClipperLib.ClipType.ctUnion);
    }

    static difference(subjects, clips) {
        return Polygon.clip(subjects, clips, ClipperLib.ClipType.ctDifference);
    }
}
