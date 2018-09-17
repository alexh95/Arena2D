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
	BALL: 2,
	ELLIPSE_2_1: 3,
	ELLIPSE_4_1: 4,
	ELLIPSE_1_2: 5,
	ELLIPSE_1_4: 6
});
