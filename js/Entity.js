import {V3} from './Math.js';

export class CollisionModel {

	constructor(center, boxScale, radiusScale = 0.) {
		this.center = center;
		this.boxScale = boxScale;
		this.box = new V3();
		this.radiusScale = radiusScale;
		this.radius = 0;
	}

}

export class RepeatedModel {

	constructor(direction, count) {
		this.direction = direction;
		this.count = count;
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

	constructor(type, position, center, collisionModel, repeatedModel, spritesheetModel, imageStore, pixelsToMeters) {
		this.type = type;
		this.position = position;
		this.velocity = new V3();
		this.center = center;

		this.collisionModel = collisionModel;
		if (this.collisionModel) {
			const image = imageStore.images[entityTypeToImage[type]];
			const size = new V3(image.width, image.height).scale(pixelsToMeters);
			if (spritesheetModel) {
				size.divideEquals(spritesheetModel.size);
			}
			size.multiplyEquals(this.collisionModel.boxScale);
			const minDimension = Math.min(size.x, size.y);
			this.collisionModel.radius = 0.5 * this.collisionModel.radiusScale * minDimension;
			this.collisionModel.box.addEquals(size.subtract(new V3(1., 1.).scale(2. * this.collisionModel.radius)));
		}
		this.repeatedModel = repeatedModel;
		this.spritesheetModel = spritesheetModel;
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
