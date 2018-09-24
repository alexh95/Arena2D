import {V3} from './Math.js';

export class Entity {

	constructor(type, position, size, radius, center) {
		this.type = type;
		this.position = position;
		this.velocity = new V3(0., 0., 0.);
		this.size = size;
		this.radius = radius;
		this.center = center;
	}

}

export const entityTypeToImage = [];

export const entities = [];

export const EntityTypes = Object.freeze({
	PLAYER: 0,
	WALL: 1,
	SMALL_CIRCLE: 2,
	SMALL_ROUNDED_SQUARE: 3,
	MEDIUM_ROUNDED_SQUARE: 4,
	LARGE_ROUNDED_SQUARE: 5
});
