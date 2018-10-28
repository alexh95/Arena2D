import Renderer from './Renderer.js';
import {imageStore} from './ImageStore.js';
import {V3} from './Math.js';
import {CollisionModelData, Entity, EntityTypes, entities, removedEntityIndexes, entityTypeToImage, RepeatedModel, SpritesheetModel} from './Entity.js';
import {Controller} from './Controller.js';
import {settings} from './Settings.js';
import {nameVersionDisplay} from './Constants.js';

const renderer = new Renderer();

const controller = new Controller();

let grassTile = null;

let player = null;
let monster = null;
let box1 = null;
let barrel1 = null;

let debugInfoToggleOld = false;
let debugGridToggleOld = false;

export default function start() {
	console.log(nameVersionDisplay);

	window.addEventListener('resize', () => renderer.setSize());
	window.addEventListener('keydown', (event) => {
		controller.setKey(event.keyCode, true);
		if (event.keyCode == 9) {
			event.preventDefault();
		}
	});
	window.addEventListener('keyup', (event) => {
		controller.setKey(event.keyCode, false);
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
				controller.mouse.leftDelta = true;
				controller.mouse.left = true;
			} break;
			case 2: {
				controller.mouse.middleDelta = true;
				controller.mouse.middle = true;
			} break;
			case 3: {
				controller.mouse.rightDelta = true;
				controller.mouse.right = true;
			} break;
		}
	});
	window.addEventListener('touchstart', (event) => {
		// console.log('touchstart', event);
		controller.mouse.left = true;
	});
	window.addEventListener('mouseup', (event) => {
		// console.log(event);
		switch (event.which) {
			case 1: {
				controller.mouse.leftDelta = true;
				controller.mouse.left = false;
			} break;
			case 2: {
				controller.mouse.middleDelta = true;
				controller.mouse.middle = false;
			} break;
			case 3: {
				controller.mouse.rightDelta = true;
				controller.mouse.right = false;
			} break;
		}
	});
	window.addEventListener('touchend', (event) => {
		// console.log('touchend', event);
		controller.mouse.left = false;
	});
	window.addEventListener('mousewheel', (event) => {
		// console.log(event);
		const zoomDelta = event.deltaY / -100;
		renderer.zoomLevel += zoomDelta;
		if (renderer.zoomLevel < 1) {
			renderer.zoomLevel = 1;
		} else if (renderer.zoomLevel > 8) {
			renderer.zoomLevel = 8;
		}
		renderer.updateProjectionMatrix();
	});
	window.addEventListener('mousemove', (event) => {
		// console.log(event);
		controller.mouse.screenPosition.x = event.offsetX;
		controller.mouse.screenPosition.y = event.offsetY;
		const canvasSize = renderer.size;
		const worldPosition = new V3(controller.mouse.screenPosition.x, canvasSize.y - controller.mouse.screenPosition.y).subtract(canvasSize.scale(0.5)).scale(renderer.pixelsToMeters);
		controller.mouse.position = worldPosition.scale(1. / renderer.zoomLevel);
	});

	window.addEventListener('touchmove', (event) => {
		// console.log('touchmove', event);
		controller.mouse.screenPosition.x = event.changedTouches[0].clientX;
		controller.mouse.screenPosition.y = event.changedTouches[0].clientY;
		const canvasSize = renderer.size;
		const worldPosition = new V3(controller.mouse.screenPosition.x, canvasSize.y - controller.mouse.screenPosition.y).subtract(canvasSize.scale(0.5)).scale(renderer.pixelsToMeters);
		controller.mouse.position = worldPosition.scale(1. / renderer.zoomLevel);
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
	entityTypeToImage[EntityTypes.PROJECTILE] = imageStore.loadImage('res/projectile.png');
	entityTypeToImage[EntityTypes.TEST_SPRITESHEET] = imageStore.loadImage('res/spritesheet_template.png');
	entityTypeToImage[EntityTypes.SPRITESHEET_PLAYER] = imageStore.loadImage('res/spritesheet_player.png');
	entityTypeToImage[EntityTypes.SPRITESHEET_MONSTER] = imageStore.loadImage('res/spritesheet_monster.png');
	entityTypeToImage[EntityTypes.SPRITESHEET_MELEE_ATTACK] = imageStore.loadImage('res/spritesheet_melee_attack.png');
	grassTile = imageStore.loadImage('res/grass_tile.png');
	renderer.joystickBaseIndex = imageStore.loadImage('res/joystick_base.png');
	renderer.joystickStickIndex = imageStore.loadImage('res/joystick_stick.png');

	startLoop();
}

function createEntity(type, position, center, collisionModelData, repeatedModel, spritesheetModel) {
	const image = imageStore.images[entityTypeToImage[type]];
	const size = new V3(image.width, image.height);
	if (spritesheetModel) {
		size.divideEquals(spritesheetModel.size);
	}
	size.scaleEquals(renderer.pixelsToMeters);
	const entity = new Entity(type, position, center, size);
	const collisionModel = collisionModelData && collisionModelData.buildCollisionModel(size);
	entity.collisionModel = collisionModel;
	entity.repeatedModel = repeatedModel;
	entity.spritesheetModel = spritesheetModel;
	return entity;
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
	return createRepeatedEntity(EntityTypes.WALL_HORIZONTAL, position, new V3(0.5, 0.25), new CollisionModelData(true, new V3(), new V3(1.0, 0.25), 0.0, 0.0), repeatedModel);
}

function createVerticalWall(position, direction = null, count = null) {
	const repeatedModel = (count) ? new RepeatedModel(direction, count, new V3(1., 0.5)) : null;
	return createRepeatedEntity(EntityTypes.WALL_VERTICAL, position, new V3(0.5, 0.25), new CollisionModelData(true, new V3(), new V3(0.5, 0.5), 0.0, 0.0), repeatedModel);
}

function createTopLeftCornerlWall(position) {
	return createSimpleEntity(EntityTypes.WALL_TOP_LEFT_CORNER, position, new V3(0.5, 0.25), new CollisionModelData(true, new V3(0.25, -0.25), new V3(0.75, 0.375), 0.0, 0.0));
}

function createTopRightCornerlWall(position) {
	return createSimpleEntity(EntityTypes.WALL_TOP_RIGHT_CORNER, position, new V3(0.5, 0.25), new CollisionModelData(true, new V3(-0.25, -0.25), new V3(0.75, 0.375), 0.0, 0.0));
}

function createBottomLeftCornerlWall(position) {
	return createSimpleEntity(EntityTypes.WALL_BOTTOM_LEFT_CORNER, position, new V3(0.5, 0.25), new CollisionModelData(true, new V3(0.25, 0.25), new V3(0.75, 0.375), 0.0, 0.0));
}

function createBottomRightCornerlWall(position) {
	return createSimpleEntity(EntityTypes.WALL_BOTTOM_RIGHT_CORNER, position, new V3(0.5, 0.25), new CollisionModelData(true, new V3(-0.25, 0.25), new V3(0.75, 0.375), 0.0, 0.0));
}

function createTCornerWall(position) {
	return createSimpleEntity(EntityTypes.WALL_T_CORNER, position, new V3(0.5, 0.25), new CollisionModelData(true, new V3(), new V3(1.0, 0.5), 0.0, 0.0));
}

function createBarrel(position) {
	return createSimpleEntity(EntityTypes.BARREL, position, new V3(0.5, 0.25), new CollisionModelData(true, new V3(), new V3(14. / 16., 14. / 32.), 1.0, 2.0));
}

function createBox(position) {
	return createSimpleEntity(EntityTypes.BOX, position, new V3(0.5, 0.25), new CollisionModelData(true, new V3(), new V3(1.0, 0.25), 0.0, 2.0));
}

function createProjectile(position) {
	return createSimpleEntity(EntityTypes.PROJECTILE, position, new V3(0.5, 0.5), new CollisionModelData(true, new V3(), new V3(1.0, 1.0), 1.0, 1.0));
}

function createAttack() {
	const attack = createSpreadsheetEntity(EntityTypes.SPRITESHEET_MELEE_ATTACK, new V3(), new V3(0.5, 0.5), new CollisionModelData(false, new V3(), new V3(1.0, 1.0), 1.0, 1.0), new SpritesheetModel(new V3(4, 1, 1), 0.25 * 0.25))
	return attack;
}

function startLoop() {
	if (imageStore.isLoadingFinished()) {
		const playerCharacter = createSimpleEntity(EntityTypes.PLAYER, new V3(0., 0.), new V3(0.5, 0.25), new CollisionModelData(true, new V3(), new V3(1., 0.5), 1.0, 1.0));

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

		const playerSpritesheet = createSpreadsheetEntity(EntityTypes.SPRITESHEET_PLAYER, new V3(0.5, 0.5), new V3(0.5, 0.125), new CollisionModelData(true, new V3(), new V3(0.5, 0.25), 1.0, 1.0), new SpritesheetModel(new V3(4, 4, 1), 0.25));
		const monsterSpritesheet = createSpreadsheetEntity(EntityTypes.SPRITESHEET_MONSTER, new V3(0.0, 5.0), new V3(0.5, 0.125), new CollisionModelData(true, new V3(), new V3(0.5, 0.25), 1.0, 1.0), new SpritesheetModel(new V3(4, 4, 1), 0.25));

		const box = createBox(new V3(5.5, 0.5));
		const barrel = createBarrel(new V3(-5.5, 0.5));

		box1 = box;
		barrel1 = barrel;
		player = playerSpritesheet;
		monster = monsterSpritesheet;

		box1.combatModel = {
			health: 0.75
		};
		barrel1.combatModel = {
			health: 0.25
		};
		player.combatModel = {
			health: 1.0,
			attacking: false,
			elapsed: 0.0,
			duration: 0.0,
			attacked: []
		};
		monster.combatModel = {
			health: 1.0,
			attacked: []
		};
		
		addEntity(wallN, wallS, wallE, wallW, wallNWC, wallNEC, wallSWC, wallSEC);

		addEntity(wallLN, wallLW, wallLE1, wallLS1, wallLE2, wallLS2, wallLS3, wallLNWC1, wallLNWC2, wallLNEC, wallLSWC, wallLSEC1, wallLSEC2);

		addEntity(wallRN, wallRE, wallRW1, wallRS1, wallRW2, wallRS2, wallRS3, wallRNWC, wallRNEC1, wallRNEC2, wallRSWC1, wallRSWC2, wallRSEC);

		addEntity(wallT1);
		addEntity(wallT2);
		addEntity(wallT3);
		addEntity(wallT4);
		addEntity(wallT5);
		addEntity(wallT6);
		addEntity(wallT7);

		addEntity(player);
		addEntity(monster);
		addEntity(box1);
		addEntity(barrel1);


		renderer.initDraw(grassTile);
		renderer.buildTileMap();

		window.requestAnimationFrame(loop);
	} else {
		window.requestAnimationFrame(startLoop);
	}
}

let msElapsedOld = 0.0;
const msDeltas = new Array(30);
let msDeltaLastIndex = 0;

function loop(msElapsed) {
	// TODO(alex): test with request frame as the last instruction
	window.requestAnimationFrame(loop);

	const msDelta = msElapsed - msElapsedOld;
	if (++msDeltaLastIndex >= msDeltas.length) {
		msDeltaLastIndex = 0;
	}
	msDeltas[msDeltaLastIndex] = msDelta;
	const sum = msDeltas.reduce((a, b) => a + b);
	settings.fps = 1000.0 * msDeltas.length / sum;

	msElapsedOld = msElapsed;
	const dt = msDelta / 1000;

	// const d1 = Date.now();
	update(dt);
	// const d2 = Date.now();
	// console.log('update', d2 - d1);

	renderer.draw();
	// const d3 = Date.now();
	// console.log('draw', d3 - d2);
}

function update(dt) {
	if (controller.debugInfoToggle && controller.debugInfoToggle != debugInfoToggleOld) {
		settings.debugInfoOn = !settings.debugInfoOn;
	}
 	debugInfoToggleOld = controller.debugInfoToggle;

	if (controller.debugGridToggle && controller.debugGridToggle != debugGridToggleOld) {
		settings.debugGridOn = !settings.debugGridOn;
	}
	debugGridToggleOld = controller.debugGridToggle;

	let direction = new V3();
	if (settings.isAndroid && controller.mouse.left) {
		const canvasSize = renderer.size;
		const diameter = 0.4 * canvasSize.y - 16;
		const joystickSize = new V3(diameter , diameter);
		const joystickOffset = new V3(16., canvasSize.y - joystickSize.y - 16.);
		const delta = joystickOffset.add(joystickSize.scale(0.5)).subtract(controller.mouse.screenPosition).scale(2. / (0.75 * diameter));
		delta.x = -delta.x;
		const distance = delta.length();
		if (distance < 1.) {
			direction = delta;
		} else if (distance < 2.) {
			direction = delta
			direction.normalizeEquals();
		}
	} else {
		if (controller.mouse.right) {
			direction = controller.mouse.position.clone();
		} else {
			direction = new V3();
		}

		if (controller.left) {
			direction.x -= 1.;
		}
		if (controller.right) {
			direction.x += 1.;
		}
		if (controller.down) {
			direction.y -= 1.;
		}
		if (controller.up) {
			direction.y += 1.;
		}

		direction.normalizeEquals();
	}
	renderer.joystick.direction = direction;

	entities.forEach((entity) => {
		if (entity && entity.type === EntityTypes.PROJECTILE) {
			const elapsedCandidate = Math.min(entity.projectileModel.elapsed + dt, entity.projectileModel.duration);
			const edt = elapsedCandidate - entity.projectileModel.elapsed;
			entity.projectileModel.elapsed = elapsedCandidate;
			moveEntity(edt, entity, entity.projectileModel.speed, entity.projectileModel.direction);
			if (entity.projectileModel.elapsed >= entity.projectileModel.duration && !!entities[entity.index]) {
				removeEntity(entity);
			}
		}
	});
	entities.forEach((entity) => {
		if (entity && entity.type === EntityTypes.SPRITESHEET_MELEE_ATTACK) {
			entity.spritesheetModel.elapsed += dt;
			if (entity.spritesheetModel.elapsed >= entity.spritesheetModel.period) {
				entity.spritesheetModel.elapsed -= entity.spritesheetModel.period;
				if(++entity.spritesheetModel.index.x >= entity.spritesheetModel.size.x) {
					entity.spritesheetModel.index.x = 0;
					removeEntity(entity);
					player.combatModel.attacking = false;
				}
				if (entity.spritesheetModel.index.x === Math.floor(0.5 * entity.spritesheetModel.size.x)) {
					const playerAttack = entities[player.attack];
					entities.filter((entity) => entity != null).forEach((entity) => {
						if (entity != player && entity.combatModel && intersects(playerAttack, playerAttack.position, entity)) {
							damageEntity(entity, 0.1);
						}
					});
				}
			}
		}
	});

	const lookDirection = controller.mouse.position.normalize();

	if (player.combatModel.attacking) {
		const playerAttack = entities[player.attack];
		const attackImage = imageStore.images[entityTypeToImage[EntityTypes.SPRITESHEET_MELEE_ATTACK]];
		const attackSize = new V3(attackImage.width, attackImage.height).scale(renderer.pixelsToMeters).divide(playerAttack.spritesheetModel.size);
		const attackPosition = player.position.add(attackSize.scale(0.5).multiply(lookDirection));
		playerAttack.position = attackPosition;
		playerAttack.rotation = Math.sign(lookDirection.y) * Math.acos(lookDirection.inner(new V3(1.0, 0.0)));
	}

	updateSpreadsheet(dt, player, direction, lookDirection);
	const playerSpeed = player.combatModel.attacking ? 0.0 : 80.0;
	moveEntity(dt, player, playerSpeed, direction);
	renderer.cameraPosition = player.position.clone();

	const monsterDirection = player.position.add(player.velocity.scale(dt)).subtract(monster.position.add(monster.velocity.scale(dt))).normalize();
	updateSpreadsheet(dt, monster, monsterDirection);

	if (monster.index) {
		moveEntity(dt, monster, 15.0, monsterDirection);
	}

	if (box1.index) {
		moveEntity(dt, box1, 0.0, new V3());
	}

	if (barrel1.index) {
		moveEntity(dt, barrel1, 0.0, new V3());
	}

	if (controller.mouse.leftDelta) {
		if (controller.mouse.left && !player.combatModel.attacking) {
			player.combatModel.attacking = true;
			player.combatModel.attacked = [];
			const attackImage = imageStore.images[entityTypeToImage[EntityTypes.SPRITESHEET_MELEE_ATTACK]];
			const attack = createAttack();
			const attackSize = new V3(attackImage.width, attackImage.height).scale(renderer.pixelsToMeters).divide(attack.spritesheetModel.size);
			const attackPosition = player.position.add(attackSize.scale(0.5).multiply(lookDirection));
			attack.position = attackPosition;
			attack.rotation = 0.0;
			addEntity(attack);
			player.attack = attack.index;
		}
	}
	if (controller.mouse.middleDelta) {
		if (controller.mouse.middle) {
			const projectileImage = imageStore.images[entityTypeToImage[EntityTypes.PROJECTILE]];
			const projectileSize = new V3(projectileImage.width, projectileImage.height).scale(renderer.pixelsToMeters);
			const projectilePosition = player.position.add(projectileSize.multiply(lookDirection).scale(1.0001));
			const projectile = createProjectile(projectilePosition);
			projectile.velocity = player.velocity.add(lookDirection.scale(15.0));
			projectile.projectileModel = {
				duration: 5.0,
				elapsed: 0.0,
				speed: 100.0,
				damage: 0.05,
				direction: lookDirection
			}
			addEntity(projectile);
		}
	}
	
	controller.mouse.leftDelta = false;
	controller.mouse.middleDelta = false;
	controller.mouse.rightDelta = false;
}

function updateSpreadsheet(dt, entity, direction, lookDirection = null) {
	if (!lookDirection) {
		lookDirection = direction;
	}
	const absDirX = Math.abs(lookDirection.x);
	const absDirY = Math.abs(lookDirection.y);

	if (lookDirection.x > 0 && absDirX > absDirY) {
		entity.spritesheetModel.index.y = 0;
	} else if (lookDirection.x < 0 && absDirX > absDirY) {
		entity.spritesheetModel.index.y = 2;
	} else if (lookDirection.y > 0 && absDirY > absDirX) {
		entity.spritesheetModel.index.y = 1;
	} else if (lookDirection.y < 0 && absDirY > absDirX) {
		entity.spritesheetModel.index.y = 3;
	}

	if (direction.lengthSquare() > 0.0) {
		entity.spritesheetModel.elapsed += dt;
		if (entity.spritesheetModel.elapsed >= entity.spritesheetModel.period) {
			entity.spritesheetModel.elapsed -= entity.spritesheetModel.period;
			if(++entity.spritesheetModel.index.x >= entity.spritesheetModel.size.x) {
				entity.spritesheetModel.index.x = 0;
			}
		}
	} else {
		entity.spritesheetModel.index.x = 0;
	}		
}

function addEntity(...entityArray) {
	entityArray.forEach((entity) => {
		if (removedEntityIndexes.length === 0) {
			entity.index = entities.length;
			entities.push(entity);
		} else {
			const nextFreeIndex = removedEntityIndexes.pop();
			entity.index = nextFreeIndex;
			entities[nextFreeIndex] = entity;
		}
	});
}

function removeEntity(entity) {
	assert(entities[entity.index], 'entity already removed');
	entities[entity.index] = null;
	removedEntityIndexes.push(entity.index);
	entity.index = null;
}

function damageEntity(entity, damage) {
	if (entity.combatModel.health > 0.0) {
		entity.combatModel.health = Math.max(entity.combatModel.health - damage, 0.0);
		if (entity.combatModel.health <= 0.0001) {
			removeEntity(entity);
		}
	}
}

let insideOld = false;
function moveEntity(dt, entity, speed, direction) {
	let insideNew = false;

	const acceleration = direction.scale(speed).subtract(entity.velocity.scale(8.0));
	let deltaPosition = entity.velocity.scale(dt).add(acceleration.scale(0.5 * dt * dt));
	entity.velocity = entity.velocity.add(acceleration.scale(dt));

	for (let collisionIndex = 0; collisionIndex < 4; ++collisionIndex) {
		let hit = false;
		let hitEntity = null;
		let tMin = 1.0;
		let wallNormal = new V3();

		if (entity.collisionModel && entity.collisionModel.collidesWhenMoving) {
			entities.filter((e) => e && e != entity && 
								e.collisionModel && e.collisionModel.collidesWhenMoving
			).forEach((e, index) => {
				const relativePosition = entity.position.subtract(e.position);
				const cornerMin = entity.collisionModel.cornerMin.add(e.collisionModel.cornerMin);
				const cornerMax = entity.collisionModel.cornerMax.add(e.collisionModel.cornerMax);
				const innerCornerMin = entity.collisionModel.innerCornerMin.add(e.collisionModel.innerCornerMin);
				const innerCornerMax = entity.collisionModel.innerCornerMax.add(e.collisionModel.innerCornerMax);
				const innerDiffX = Math.abs(innerCornerMin.x - innerCornerMax.x);
				const innerDiffY = Math.abs(innerCornerMin.y - innerCornerMax.y);

				if (e.repeatedModel) {
					const e2DiffX = Math.abs(e.collisionModel.cornerMin.x - e.collisionModel.cornerMax.x);
					const e2DiffY = Math.abs(e.collisionModel.cornerMin.y - e.collisionModel.cornerMax.y);
					const e2InnerDiffX = Math.abs(e.collisionModel.innerCornerMin.x - e.collisionModel.innerCornerMax.x);
					const e2InnerDiffY = Math.abs(e.collisionModel.innerCornerMin.y - e.collisionModel.innerCornerMax.y);
					if (e.repeatedModel.direction.x < 0.0) {
						cornerMin.x -= (e.repeatedModel.count - 1) * e2DiffX;
						innerCornerMin.x -= (e.repeatedModel.count - 1) * e2InnerDiffX;
					} else if (e.repeatedModel.direction.x > 0.0) {
						cornerMax.x += (e.repeatedModel.count - 1) * e2DiffX;
						innerCornerMax.x += (e.repeatedModel.count - 1) * e2InnerDiffX;
					}
					if (e.repeatedModel.direction.y < 0.0) {
						cornerMin.y -= (e.repeatedModel.count - 1) * e2DiffY;
						innerCornerMin.y -= (e.repeatedModel.count - 1) * e2InnerDiffY;
					} else if (e.repeatedModel.direction.y > 0.0) {
						cornerMax.y += (e.repeatedModel.count - 1) * e2DiffY;
						innerCornerMax.y += (e.repeatedModel.count - 1) * e2InnerDiffY;
					}
				}
				
				const radius = e.collisionModel.radius + entity.collisionModel.radius;
				const epsilon = radius && 0.001 || 0.;
				if (innerDiffX) {
					// Left wall
					const collisionLeft = collideWall(relativePosition.x, relativePosition.y, deltaPosition.x, deltaPosition.y, cornerMin.x + epsilon, innerCornerMin.y, innerCornerMax.y, tMin);
					if (collisionLeft.hit && tMin > collisionLeft.t) {
						hit = true;
						tMin = collisionLeft.t;
						wallNormal = new V3(-1., 0.);
						// console.log(collisionIndex, 'hit ls');
					}
					// Right wall
					// console.log('r', collisionIndex, relativePosition, relativePosition.add(deltaPosition), cornerMax.x + radius, innerCornerMin.y, innerCornerMin.y);
					const collisionRight = collideWall(relativePosition.x, relativePosition.y, deltaPosition.x, deltaPosition.y, cornerMax.x - epsilon, innerCornerMin.y, innerCornerMax.y, tMin);
					if (collisionRight.hit && tMin > collisionRight.t) {
						hit = true;
						tMin = collisionRight.t;
						wallNormal = new V3(1., 0.);
						// console.log(collisionIndex, 'hit rs');
					}
				}
				if (innerDiffY) {
					// Bottom wall
					const collisionBottom = collideWall(relativePosition.y, relativePosition.x, deltaPosition.y, deltaPosition.x, cornerMin.y + epsilon, innerCornerMin.x, innerCornerMax.x, tMin);
					if (collisionBottom.hit && tMin > collisionBottom.t) {
						hit = true;
						tMin = collisionBottom.t;
						wallNormal = new V3(0., -1.);
						// console.log(collisionIndex, 'hit bs');
					}
					// Top wall
					const collisionTop = collideWall(relativePosition.y, relativePosition.x, deltaPosition.y, deltaPosition.x, cornerMax.y - epsilon, innerCornerMin.x, innerCornerMax.x, tMin);
					if (collisionTop.hit && tMin > collisionTop.t) {
						hit = true;
						tMin = collisionTop.t;
						wallNormal = new V3(0., 1.);
						// console.log(collisionIndex, 'hit ts');
					}
				}
				if (radius > 0) {
					if (innerDiffX && innerDiffY) {
						// Top Left Circle
						const collisionTopLeft = collideCircle(relativePosition.subtract(new V3(innerCornerMin.x, innerCornerMax.y)), deltaPosition, radius);
						if (collisionTopLeft.hit && tMin > collisionTopLeft.t) {
							hit = true;
							tMin = collisionTopLeft.t;
							wallNormal = collisionTopLeft.wn;
							// console.log(collisionIndex, 'hit tlc');
						}
						// Top Right Circle
						// console.log('tr', collisionIndex, relativePosition.subtract(new V3(cornerMin.x, cornerMax.y)), relativePosition.subtract(cornerMax).add(deltaPosition), radius);
						const collisionTopRight = collideCircle(relativePosition.subtract(innerCornerMax), deltaPosition, radius);
						if (collisionTopRight.hit && tMin > collisionTopRight.t) {
							hit = true;
							tMin = collisionTopRight.t;
							wallNormal = collisionTopRight.wn;
							// console.log(collisionIndex, 'hit trc');
						}
						// Bottom Left Circle
						const collisionBottomLeft = collideCircle(relativePosition.subtract(innerCornerMin), deltaPosition, radius);
						if (collisionBottomLeft.hit && tMin > collisionBottomLeft.t) {
							hit = true;
							tMin = collisionBottomLeft.t;
							wallNormal = collisionBottomLeft.wn;
							// console.log(collisionIndex, 'hit blc');
						}
						// Bottom Right Circle
						const collisionBottomRight = collideCircle(relativePosition.subtract(new V3(innerCornerMax.x, innerCornerMin.y)), deltaPosition, radius);
						if (collisionBottomRight.hit && tMin > collisionBottomRight.t) {
							hit = true;
							tMin = collisionBottomRight.t;
							wallNormal = collisionBottomRight.wn;
							// console.log(collisionIndex, 'hit brc');
						}
					} else if (innerDiffX ^ innerDiffY) {
						// Left/Bottom Circle
						const collisionTopLeft = collideCircle(relativePosition.subtract(innerCornerMin), deltaPosition, radius);
						if (collisionTopLeft.hit && tMin > collisionTopLeft.t) {
							hit = true;
							tMin = collisionTopLeft.t;
							wallNormal = collisionTopLeft.wn;
							// console.log(collisionIndex, 'hit l/bc');
						}
						// Right/Top Circle
						const collisionTopRight = collideCircle(relativePosition.subtract(innerCornerMax), deltaPosition, radius);
						if (collisionTopRight.hit && tMin > collisionTopRight.t) {
							hit = true;
							tMin = collisionTopRight.t;
							wallNormal = collisionTopRight.wn;
							// console.log(collisionIndex, 'hit r/tc');
						}
					} else {
						// Center Circle
						const collision = collideCircle(relativePosition, deltaPosition, radius);
						if (collision.hit && tMin > collision.t) {
							hit = true;
							tMin = collision.t;
							wallNormal = collision.wn;
							// console.log(collisionIndex, 'hit cc');
						}
					}
				}
				if (hit && !hitEntity) {
					hitEntity = e;
				}
			});
		}

		// console.log(wallNormal, tMin);
		const newPosition = entity.position.add(deltaPosition.scale(tMin));
		const moveValid = entities.filter((e) => e && e.type !== EntityTypes.SPRITESHEET_MELEE_ATTACK).map((e) => (entity == e) || !intersects(entity, newPosition, e, true)).reduce((a, b) => a && b);

		if (moveValid) {
			entity.position = newPosition;
			if (hit) {
				if (entity.type === EntityTypes.PROJECTILE) {
					if (hitEntity.type !== EntityTypes.PROJECTILE) {
						if (hitEntity.combatModel) {
							damageEntity(hitEntity, entity.projectileModel.damage);
						}
						if (!entities[entity.index]) {
							console.log('nope');
						}
						removeEntity(entity);
						break;
					}
				} else if (hitEntity.type === EntityTypes.PROJECTILE) {
					if (entity.type !== EntityTypes.PROJECTILE) {
						if (entity.combatModel) {
							damageEntity(entity, hitEntity.projectileModel.damage);
						}
						if (!entities[hitEntity.index]) {
							console.log('nope');
						}
						removeEntity(hitEntity);
						break;
					}
				} else {
					const velocityReduction = wallNormal.scale(entity.velocity.inner(wallNormal));
					if (entity.collisionModel.mass && hitEntity.collisionModel.mass) {
						const massRatio = entity.collisionModel.mass / hitEntity.collisionModel.mass;
						hitEntity.velocity.addEquals(velocityReduction.scale(massRatio));
					}
					entity.velocity.subtractEquals(velocityReduction);
					deltaPosition.subtractEquals(wallNormal.scale(deltaPosition.inner(wallNormal)));
				}
			} else {
				break;
			}
		} else {
			break;
		}
	}
}

function collideWall(x, y, dx, dy, wx, wy1, wy2) {
	let hit = false;
	let t = 1.0;
	const epsilon = 0.0001;

	if (dx !== 0.0) {
		const nt = (wx - x) / dx;
		const ny = y + t * dy;
		if ((nt > 0.0) && (nt < t) && (((y >= wy1) && (y <= wy2)) || ((ny >= wy1) && (ny <= wy2)))) {
			hit = true;
			t = Math.max(0.0, nt - epsilon);
		}
	}

	return {hit, t};
}

function collideCircle(rp, dp, r) {
	let hit = false;
	let t = 1.0;
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
			wn = rp.add(dp.scale(t)).normalize();
			// wn = rp.normalize();
		}
	}

	return {hit, t, wn};
}

function intersects(e1, np, e2, log = false) {
	// const log_ = e1.type === EntityTypes.SPRITESHEET_MELEE_ATTACK && e2.type === EntityTypes.SPRITESHEET_MONSTER;
	if (e1 != e2 && e1.collisionModel && e2.collisionModel) {
		const rp = np.subtract(e2.position);
		const cornerMin = e1.collisionModel.cornerMin.add(e2.collisionModel.cornerMin);
		const cornerMax = e1.collisionModel.cornerMax.add(e2.collisionModel.cornerMax);
		
		const innerCornerMin = e1.collisionModel.innerCornerMin.add(e2.collisionModel.innerCornerMin);
		const innerCornerMax = e1.collisionModel.innerCornerMax.add(e2.collisionModel.innerCornerMax);
		const innerDiffX = Math.abs(innerCornerMin.x - innerCornerMax.x);
		const innerDiffY = Math.abs(innerCornerMin.y - innerCornerMax.y);
		const radius = e1.collisionModel.radius + e2.collisionModel.radius;
		const epsilon = 0.001;

		if (e2.repeatedModel) {
			const e2DiffX = Math.abs(e2.collisionModel.cornerMin.x - e2.collisionModel.cornerMax.x);
			const e2DiffY = Math.abs(e2.collisionModel.cornerMin.y - e2.collisionModel.cornerMax.y);
			const e2InnerDiffX = Math.abs(e2.collisionModel.innerCornerMin.x - e2.collisionModel.innerCornerMax.x);
			const e2InnerDiffY = Math.abs(e2.collisionModel.innerCornerMin.y - e2.collisionModel.innerCornerMax.y);
			if (e2.repeatedModel.direction.x < 0.0) {
				cornerMin.x -= (e2.repeatedModel.count - 1) * e2DiffX;
				innerCornerMin.x -= (e2.repeatedModel.count - 1) * e2InnerDiffX;
			} else if (e2.repeatedModel.direction.x > 0.0) {
				cornerMax.x += (e2.repeatedModel.count - 1) * e2DiffX;
				innerCornerMax.x += (e2.repeatedModel.count - 1) * e2InnerDiffX;
			}
			if (e2.repeatedModel.direction.y < 0.0) {
				cornerMin.y -= (e2.repeatedModel.count - 1) * e2DiffY;
				innerCornerMin.y -= (e2.repeatedModel.count - 1) * e2InnerDiffY;
			} else if (e2.repeatedModel.direction.y > 0.0) {
				cornerMax.y += (e2.repeatedModel.count - 1) * e2DiffY;
				innerCornerMax.y += (e2.repeatedModel.count - 1) * e2InnerDiffY;
			}
		}

		if (innerDiffX || innerDiffY) {
			if (radius) {
				if (rp.x >= cornerMin.x + epsilon && rp.x <= cornerMax.x - epsilon && rp.y >= innerCornerMin.y + epsilon && rp.y <= innerCornerMax.y - epsilon) {
					log && console.log('i bx', rp, cornerMin, cornerMax, innerCornerMin, innerCornerMax);
					return true;
				}
				if (rp.x >= innerCornerMin.x + epsilon && rp.x <= innerCornerMax.x - epsilon && rp.y >= cornerMin.y + epsilon && rp.y <= cornerMax.y - epsilon) {
					log && console.log('i by', rp, cornerMin, cornerMax, innerCornerMin, innerCornerMax);
					return true;
				}
			} else {
				if (rp.x >= cornerMin.x && rp.x <= cornerMax.x && rp.y >= cornerMin.y && rp.y <= cornerMax.y) {
					log && console.log('i b', rp, cornerMin, cornerMax);
					return true;
				}
			}
		}
		
		if (radius) {
			const radiusSqare = radius * radius;
			if (innerDiffX || innerDiffY) {
				const distTL = rp.subtract(new V3(innerCornerMin.x, innerCornerMax.y));
				if (distTL.lengthSquare() <= radiusSqare) {
					log && console.log('i tl', distTL, distTL.lengthSquare(), radiusSqare);
					return true;
				}
				const distTR = rp.subtract(innerCornerMax);
				if (distTR.lengthSquare() <= radiusSqare) {
					log && console.log('i tr', distTR, distTR.lengthSquare(), radiusSqare);
					return true;
				}
				const distBL = rp.subtract(innerCornerMin);
				if (distBL.lengthSquare() <= radiusSqare) {
					log && console.log('i bl', distBL, distBL.lengthSquare(), radiusSqare);
					return true;
				}
				const distBR = rp.subtract(new V3(innerCornerMax.x, innerCornerMin.y));
				if (distBR.lengthSquare() <= radiusSqare) {
					log && console.log('i br', distBR, distBR.lengthSquare(), radiusSqare);
					return true;
				}
			} else {
				if (rp.lengthSquare() <= radiusSqare) {
					log && console.log('i c', rp.lengthSquare(), radiusSqare);
					return true;
				}
			}
		}
		
	}
	return false;
}

function assert(condition, message) {
	if (!condition) {
		console.log(message);
	}
}
