class Projectile extends Entity {
    frame(timescale) {
        super.frame(timescale);
        if (this.age > 1)
            this.world.removeEntity(this);
    }

    move(dx) {
        var collisions = this.getAllCollisions(dx);

        //find nearest collision
        var nearest = null;
        var nearestDist = 0;
        collisions.forEach(collision => {
            if (collision.point === null)
                return;
            var dist = collision.point.sub(this.position).len();
            if (nearest === null || dist < nearestDist) {
                nearest = collision.point;
                nearestDist = dist;
            }
        });

        //if there is a collision, limit movement
        if (nearest === null)
            this.position = this.position.add(dx);
        else {
            dx = dx.unit().mult(nearest.sub(this.position).len() - this.radius*2);
            this.position = this.position.add(dx);
            this.emit("collision", [nearest]);
        }
    }

    /**
     * TODO: Issue: this now returns points.
     * The collision logic used in Entity no longer works correctly, as it
     * expects segments. This is OK for Projectiles, as they remove themselves
     * from the world upon collision. However, it may create future problems.
     * Possible solution: create a Collision class that contains both the
     * collided thing (e.g. the segment) and the point of collision, if known.
     */
    getAllCollisions(dx) {
        //calculate a segment representing the path of this object
        var radius = dx.unit().mult(this.radius);
        var pointA = this.position.add(dx).add(radius);
        var pointB = this.position.sub(radius);

        //find any collisions
        var collisions = [];
        this.world.obstacles.forEach(object => {
            if (object instanceof Obstacle) {
                object.getSegments().forEach(segment => {
                    var point = Util.geom.segSegIntersect(pointA, pointB, segment[0], segment[1]);
                    if (point)
                        collisions.push(new Collision({
                            self: this,
                            type: Collision.SEGMENT,
                            object: segment,
                            point: point
                        }));
                });
            }
        });
        return collisions;
    }

    handleCollision(other) {
        super.handleCollision(other);
        this.velocity.x = 0;
        this.velocity.y = 0;
        // this.world.removeEntity(this);
    }
}
