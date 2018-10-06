import Renderer from './Renderer.js';
import ImageStore from './ImageStore.js';
import {V3, displayText} from './Math.js';
import {CollisionModelData, CollisionModel, Entity, EntityTypes, entities, entityTypeToImage, RepeatedModel, SpritesheetModel} from './Entity.js';
import {Keys, nameVersionDisplay} from './Constants.js';

const renderer = new Renderer();
const imageStore = new ImageStore();

const tileSizeMeters = 1.;
const tileSizePixels = 16;
const metersToPixels = tileSizePixels / tileSizeMeters;
const pixelsToMeters = tileSizeMeters / tileSizePixels;
let zoomLevel = 1.;

const keys = new Array(256).fill(false);
const mouse = {
	position: new V3(),
	left: false,
	middle: false,
	right: false
};

const grassTileFrom = new V3(-32, -32);
const grassTileTo = new V3(31, 31);
let grassTile = null;

let player = null;
let box1 = null;
let barrel1 = null;

let lastP = false;
let lastG = false;
let debugInfoOn = false;
let debugGridOn = false;

export default function start() {
	console.log(nameVersionDisplay);

	window.addEventListener('resize', (event) => renderer.setSize());
	window.addEventListener('keydown', (event) => {
		keys[event.keyCode] = true;
		if (event.keyCode == 9) {
			event.preventDefault();
		}
	});
	window.addEventListener('keyup', (event) => {
		keys[event.keyCode] = false;
		if (event.keyCode == 18) {
			event.preventDefault();
		}
	});
	window.addEventListener('contextmenu', (event) => {
		event.preventDefault();
	});
	window.addEventListener('mousedown', (event) => {
		// console.log(event);
		switch (event.which) {
			case 1: {
				mouse.left = true;
			} break;
			case 2: {
				mouse.middle = true;
			} break;
			case 3: {
				mouse.right = true;
			} break;
		}
	});
	window.addEventListener('mouseup', (event) => {
		// console.log(event);
		switch (event.which) {
			case 1: {
				mouse.left = false;
			} break;
			case 2: {
				mouse.middle = false;
			} break;
			case 3: {
				mouse.right = false;
			} break;
		}
	});
	window.addEventListener('mousewheel', (event) => {
		// console.log(event);
		const zoomDelta = event.deltaY / -100;
		zoomLevel += zoomDelta;
		if (zoomLevel < 1) {
			zoomLevel = 1;
		} else if (zoomLevel > 8) {
			zoomLevel = 8;
		}
	});
	window.addEventListener('mousemove', (event) => {
		const screenPosition = new V3(event.offsetX, event.offsetY);
		const canvasSize = renderer.size;
		const worldPosition = new V3(screenPosition.x, canvasSize.y - screenPosition.y).subtract(canvasSize.scale(0.5)).scale(pixelsToMeters);
		mouse.position = worldPosition.scale(1. / zoomLevel);
	});

	entityTypeToImage[EntityTypes.PLAYER] = imageStore.loadImage('res/player.png');
	entityTypeToImage[EntityTypes.WALL_HORIZONTAL] = imageStore.loadImage('res/wall_horizontal.png');
	entityTypeToImage[EntityTypes.WALL_VERTICAL] = imageStore.loadImage('res/wall_vertical.png');
	entityTypeToImage[EntityTypes.WALL_BOTTOM_LEFT_CORNER] = imageStore.loadImage('res/wall_bottom_left_corner.png');
	entityTypeToImage[EntityTypes.WALL_BOTTOM_RIGHT_CORNER] = imageStore.loadImage('res/wall_bottom_right_corner.png');
	entityTypeToImage[EntityTypes.WALL_TOP_LEFT_CORNER] = imageStore.loadImage('res/wall_top_left_corner.png');
	entityTypeToImage[EntityTypes.WALL_TOP_RIGHT_CORNER] = imageStore.loadImage('res/wall_top_right_corner.png');
	entityTypeToImage[EntityTypes.WALL_T_CORNER] = imageStore.loadImage('res/wall_t_corner.png');
	entityTypeToImage[EntityTypes.BOX] = imageStore.loadImage('res/box.png');
	entityTypeToImage[EntityTypes.BARREL] = imageStore.loadImage('res/barrel.png');
	entityTypeToImage[EntityTypes.TEST_SPRITESHEET] = imageStore.loadImage('res/spritesheet_template.png');
	entityTypeToImage[EntityTypes.SPRITESHEET_PLAYER] = imageStore.loadImage('res/spritesheet_player.png');
	grassTile = imageStore.loadImage('res/grass_tile.png');

	startLoop();
}

function createEntity(type, position, center, collisionModelData, repeatedModel, spritesheetModel) {
	const image = imageStore.images[entityTypeToImage[type]];
	const imageSize = new V3(image.width, image.height);
	if (spritesheetModel) {
		imageSize.divideEquals(spritesheetModel.size);
	}
	imageSize.scaleEquals(pixelsToMeters);
	const collisionModel = collisionModelData.buildCollisionModel(imageSize);
	return new Entity(type, position, center, collisionModel, repeatedModel, spritesheetModel);
}

function createSimpleEntity(type, position, center, collisionModelData) {
	return createEntity(type, position, center, collisionModelData, null, null);
}

function createSpreadsheetEntity(type, position, center, collisionModelData, spritesheetModel) {
	return createEntity(type, position, center, collisionModelData, null, spritesheetModel);
}

function createRepeatedEntity(type, position, center, collisionModelData, repeatedModel) {
	return createEntity(type, position, center, collisionModelData, repeatedModel, null);
}

function createHorizontalWall(position, direction = null, count = null) {
	const repeatedModel = (count) ? new RepeatedModel(direction, count, new V3(1., 0.5)) : null;
	return createRepeatedEntity(EntityTypes.WALL_HORIZONTAL, position, new V3(0.5, 0.25), new CollisionModelData(new V3(0.5, 0.5), 0., new V3(1., 0.25)), repeatedModel);
}

function createVerticalWall(position, direction = null, count = null) {
	const repeatedModel = (count) ? new RepeatedModel(direction, count, new V3(1., 0.5)) : null;
	return createRepeatedEntity(EntityTypes.WALL_VERTICAL, position, new V3(0.5, 0.25), new CollisionModelData(new V3(0.5, 0.5), 0., new V3(0.5, 0.5)), repeatedModel);
}

function createTopLeftCornerlWall(position) {
	return createSimpleEntity(EntityTypes.WALL_TOP_LEFT_CORNER, position, new V3(0.5, 0.25), new CollisionModelData(new V3(2. / 3., 1. / 3.), 0., new V3(0.75, 0.375)));
}

function createTopRightCornerlWall(position) {
	return createSimpleEntity(EntityTypes.WALL_TOP_RIGHT_CORNER, position, new V3(0.5, 0.25), new CollisionModelData(new V3(1. / 3., 1. / 3.), 0., new V3(0.75, 0.375)));
}

function createBottomLeftCornerlWall(position) {
	return createSimpleEntity(EntityTypes.WALL_BOTTOM_LEFT_CORNER, position, new V3(0.5, 0.25), new CollisionModelData(new V3(2. / 3., 2. / 3.), 0., new V3(0.75, 0.375)));
}

function createBottomRightCornerlWall(position) {
	return createSimpleEntity(EntityTypes.WALL_BOTTOM_RIGHT_CORNER, position, new V3(0.5, 0.25), new CollisionModelData(new V3(1. / 3., 2. / 3.), 0., new V3(0.75, 0.375)));
}

function createTCornerWall(position) {
	return createSimpleEntity(EntityTypes.WALL_T_CORNER, position, new V3(0.5, 0.25), new CollisionModelData(new V3(0.5, 0.5), 0., new V3(1., 0.5)));
}

function createBarrel(position) {
	return createSimpleEntity(EntityTypes.BARREL, position, new V3(0.5, 0.25), new CollisionModelData(new V3(0.5, 0.5), 2., new V3(14. / 16., 14. / 32.), 1));
}

function createBox(position) {
	return createSimpleEntity(EntityTypes.BOX, position, new V3(0.5, 0.25), new CollisionModelData(new V3(0.5, 0.5), 2., new V3(1., 0.5)));
}

function startLoop() {
	if (imageStore.isLoadingFinished()) {
		const playerCharacter = createSimpleEntity(EntityTypes.PLAYER, new V3(0., 0.), new V3(0.5, 0.25), new CollisionModelData(new V3(0.5, 0.5), 1., new V3(1., 0.5), 1));

		const wallN = createHorizontalWall(new V3(-30.5, 31.5), new V3(1., 0.), 62);
		const wallS = createHorizontalWall(new V3(-30.5, -31.5), new V3(1., 0.), 62);
		const wallE = createVerticalWall(new V3(31.5, 30.5), new V3(0., -1.), 62);
		const wallW = createVerticalWall(new V3(-31.5, 30.5), new V3(0., -1.), 62);
		const wallNWC = createTopLeftCornerlWall(new V3(-31.5, 31.5));
		const wallNEC = createTopRightCornerlWall(new V3(31.5, 31.5));
		const wallSWC = createBottomLeftCornerlWall( new V3(-31.5, -31.5));
		const wallSEC = createBottomRightCornerlWall(new V3(31.5, -31.5));

		const wallLN = createHorizontalWall(new V3(-27.5, 28.5), new V3(1., 0.), 22);
		const wallLS1 = createHorizontalWall(new V3(-6.5, 13.5), new V3(-1., 0.), 8);
		const wallLS2 = createHorizontalWall(new V3(-15.5, 4.5), new V3(-1., 0.), 5);
		const wallLS3 = createHorizontalWall(new V3(-27.5, 4.5), new V3(1., 0.), 5);
		const wallLE1 = createVerticalWall(new V3(-5.5, 27.5), new V3(0., -1.), 14);
		const wallLE2 = createVerticalWall(new V3(-14.5, 12.5), new V3(0., -1.), 8);
		const wallLW = createVerticalWall(new V3(-28.5, 27.5), new V3(0., -1.), 23);
		const wallLNWC1 = createTopLeftCornerlWall(new V3(-28.5, 28.5));
		const wallLNWC2 = createTopLeftCornerlWall(new V3(-14.5, 13.5));
		const wallLNEC = createTopRightCornerlWall(new V3(-5.5, 28.5));
		const wallLSWC = createBottomLeftCornerlWall(new V3(-28.5, 4.5));
		const wallLSEC1 = createBottomRightCornerlWall(new V3(-5.5, 13.5));
		const wallLSEC2 = createBottomRightCornerlWall(new V3(-14.5, 4.5));

		const wallRN = createHorizontalWall(new V3(27.5, 28.5), new V3(-1., 0.), 22);
		const wallRS1 = createHorizontalWall(new V3(6.5, 13.5), new V3(1., 0.), 8);
		const wallRS2 = createHorizontalWall(new V3(15.5, 4.5), new V3(1., 0.), 5);
		const wallRS3 = createHorizontalWall(new V3(27.5, 4.5), new V3(-1., 0.), 5);
		const wallRE = createVerticalWall(new V3(28.5, 27.5), new V3(0., -1.), 23);
		const wallRW1 = createVerticalWall(new V3(5.5, 27.5), new V3(0., -1.), 14);
		const wallRW2 = createVerticalWall(new V3(14.5, 12.5), new V3(0., -1.), 8);
		const wallRNWC = createTopLeftCornerlWall(new V3(5.5, 28.5));
		const wallRNEC1 = createTopRightCornerlWall(new V3(28.5, 28.5));
		const wallRNEC2 = createTopRightCornerlWall(new V3(14.5, 13.5));
		const wallRSWC1 = createBottomLeftCornerlWall(new V3(5.5, 13.5));
		const wallRSWC2 = createBottomLeftCornerlWall(new V3(14.5, 4.5));
		const wallRSEC = createBottomRightCornerlWall(new V3(28.5, 4.5));

		const wallT1 = createHorizontalWall(new V3(-12.5, -5.5));
		const wallT2 = createVerticalWall(new V3(-8.5, -5.5));
		const wallT3 = createTopLeftCornerlWall(new V3(-4.5, -5.5));
		const wallT4 = createTopRightCornerlWall(new V3(-0.5, -5.5));
		const wallT5 = createBottomLeftCornerlWall(new V3(3.5, -5.5));
		const wallT6 = createBottomRightCornerlWall(new V3(7.5, -5.5));
		const wallT7 = createTCornerWall(new V3(11.5, -5.5));

		const playerSpritesheet = createSpreadsheetEntity(EntityTypes.SPRITESHEET_PLAYER, new V3(0., 0.), new V3(0.5, 0.25), new CollisionModelData(new V3(0.5, 0.5), 1., new V3(0.5, 0.25), 1.), new SpritesheetModel(new V3(4, 4, 1)));

		const box = createBox(new V3(5.5, 0.5));
		const barrel = createBarrel(new V3(-5.5, 0.5));

		player = playerSpritesheet;
		box1 = box;
		barrel1 = barrel;
		
		entities.push(wallN, wallS, wallE, wallW, wallNWC, wallNEC, wallSWC, wallSEC);

		entities.push(wallLN, wallLW, wallLE1, wallLS1, wallLE2, wallLS2, wallLS3, wallLNWC1, wallLNWC2, wallLNEC, wallLSWC, wallLSEC1, wallLSEC2);

		entities.push(wallRN, wallRE, wallRW1, wallRS1, wallRW2, wallRS2, wallRS3, wallRNWC, wallRNEC1, wallRNEC2, wallRSWC1, wallRSWC2, wallRSEC);

		entities.push(wallT1);
		entities.push(wallT2);
		entities.push(wallT3);
		entities.push(wallT4);
		entities.push(wallT5);
		entities.push(wallT6);
		entities.push(wallT7);

		entities.push(player);
		entities.push(box1);
		entities.push(barrel1);

		window.requestAnimationFrame(loop);
	} else {
		window.requestAnimationFrame(startLoop);
	}
}

let msElapsedOld = 0;
const msDeltas = [];
const msDeltaMax = 30;
let fps = 0;

function loop(msElapsed) {
	// TODO(alex): test with request frame as the last instruction
	window.requestAnimationFrame(loop);

	const msDelta = msElapsed - msElapsedOld;
	if (msDeltas.length >= msDeltaMax) {
		const sum = msDeltas.reduce((a, b) => a + b);
		fps = 1000. / (sum / msDeltaMax);
		msDeltas.length = 0;
	}
	msDeltas.push(msDelta);
	msElapsedOld = msElapsed;
	const dt = msDelta / 1000;

	update(dt);

	draw();
}

function update(dt) {
	if (keys[Keys.P] && !lastP) {
		debugInfoOn = !debugInfoOn;
	}
	lastP = keys[Keys.P];

	if (keys[Keys.G] && !lastG) {
		debugGridOn = !debugGridOn;
	}
	lastG = keys[Keys.G];

	let direction;
	if (mouse.right) {
		direction = mouse.position.clone();
	} else {
		direction = new V3();
	}

	if (keys[Keys.A]) {
		direction.x -= 1.;
	}
	if (keys[Keys.D]) {
		direction.x += 1.;
	}
	if (keys[Keys.W]) {
		direction.y += 1.;
	}
	if (keys[Keys.S]) {
		direction.y -= 1.;
	}

	direction.normalizeEquals();

	const absDirX = Math.abs(direction.x);
	const absDirY = Math.abs(direction.y);

	if (player.spritesheetModel) {
		if (direction.x > 0 && absDirX > absDirY) {
			player.spritesheetModel.index.y = 0;
		} else if (direction.x < 0 && absDirX > absDirY) {
			player.spritesheetModel.index.y = 2;
		} else if (direction.y > 0 && absDirY > absDirX) {
			player.spritesheetModel.index.y = 1;
		} else if (direction.y < 0 && absDirY > absDirX) {
			player.spritesheetModel.index.y = 3;
		}

		if (direction.length()) {
			player.spritesheetModel.elapsed += dt;
			if (player.spritesheetModel.elapsed >= player.spritesheetModel.period) {
				player.spritesheetModel.elapsed -= player.spritesheetModel.period;
				if(++player.spritesheetModel.index.x >= player.spritesheetModel.size.x) {
					player.spritesheetModel.index.x = 0;
				}
			}
		} else {
			player.spritesheetModel.index.x = 0;
		}
	}

	moveEntity(dt, player, mouse.left ? 500. : 80., direction);
	renderer.cameraPosition = player.position.clone();

	const squareDirection = new V3(); //player.position.add(player.velocity.scale(dt)).subtract(box1.position.add(box1.velocity.scale(dt))).normalize();
	moveEntity(dt, box1, 25., squareDirection);

	moveEntity(dt, barrel1, 0., new V3());
}

let insideOld = false;

function moveEntity(dt, entity, speed, direction) {
	let insideNew = false;

	const acceleration = direction.scale(speed).subtract(entity.velocity.scale(8.));
	let deltaPosition = entity.velocity.scale(dt).add(acceleration.scale(0.5 * dt * dt));
	entity.velocity = entity.velocity.add(acceleration.scale(dt));

	for (let collisionIndex = 0; collisionIndex < 4; ++collisionIndex) {
		let hit = false;
		let hitEntity = null;
		let tMin = 1.;
		let wallNormal = new V3();

		entities.forEach((e, index) => {
			if (e != entity && e.collisionModel && entity.collisionModel) {
				const relativePosition = entity.position.subtract(e.position);
				const box = entity.collisionModel.box.add(e.collisionModel.box);
				const nominalCenter = new V3(0.5, 0.5);
				const offset = entity.collisionModel.center.subtract(nominalCenter).multiply(entity.collisionModel.box)
					.add(e.collisionModel.center.subtract(nominalCenter).multiply(e.collisionModel.box));
				const cornerMin = box.scale(-0.5).add(offset);
				const cornerMax = box.scale(0.5).add(offset);
				if (e.repeatedModel) {
					if (e.repeatedModel.direction.x < 0.) {
						cornerMin.x -= (e.repeatedModel.count - 1) * e.collisionModel.box.x;
					} else if (e.repeatedModel.direction.x > 0.) {
						cornerMax.x += (e.repeatedModel.count - 1) * e.collisionModel.box.x;
					}
					if (e.repeatedModel.direction.y < 0.) {
						cornerMin.y -= (e.repeatedModel.count - 1) * e.collisionModel.box.y;
					} else if (e.repeatedModel.direction.y > 0.) {
						cornerMax.y += (e.repeatedModel.count - 1) * e.collisionModel.box.y;
					}
				}
				const radius = e.collisionModel.radius + entity.collisionModel.radius;

				if (cornerMin.x) {
					const epsilon = radius && 0.001 || 0.;
					// Left wall
					const collisionLeft = collideWall(relativePosition.x, relativePosition.y, deltaPosition.x, deltaPosition.y, cornerMin.x - radius + epsilon, cornerMin.y, cornerMax.y, tMin);
					if (collisionLeft.hit && tMin > collisionLeft.t) {
						hit = true;
						tMin = collisionLeft.t;
						wallNormal = new V3(-1., 0.);
						// console.log(collisionIndex, 'hit left');
					}
					// Right wall
					// console.log('r', collisionIndex, relativePosition, relativePosition.add(deltaPosition), cornerMax.x + radius, cornerMin.y, cornerMax.y);
					const collisionRight = collideWall(relativePosition.x, relativePosition.y, deltaPosition.x, deltaPosition.y, cornerMax.x + radius - epsilon, cornerMin.y, cornerMax.y, tMin);
					if (collisionRight.hit && tMin > collisionRight.t) {
						hit = true;
						tMin = collisionRight.t;
						wallNormal = new V3(1., 0.);
						// console.log(collisionIndex, 'hit right');
					}
					// Bottom wall
					const collisionBottom = collideWall(relativePosition.y, relativePosition.x, deltaPosition.y, deltaPosition.x, cornerMin.y - radius + epsilon, cornerMin.x, cornerMax.x, tMin);
					if (collisionBottom.hit && tMin > collisionBottom.t) {
						hit = true;
						tMin = collisionBottom.t;
						wallNormal = new V3(0., -1.);
						// console.log(collisionIndex, 'hit bottom');
					}
					// Top wall
					const collisionTop = collideWall(relativePosition.y, relativePosition.x, deltaPosition.y, deltaPosition.x, cornerMax.y + radius - epsilon, cornerMin.x, cornerMax.x, tMin);
					if (collisionTop.hit && tMin > collisionTop.t) {
						hit = true;
						tMin = collisionTop.t;
						wallNormal = new V3(0., 1.);
						// console.log(collisionIndex, 'hit top');
					}
				}
				if (radius > 0) {
					if (cornerMin.x) {
						// Top Left Circle
						const collisionTopLeft = collideCircle(relativePosition.subtract(new V3(cornerMin.x, cornerMax.y)), deltaPosition, radius);
						if (collisionTopLeft.hit && tMin > collisionTopLeft.t) {
							hit = true;
							tMin = collisionTopLeft.t;
							wallNormal = collisionTopLeft.wn;
							// console.log(collisionIndex, 'hit tl');
						}
						// Top Right Circle
						// console.log('tr', collisionIndex, relativePosition.subtract(new V3(cornerMin.x, cornerMax.y)), relativePosition.subtract(cornerMax).add(deltaPosition), radius);
						const collisionTopRight = collideCircle(relativePosition.subtract(cornerMax), deltaPosition, radius);
						if (collisionTopRight.hit && tMin > collisionTopRight.t) {
							hit = true;
							tMin = collisionTopRight.t;
							wallNormal = collisionTopRight.wn;
							// console.log(collisionIndex, 'hit tr');
						}
						// Bottom Left Circle
						const collisionBottomLeft = collideCircle(relativePosition.subtract(cornerMin), deltaPosition, radius);
						if (collisionBottomLeft.hit && tMin > collisionBottomLeft.t) {
							hit = true;
							tMin = collisionBottomLeft.t;
							wallNormal = collisionBottomLeft.wn;
							// console.log(collisionIndex, 'hit bl');
						}
						// Bottom Right Circle
						const collisionBottomRight = collideCircle(relativePosition.subtract(new V3(cornerMax.x, cornerMin.y)), deltaPosition, radius);
						if (collisionBottomRight.hit && tMin > collisionBottomRight.t) {
							hit = true;
							tMin = collisionBottomRight.t;
							wallNormal = collisionBottomRight.wn;
							// console.log(collisionIndex, 'hit br');
						}
					} else {
						const collision = collideCircle(relativePosition, deltaPosition, radius);
						if (collision.hit && tMin > collision.t) {
							hit = true;
							tMin = collision.t;
							wallNormal = collision.wn;
						}
					}
				}

				if (hit && !hitEntity) {
					hitEntity = e;
				}
			}
		});

		// console.log(wallNormal, tMin);
		const newPosition = entity.position.add(deltaPosition.scale(tMin));
		const moveValid = entities.map((e) => entity == e || !intersects(entity, newPosition, e)).reduce((a, b) => a && b);

		if (moveValid) {
			entity.position = newPosition;
			if (hit) {
				const velocityReduction = wallNormal.scale(entity.velocity.inner(wallNormal));
				if (entity.collisionModel.mass && hitEntity.collisionModel.mass) {
					const massRatio = entity.collisionModel.mass / hitEntity.collisionModel.mass;
					hitEntity.velocity.addEquals(velocityReduction.scale(massRatio));
				}
				entity.velocity.subtractEquals(velocityReduction);
				deltaPosition.subtractEquals(wallNormal.scale(deltaPosition.inner(wallNormal)));
			} else {
				break;
			}
		} else {
			break;
		}
	}
}

function intersects(e1, np, e2) {
	if (e1 != e2 && e1.collides && e2.collides) {
		const rp = np.subtract(e2.position);
		const sizeX = e1.collisionModel.box.x + e2.collisionModel.box.x;
		const sizeY = e1.collisionModel.box.y + e2.collisionModel.box.y;
		const radius = e1.collisionModel.radius + e2.collisionModel.radius;
		const epsilon = 0.001;

		if (sizeX) {
			if (radius) {
				const boxMin1 = new V3(sizeX + 2 * (radius - epsilon), sizeY - epsilon).scale(-0.5);
				const boxMax1 = new V3(sizeX + 2 * (radius - epsilon), sizeY - epsilon).scale(0.5);
				if (rp.x >= boxMin1.x && rp.x <= boxMax1.x && rp.y >= boxMin1.y && rp.y <= boxMax1.y) {
					console.log('i bx', rp, boxMin1, boxMax1);
					return true;
				}
				const boxMin2 = new V3(sizeX - epsilon, sizeY + 2 * (radius - epsilon)).scale(-0.5);
				const boxMax2 = new V3(sizeX - epsilon, sizeY + 2 * (radius - epsilon)).scale(0.5);
				if (rp.x >= boxMin2.x && rp.x <= boxMax2.x && rp.y >= boxMin2.y && rp.y <= boxMax2.y) {
					console.log('i by', rp, boxMin2, boxMax2);
					return true;
				}
			} else {
				const boxMin = new V3(sizeX, sizeY).scale(-0.5);
				const boxMax = new V3(sizeX, sizeY).scale(0.5);
				if (rp.x >= boxMin.x && rp.x <= boxMax.x && rp.y >= boxMin.y && rp.y <= boxMax.y) {
					console.log('i b', rp, boxMin, boxMax);
					return true;
				}
			}
		}
		
		if (radius) {
			const radiusSqare = radius * radius;d
			if (sizeX) {
				const rpTL = rp.add(new V3(-0.5 * sizeX, 0.5 * sizeY));
				if (rpTL.lengthSquare() <= radiusSqare) {
					console.log('i tl', rpTL, radiusSqare);
					return true;
				}
				const rpTR = rp.add(new V3(0.5 * sizeX, 0.5 * sizeY));
				if (rpTR.lengthSquare() <= radiusSqare) {
					console.log('i tr', rpTR, radiusSqare);
					return true;
				}
				const rpBL = rp.add(new V3(-0.5 * sizeX, -0.5 * sizeY));
				if (rpBL.lengthSquare() <= radiusSqare) {
					console.log('i bl', rpBL, radiusSqare);
					return true;
				}
				const rpBR = rp.add(new V3(0.5 * sizeX, -0.5 * sizeY));
				if (rpBR.lengthSquare() <= radiusSqare) {
					console.log('i br', rpBR, radiusSqare);
					return true;
				}
			} else {
				if (rp.lengthSquare() <= radius) {
					console.log('i c');
					return true;
				}
			}
		}
		
	}
	return false;
}

function collideWall(x, y, dx, dy, wx, wy1, wy2) {
	let hit = false;
	let t = 1.;
	const epsilon = 0.0001;

	if (dx !== 0.) {
		const nt = (wx - x) / dx;
		const ny = y + t * dy;
		if ((nt > 0.) && (nt < t) && (((y >= wy1) && (y <= wy2)) || ((ny >= wy1) && (ny <= wy2)))) {
			hit = true;
			t = Math.max(0., nt - epsilon);
		}
	}

	return {hit, t};
}

function collideCircle(rp, dp, r) {
	let hit = false;
	let t = 1.;
	let wn = new V3();
	const epsilon = 0.0001;

	const dpSqared = dp.inner(dp);
	const reverseInnerDifference = rp.x * dp.y - rp.y * dp.x;
	const deltaSquared = r * r * dpSqared - reverseInnerDifference * reverseInnerDifference;
	if (deltaSquared >= 0) {
		const inner = rp.inner(dp);
		const delta = Math.sqrt(deltaSquared);
		const tCandidate1 = (-inner + delta) / dpSqared;
		const tFinalCandidate1 = (tCandidate1 > 0) ? tCandidate1 : t;
		const tCandidate2 = (-inner - delta) / dpSqared;
		const tFinalCandidate2 = (tCandidate2 > 0) ? tCandidate2 : t;
		const tFinal = Math.min(tFinalCandidate1, tFinalCandidate2);
		if (t > tFinal) {
			hit = true;
			t = Math.max(0., tFinal - epsilon);
			// wn = rp.add(dp.scale(t)).normalize();
			wn = rp.normalize();
		}
	}

	return {hit, t, wn};
}

function draw() {
	renderer.clear();
	renderer.save();

	const cameraPositionDelta = renderer.cameraPosition.scale(metersToPixels * zoomLevel).multiply(new V3(-1., 1.));
	const screenOffset = renderer.size.scale(0.5);
	renderer.translate(cameraPositionDelta.add(screenOffset));

	const grassImage = imageStore.images[grassTile];
	const grassTileSize = new V3(grassImage.width, grassImage.height).scale(zoomLevel);
	const grassOffset = grassTileSize.subtract(grassTileSize.multiply(new V3(0.5, 0.5)));
	for (let yTile = grassTileFrom.y; yTile <= grassTileTo.y; ++yTile) {
		for (let xTile = grassTileFrom.x; xTile <= grassTileTo.x; ++xTile) {
			const grassTileDelta = grassOffset.add(new V3(xTile + 0.5, yTile + 0.5).multiply(grassTileSize));
			renderer.drawImage(grassImage, grassTileDelta, grassTileSize);
		}
	}

	entities.sort((a, b) => a.position.y < b.position.y ? 1 : -1);

	entities.forEach((entity) => { 
		const entityPositionDelta = entity.position.scale(metersToPixels).multiply(new V3(1., -1.)).scale(zoomLevel);
		const image = imageStore.images[entityTypeToImage[entity.type]];
		const imageSize = new V3(image.width, image.height);
		if (entity.spritesheetModel) {
			const srcSize = imageSize.divide(entity.spritesheetModel.size);
			const dstSize = srcSize.scale(zoomLevel);
			const entityCenterDelta = dstSize.subtract(dstSize.multiply(entity.center)).subtract(entityPositionDelta);
			renderer.drawSprite(image, srcSize.multiply(entity.spritesheetModel.index), srcSize, entityCenterDelta, dstSize);
		} else {
			const size = imageSize.scale(zoomLevel);
			const offset = size.subtract(size.multiply(entity.center)).subtract(entityPositionDelta);

			if (entity.repeatedModel) {
				const repeatedOffset = size.multiply(entity.repeatedModel.sizeScale).multiply(entity.repeatedModel.direction).multiply(new V3(-1., 1.));
				for (let repeatedIndex = 0; repeatedIndex < entity.repeatedModel.count; ++repeatedIndex) {
					const entityOffset = offset.add(repeatedOffset.scale(repeatedIndex));
					renderer.drawImage(image, entityOffset, size);
				}
			} else {
				renderer.drawImage(image, offset, size);
			}
		}
		
	});
	renderer.restore();

	if (debugInfoOn) {
		debugDraw();
	}
}

function debugDraw() {
	renderer.context.lineWidth = '1';
	renderer.context.strokeStyle = 'rgb(255,0,0)';
	renderer.context.fillStyle = 'rgb(255,0,0)';
	renderer.context.font = '30px courier';

	if (debugGridOn) {
		renderer.save();
		renderer.context.fillStyle = 'rgb(255,255,0)';
		renderer.context.globalAlpha = 0.5;
		const canvasSize = renderer.size;
		const cameraOffset = renderer.cameraPosition.scale(metersToPixels);
		for (let y = -32; y <= 31; ++y) {
			for (let x = -32; x <= 31; ++x) {
				if ((y + x) % 2 === 0) {
					renderer.context.fillRect(
						0.5 * (canvasSize.x) + zoomLevel * (x * metersToPixels - cameraOffset.x), 
						0.5 * (canvasSize.y) - zoomLevel * (y * metersToPixels - cameraOffset.y), 
						tileSizePixels * zoomLevel, 
						tileSizePixels * zoomLevel);
				}
			}
		}
		renderer.restore();
	}

	renderer.context.strokeRect(0.5, 0.5, renderer.canvas.width - 1, renderer.canvas.height - 1);

	// Center
	const center = new V3(0.5 * renderer.canvas.width + (renderer.canvas.width % 2 == 0 ? 0.5 : 0),
						  0.5 * renderer.canvas.height + (renderer.canvas.height % 2 == 0 ? 0.5 : 0));
	const crossWidth = renderer.canvas.width % 2 == 0 ? 1 : 0;
	const crossHeight = renderer.canvas.height % 2 == 0 ? 1 : 0;
	renderer.context.strokeRect(center.x - crossWidth, center.y - 32, crossWidth, 64 - crossHeight);
	renderer.context.strokeRect(center.x - 32, center.y - crossHeight, 64 - crossWidth, crossHeight);
	renderer.context.fillText('X', center.x + 32, center.y + 8);
	renderer.context.fillText('-X', center.x - 70, center.y + 8);
	renderer.context.fillText('Y', center.x - 10, center.y - 40);
	renderer.context.fillText('-Y', center.x - 27, center.y + 56);

	// Top Left
	renderer.context.fillText('Resolution: ' + renderer.canvas.width + ' x ' + renderer.canvas.height, 10, 30);
	renderer.context.fillText('FPS: ' + fps.toString().substring(0, fps.toString().indexOf('.')), 10, 60);
	const keysPressed = keys.map((value, index) => value ? String.fromCharCode(index) + ' ' + index : 0).filter((value) => value);
	renderer.context.fillText(keysPressed, 10, 90);
	const mouseWorldPosition = mouse.position.add(player.position);
	renderer.context.fillText(`Mouse: (${displayText(mouseWorldPosition.x, 2, 0.01, true)}, ${displayText(mouseWorldPosition.y, 2, 0.01, true)})` + (mouse.left ? ' L' : '') + (mouse.middle ? ' M' : '') + (mouse.right ? ' R' : ''), 10, 120);
	// renderer.context.fillText('the quick brown fox jumps over the lazy dog', 10, 150);
	// renderer.context.fillText('the quick brown fox jumps over the lazy dog', 10, 180);

	// Top Right
	const playerPositionText = `Player Pos: (${displayText(player.position.x, 2, 0.01, true)},${displayText(player.position.y, 2, 0.01, true)})`;
	const playerPositionTextMetrics = renderer.context.measureText(playerPositionText);
	renderer.context.fillText(playerPositionText, renderer.canvas.width - playerPositionTextMetrics.width - 5, 30);

	const playerSpeedText = `Player Speed: ${displayText(player.velocity.length(), 2, 0.01, true)}, (${displayText(player.velocity.x, 2, 0.01, true)},${displayText(player.velocity.y, 2, 0.01, true)})`;
	const playerSpeedTextMetrics = renderer.context.measureText(playerSpeedText);
	renderer.context.fillText(playerSpeedText, renderer.canvas.width - playerSpeedTextMetrics.width - 5, 60);

	// Bottom Rignt
	const nameVersionDisplayTextMetrics = renderer.context.measureText(nameVersionDisplay);
	renderer.context.fillText(nameVersionDisplay, renderer.canvas.width - nameVersionDisplayTextMetrics.width - 5, renderer.canvas.height - 5);
}
