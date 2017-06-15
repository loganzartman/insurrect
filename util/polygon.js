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

    addHole(poly) {
        this.holes.push(poly.points);
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

    adjacentTo(poly) {
        let segsA = this.getSegments();
        let segsB = poly.getSegments();
        for (let i=0; i<segsA.length; i++) {
            for (let j=0; j<segsB.length; j++) {
                let dirA = segsA[i].dir();
                let dirB = segsB[j].dir();
                if (segsA[i].getIntersection(segsB[j]) && dirA === dirB)
                    return true;
            }
        }
        return false;
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

    getCentroid() {
        let z = this.points;
        let c = new Vector();
        for (let i=0,j=z.length; i<j; i++) {
            c.x += z[i].x/j;
            c.y += z[i].y/j;
        }
        return c;
    }

    clean() {
        const SCALE = 100;
        let path = this.toClipperPath();
        ClipperLib.JS.ScaleUpPath(path, SCALE);
        path = ClipperLib.Clipper.CleanPolygon(path, 0.1 * SCALE);
        ClipperLib.JS.ScaleDownPath(path, SCALE);
        this.points = Polygon.fromClipperPath(path).points;
    }

    toPixiPolygon() {
        return new PIXI.Polygon(this.points.map(v => v.toPixiPoint()));
    }

    toClipperPath() {
        return this.points.map(v => {return {X: v.x, Y: v.y}});
    }

    toP2TContext() {
        let contour = this.points.map(point => new poly2tri.Point(point.x, point.y));
        let holes = this.holes.map(hole => hole.map(point => new poly2tri.Point(point.x, point.y)));
        let ctx = new poly2tri.SweepContext(contour);
        holes.forEach(hole => ctx.addHole(hole));
        return ctx;
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

    static fromP2TTriangle(tri) {
        let points = tri.getPoints().map(point => new Vector(point));
        return new Polygon(points);
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

    static simplify(polys) {
        const SCALE = 100;
        let paths = Polygon.toClipperPaths(polys);
        ClipperLib.JS.ScaleUpPaths(paths, SCALE);
        paths = ClipperLib.Clipper.SimplifyPolygons(paths, ClipperLib.PolyFillType.pftNonZero);
        ClipperLib.JS.ScaleDownPaths(paths, SCALE);
        return Polygon.fromClipperPaths(paths);
    }

    static clean(polys, delta=0.1) {
        const SCALE = 100;
        let paths = Polygon.toClipperPaths(polys);
        ClipperLib.JS.ScaleUpPaths(paths, SCALE);
        
        let result = new ClipperLib.Clipper.CleanPolygons(paths, delta * SCALE);

        ClipperLib.JS.ScaleDownPaths(result, SCALE);
        return Polygon.fromClipperPaths(result);
    }

    static offset(polys, distance, miterLimit=2, arcTolerance=0.25) {
        const SCALE = 100;
        let paths = Polygon.toClipperPaths(polys);
        ClipperLib.JS.ScaleUpPaths(paths, SCALE);
        
        let co = new ClipperLib.ClipperOffset(miterLimit, arcTolerance);
        co.AddPaths(paths, ClipperLib.JoinType.jtSquare, ClipperLib.EndType.etClosedPolygon);
        let result = [];
        co.Execute(result, distance * SCALE);

        ClipperLib.JS.ScaleDownPaths(result, SCALE);
        return Polygon.fromClipperPaths(result);
    }
}
