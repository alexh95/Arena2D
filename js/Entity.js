import {V3} from './Math.js';

export class Entity {

	constructor(type, position, size, center, collisionBox, collisionRadius, collisionCenter) {
		this.type = type;
		this.position = position;
		this.velocity = new V3(0., 0., 0.);

		this.size = size;
		this.center = center;

		this.collides = true;
		this.collisionBox = collisionBox;
		this.collisionRadius = collisionRadius;
		this.collisionCenter = collisionCenter;
	}

}

export const entityTypeToImage = [];

export const entities = [];

export const EntityTypes = Object.freeze({
	PLAYER: 0,
	WALL: 1
});
