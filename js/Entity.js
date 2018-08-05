import {V3} from './Math.js';

export class Entity {

	constructor(type, position, size, center) {
		this.type = type;
		this.position = position;
		this.velocity = new V3(0., 0., 0.);
		this.size = size;
		this.center = center;
	}

}

export const entityTypeToImage = [];

export const entities = [];

export const EntityTypes = Object.freeze({
	PLAYER: 0,
	WALL: 1,
	BALL: 2
});
