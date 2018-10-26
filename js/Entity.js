import {V3} from './Math.js';

export class CollisionModel {

	constructor(center, mass, box, radius) {
		this.center = center;
		this.mass = mass;
		this.box = box;
		this.radius = radius;
	}

}

export class CollisionModelData {

	constructor(center, mass, boxScale, radiusScale = 0.) {
		this.center = center;
		this.mass = mass;
		this.boxScale = boxScale;
		this.radiusScale = radiusScale;
	}

	buildCollisionModel(imageSize) {
		imageSize.multiplyEquals(this.boxScale);
		const minDimension = Math.min(imageSize.x, imageSize.y);
		const radius = 0.5 * this.radiusScale * minDimension;
		const box = imageSize.subtract(new V3(1., 1.).scale(2. * radius));
		return new CollisionModel(this.center, this.mass, box, radius);
	}

}

export class RepeatedModel {

	constructor(direction, count, sizeScale = new V3(1., 1.)) {
		this.direction = direction;
		this.count = count;
		this.sizeScale = sizeScale;
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

	constructor(type, position, center, collisionModel, repeatedModel, spritesheetModel) {
		this.index = null;
		this.type = type;
		this.position = position;
		this.velocity = new V3();
		this.center = center;

		this.collisionModel = collisionModel;
		this.repeatedModel = repeatedModel;
		this.spritesheetModel = spritesheetModel;
	}

}

export const entityTypeToImage = [];

export const entities = [];

export const removedEntityIndexes = [];

const entityTypeNames = [
	'SPRITES',
	'PLAYER',
	'WALL_HORIZONTAL',
	'WALL_VERTICAL',
	'WALL_BOTTOM_LEFT_CORNER',
	'WALL_BOTTOM_RIGHT_CORNER',
	'WALL_TOP_LEFT_CORNER',
	'WALL_TOP_RIGHT_CORNER',
	'WALL_T_CORNER',
	'BOX',
	'BARREL',
	'PROJECTILE',
	'SPRITE_SHEETS',
	'TEST_SPRITESHEET',
	'SPRITESHEET_PLAYER',
	'SPRITESHEET_MONSTER'
	];
const entityTypes = {};
entityTypeNames.forEach((entityTypeName, index) => {
	entityTypes[entityTypeName] = index;
});

export const EntityTypes = Object.freeze(entityTypes);
