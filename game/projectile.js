class Projectile extends Entity {
    constructor(params) {
        super(params);
        params = Object.assign({
            friction: 0,
            elasticity: 0,
            life: Infinity
        }, params);
        this.friction = params.friction;
        this.elasticity = params.elasticity;
        this.life = params.life;
    }

    frame(timescale) {
        super.frame(timescale);
        this.velocity = this.velocity.mult(1-this.friction);
        if (this.velocity.isZero())
            this.world.removeEntity(this);
        if (this.age > this.life)
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
                nearest = collision;
                nearestDist = dist;
            }
        });

        //if there is a collision, limit movement
        if (nearest === null)
            this.position = this.position.add(dx);
        else {
            dx = dx.unit().mult(nearest.point.sub(this.position).len() - this.radius*2);
            this.position = this.position.add(dx);
            this.emit("collision", [nearest]);
        }
    }
    
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

    handleCollision(others) {
        super.handleCollision(others);
        
        var other = others[0];
        if (other && other.type === Collision.SEGMENT) {
            this.velocity = this.velocity.reflectOver(other.object[1].sub(other.object[0]))
                .mult(this.elasticity);
        }
    }
}
