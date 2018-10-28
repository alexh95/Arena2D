import {V3} from './Math.js';

export class CollisionModel {

	constructor(collidesWhenMoving, cornerMin, cornerMax, innerCornerMin, innerCornerMax, radius, mass) {
		this.collidesWhenMoving = collidesWhenMoving;
		this.cornerMin = cornerMin;
		this.cornerMax = cornerMax;
		this.innerCornerMin = innerCornerMin;
		this.innerCornerMax = innerCornerMax;
		this.radius = radius;
		this.mass = mass;
	}

}

export class CollisionModelData {

	constructor(collidesWhenMoving, center, boxScale, radiusScale, mass) {
		this.collidesWhenMoving = collidesWhenMoving;
		this.center = center;
		this.boxScale = boxScale;
		this.radiusScale = radiusScale;
		this.mass = mass;
	}

	buildCollisionModel(size) {
		size.multiplyEquals(this.boxScale);
		const cornerMin = size.scale(-0.5);
		cornerMin.subtractEquals(cornerMin.multiply(this.center));
		const cornerMax = size.scale(0.5);
		cornerMax.addEquals(cornerMax.multiply(this.center));
		const radius = 0.5 * this.radiusScale * Math.min(size.x, size.y);
		const innerCornerMin = cornerMin.add(new V3(radius, radius));
		const innerCornerMax = cornerMax.subtract(new V3(radius, radius));
		return new CollisionModel(this.collidesWhenMoving, cornerMin, cornerMax, innerCornerMin, innerCornerMax, radius, this.mass);
	}

}

export class RepeatedModel {

	constructor(direction, count, sizeScale = new V3(1.0, 1.0)) {
		this.direction = direction;
		this.count = count;
		this.sizeScale = sizeScale;
	}

}

export class SpritesheetModel {

	constructor(size, period, index = new V3()) {
		this.size = size;
		this.index = index;
		this.elapsed = 0.;
		this.period = period;
	}

}

export class Entity {

	constructor(type, position, center, size, rotation = 0.0) {
		this.index = null;
		this.type = type;
		this.position = position;
		this.velocity = new V3();
		this.center = center;
		this.size = size;
		this.rotation = rotation;

		this.collisionModel = null;
		this.repeatedModel = null;
		this.spritesheetModel = null;
		this.combatModel = null;
		this.projectileModel = null;
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
	'SPRITESHEET_MONSTER',
	'SPRITESHEET_MELEE_ATTACK'
	];
const entityTypes = {};
entityTypeNames.forEach((entityTypeName, index) => {
	entityTypes[entityTypeName] = index;
});

export const EntityTypes = Object.freeze(entityTypes);
