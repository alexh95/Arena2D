export class Entity {

	constructor(type, p, center) {
		this.type = type;
		this.p = p;
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
