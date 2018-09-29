import {V3} from './Math.js';

export class CollisionModel {

	constructor(center, box, radius = 0.) {
		this.center = center;
		this.box = box;
		this.radius = radius;
	}

}

export class SpritesheetModel {

	constructor(size, index = new V3()) {
		this.size = size;
		this.index = index;
	}

}

export class Entity {

	constructor(type, position, center, spritesheetModel, collisionModel = null) {
		this.type = type;
		this.position = position;
		this.velocity = new V3(0., 0., 0.);
		this.center = center;
		this.spritesheetModel = spritesheetModel;
		this.collides = !!collisionModel;
		this.collisionModel = collisionModel;
	}

}

export const entityTypeToImage = [];

export const entities = [];

export const EntityTypes = Object.freeze({
	SPRITES: 0,
	PLAYER: 1,
	WALL: 2,
	SPRITE_SHEETS: 3,
	TEST_SPRITESHEET: 4
});
