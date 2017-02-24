class Caster extends Emitter {
	constructor(params) {
		if (!params.hasOwnProperty("world"))
			throw new Error("Must pass a World.");

		super(params);
		params = Object.assign(params, {

		});

		this.world = params.world;
	}

	/**
	 * Performs initialization.
	 * Must reinitialize if geometry changes.
	 */
	initialize() {

	}

	/**
	 * Performs preprocessing for a cast.
	 * Geometry cannot change after the preprocess.
	 */
	preprocess(viewpoint) {

	}

	/**
	 * Computes visible area
	 * @return a list of Polygons representing visibility from viewpoint
	 */
	cast(viewpoint, includeWholePolygons) {
		let points = [
			new Vector(viewpoint.x-64, viewpoint.y-64),
			new Vector(viewpoint.x+64, viewpoint.y-64),
			new Vector(viewpoint.x+64, viewpoint.y+64),
			new Vector(viewpoint.x-64, viewpoint.y+64)
		];
		return [new Polygon(points)];
	}
}