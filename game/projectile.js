class Projectile extends Entity {
    constructor(params) {
        params = Object.assign({
            friction: 0,
            elasticity: 0,
            life: Infinity,
            flocks: false
        }, params);
        super(params);
        this.friction = params.friction;
        this.elasticity = params.elasticity;
        this.life = params.life;
        this.oldPos = this.position.clone();
        this.oldVel = this.velocity.clone();
    }

    draw(timescale) {
    	this.gfx.position.x = this.position.x;
        this.gfx.position.y = this.position.y;
        if (!this.gfxDirty)
            return;

        this.gfxDirty = false;
        var dx = this.oldPos.sub(this.position);
        this.gfx.clear();
        this.gfx.lineStyle(1, this.color, 1);
        this.gfx.moveTo(0,0);
        this.gfx.lineTo(dx.x, dx.y);
    }

    frame(timescale) {
        this.oldPos = this.position.clone();
        
        super.frame(timescale);

        //apply friction
        this.velocity = this.velocity.mult(1-this.friction*timescale);
        
        //destroy projectile when it stops or expires
        if (this.velocity.isZero())
            this.world.removeEntity(this);
        if (this.age > this.life)
            this.world.removeEntity(this);

        //only redraw when speed changes significantly
        //this tolerance can be adjusted and significantly improves performance.
        if (this.velocity.sub(this.oldVel).len() > 0.5) {
            this.gfxDirty = true;
            this.oldVel = this.velocity.clone();
        }
    }

    move(dx) {
        var collisions = this.getAllCollisions(dx);

        //find nearest collision
        var nearest = null;
        var nearestDist = 0;
        collisions.filter(c => c.type === Collision.SEGMENT).forEach(collision => {
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

    getMotionSegment(dx) {
    	//calculate a segment representing the path of this object
        let radius = dx.unit().mult(this.radius);
        let pointA = this.position.add(dx).add(radius);
        let pointB = this.position.sub(radius);
        let selfSeg = new Segment(pointA, pointB);
        return selfSeg;
    }

    getObstacleCollisions(dx) {
    	let selfSeg = this.getMotionSegment(dx);
    	let collisions = [];
        let segments = this.world.segSpace.getNearby(this, dx.len());
        segments.forEach(segment => {
            let point = Util.geom.segSegIntersect(selfSeg, segment);
            if (point)
                collisions.push(new Collision({
                    self: this,
                    type: Collision.SEGMENT,
                    object: segment,
                    point: point
                }));
        });
        return collisions;
    }

    getEntityCollisions(dx) {
    	let selfSeg = this.getMotionSegment(dx);
    	return this.world.entities
    		.filter(entity => !(entity instanceof Projectile))
    		.filter(entity => selfSeg.distanceFrom(entity.position) <= entity.radius)
    		.map(entity => new Collision({
    			self: this,
    			type: Collision.ENTITY,
    			object: entity,
    			point: selfSeg.nearestPoint(entity.position)
    		}));
    }
    
    getAllCollisions(dx) {
        //find any collisions
        let cObstacle = this.getObstacleCollisions(dx);
        let cEntity = this.getEntityCollisions(dx);
        return [...cObstacle, ...cEntity];
    }

    handleCollision(others) {
        super.handleCollision(others);
        
        var other = others[0];
        if (!other)
        	return;

        if (other.type === Collision.SEGMENT) {
            this.velocity = this.velocity.reflectOver(other.object.b.sub(other.object.a))
                .mult(this.elasticity);
        }
        else if (other.type === Collision.ENTITY) {
        	this.handleEntityCollision(other.object, other);
        }
    }

    handleEntityCollision(entity, coll) {}

    serialize() {
        let data = super.serialize.apply(this, arguments);
        return Object.assign(data, {
            _constructor: "Projectile",
            friction: this.friction,
            elasticity: this.elasticity,
            life: this.life
        });
    }
}
Core.classMap.Projectile = Projectile;