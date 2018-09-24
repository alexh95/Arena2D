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
	SQUARE_SMALL: 1,
	SQUARE_MEDIUM: 2,
	SQUARE_LARGE: 3,
	CIRCLE_SMALL: 4,
	CIRCLE_MEDIUM: 5,
	CIRCLE_LARGE: 6,
	ROUNDED_SQUARE_SMALL: 7,
	ROUNDED_SQUARE_MEDIUM: 8,
	ROUNDED_SQUARE_LARGE: 9
});
