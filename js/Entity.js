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
		this.elapsed = 0.;
		this.period = 0.25;
	}

}

export class Entity {

	constructor(type, position, center, spritesheetModel, collisionModel = null) {
		this.type = type;
		this.position = position;
		this.velocity = new V3();
		this.center = center;
		this.spritesheetModel = spritesheetModel;
		this.collides = !!collisionModel;
		this.collisionModel = collisionModel;
	}

}

export const entityTypeToImage = [];

export const entities = [];

const entityTypeNames = [
	'SPRITES',
	'PLAYER',
	'WALL',
	'HORIZONTAL_WALL',
	'VERTICAL_WALL',
	'SPRITE_SHEETS',
	'TEST_SPRITESHEET'
	];
const entityTypes = {};
entityTypeNames.forEach((entityTypeName, index) => {
	entityTypes[entityTypeName] = index;
});

export const EntityTypes = Object.freeze(entityTypes);
