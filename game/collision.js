/**
 * Represents a collision with another object.
 * The parameters of the colliding object are implicit.
 * Properties:
 * self: refers to the colliding object
 * type: represents the type of object collided with
 * object: represents the actual object collided, or null if this is unknown
 * point: represents an actual or approximate point of collision, or null
 */
class Collision {
	constructor(params) {
		params = Object.assign({
			self: null,
			type: Collision.NONE,
			object: null,
			point: null
		}, params);
		this.self = params.self;
		this.type = params.type;
		this.object = params.object;
		this.point = params.point;
	}
}
Collision.NONE = 0;
Collision.POINT = 1;
Collision.SEGMENT = 2;