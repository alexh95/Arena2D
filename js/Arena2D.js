import Renderer from './Renderer.js';
import ImageStore from './ImageStore.js';
import {V3, displayText} from './Math.js';
import {Entity, EntityTypes, entities, entityTypeToImage} from './Entity.js';
import {Keys, nameVersionDisplay} from './Constants.js';

const renderer = new Renderer();
const imageStore = new ImageStore();

const tileSizeMeters = 1.;
const tileSizePixels = 64;
const metersToPixels = tileSizePixels / tileSizeMeters;
let scale = 1;

const keys = new Array(256).fill(false);

let player = null;

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

	entityTypeToImage[EntityTypes.PLAYER] = imageStore.loadImage('res/player.png');
	entityTypeToImage[EntityTypes.SMALL_SQUARE] = imageStore.loadImage('res/small_square.png');
	entityTypeToImage[EntityTypes.SMALL_CIRCLE] = imageStore.loadImage('res/small_circle.png');
	entityTypeToImage[EntityTypes.SMALL_ROUNDED_SQUARE] = imageStore.loadImage('res/small_rounded_square.png');
	entityTypeToImage[EntityTypes.MEDIUM_ROUNDED_SQUARE] = imageStore.loadImage('res/medium_rounded_square.png');
	entityTypeToImage[EntityTypes.LARGE_ROUNDED_SQUARE] = imageStore.loadImage('res/large_rounded_square.png');

	const wallTL = new Entity(EntityTypes.SMALL_SQUARE, new V3(-0.95 * tileSizeMeters, 4.5), new V3(tileSizeMeters, tileSizeMeters), 0., new V3(0.5, 0.5));
	const wallTR = new Entity(EntityTypes.SMALL_SQUARE, new V3(0.95 * tileSizeMeters, 4.5), new V3(tileSizeMeters, tileSizeMeters), 0., new V3(0.5, 0.5));
	const wallBL = new Entity(EntityTypes.SMALL_SQUARE, new V3(8., -4.5), new V3(tileSizeMeters, tileSizeMeters), 0., new V3(0.5, 0.5));
	const wallBR = new Entity(EntityTypes.SMALL_SQUARE, new V3(-8., -4.5), new V3(tileSizeMeters, tileSizeMeters), 0., new V3(0.5, 0.5));
	const wallM = new Entity(EntityTypes.SMALL_SQUARE, new V3(0., 0.), new V3(tileSizeMeters, tileSizeMeters), 0., new V3(0.5, 0.5));
	const ballM = new Entity(EntityTypes.LARGE_ROUNDED_SQUARE, new V3(0., 0.), new V3(2. * tileSizeMeters, 2. * tileSizeMeters), tileSizeMeters, new V3(0.5, 0.5));
	const ballBL = new Entity(EntityTypes.SMALL_CIRCLE, new V3(-0.95 * tileSizeMeters, -4.5), new V3(0., 0.), 0.5 * tileSizeMeters, new V3(0.5, 0.5));
	const ballBR = new Entity(EntityTypes.SMALL_CIRCLE, new V3(0.95 * tileSizeMeters, -4.5), new V3(0., 0.), 0.5 * tileSizeMeters, new V3(0.5, 0.5));
	player = new Entity(EntityTypes.PLAYER, new V3(2.5, 2.5), new V3(tileSizeMeters, tileSizeMeters), 0., new V3(0.5, 0.5));
	// player = new Entity(EntityTypes.SMALL_CIRCLE, new V3(2.5, 2.5), new V3(0., 0.), 0.5 * tileSizeMeters, new V3(0.5, 0.5));
	// player = new Entity(EntityTypes.SMALL_ROUNDED_SQUARE, new V3(3., 0.), new V3(0.5 * tileSizeMeters, 0.5 * tileSizeMeters), 0.25 * tileSizeMeters, new V3(0.5, 0.5));

	entities.push(wallTL);
	entities.push(wallTR);
	// entities.push(wallBL);
	// entities.push(wallBR);
	// entities.push(wallM);
	entities.push(ballM);
	entities.push(ballBL);
	entities.push(ballBR);
	entities.push(player);

	startLoop();
}

function startLoop() {
	if (imageStore.isLoadingFinished()) {
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
	const speed = 50.;
	const direction = new V3();

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
	// direction.x = 1.;
	// direction.y = 1.;

	direction.normalizeEquals();

	moveEntity(dt, player, speed, direction);
}

let insideOld = false;

function moveEntity(dt, entity, speed, direction) {
	let insideNew = false;

	const acceleration = direction.scale(speed).subtract(entity.velocity.scale(8.));
	let deltaPosition = entity.velocity.scale(dt).add(acceleration.scale(0.5 * dt * dt));
	entity.velocity = entity.velocity.add(acceleration.scale(dt));

	for (let collisionIndex = 0; collisionIndex < 4; ++collisionIndex) {
		let hit = false;
		let tMin = 1.;
		let wallNormal = new V3(0., 0.);

		entities.forEach((e, index) => {
			if (e != entity) {
				const relativePosition = entity.position.subtract(e.position);
				const cornerMin = entity.size.add(e.size).scale(-0.5);
				const cornerMax = entity.size.add(e.size).scale(0.5);
				const radius = e.radius + entity.radius;
				if (cornerMin.x) {
					// Left wall
					const collisionLeft = collideWall(relativePosition.x, relativePosition.y, deltaPosition.x, deltaPosition.y, cornerMin.x - radius, cornerMin.y, cornerMax.y, tMin);
					if (collisionLeft.hit && tMin > collisionLeft.t) {
						hit = true;
						tMin = collisionLeft.t;
						wallNormal = new V3(-1., 0.);
						console.log('hit left');
					}
					// Right wall
					const collisionRight = collideWall(relativePosition.x, relativePosition.y, deltaPosition.x, deltaPosition.y, cornerMax.x + radius, cornerMin.y, cornerMax.y, tMin);
					if (collisionRight.hit && tMin > collisionRight.t) {
						hit = true;
						tMin = collisionRight.t;
						wallNormal = new V3(1., 0.);
						console.log('hit right');
					}
					// Bottom wall
					const collisionBottom = collideWall(relativePosition.y, relativePosition.x, deltaPosition.y, deltaPosition.x, cornerMin.y - radius, cornerMin.x, cornerMax.x, tMin);
					if (collisionBottom.hit && tMin > collisionBottom.t) {
						hit = true;
						tMin = collisionBottom.t;
						wallNormal = new V3(0., -1.);
						console.log('hit bottom');
					}
					// Top wall
					const collisionTop = collideWall(relativePosition.y, relativePosition.x, deltaPosition.y, deltaPosition.x, cornerMax.y + radius, cornerMin.x, cornerMax.x, tMin);
					if (collisionTop.hit && tMin > collisionTop.t) {
						hit = true;
						tMin = collisionTop.t;
						wallNormal = new V3(0., 1.);
						console.log('hit top');
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
							console.log('hit tl');
						}
						// Top Right Circle
						const collisionTopRight = collideCircle(relativePosition.subtract(cornerMax), deltaPosition, radius);
						if (collisionTopRight.hit && tMin > collisionTopRight.t) {
							hit = true;
							tMin = collisionTopRight.t;
							wallNormal = collisionTopRight.wn;
							console.log('hit tr');
						}
						// Bottom Left Circle
						const collisionBottomLeft = collideCircle(relativePosition.subtract(cornerMin), deltaPosition, radius);
						if (collisionBottomLeft.hit && tMin > collisionBottomLeft.t) {
							hit = true;
							tMin = collisionBottomLeft.t;
							wallNormal = collisionBottomLeft.wn;
							console.log('hit bl');
						}
						// Bottom Right Circle
						const collisionBottomRight = collideCircle(relativePosition.subtract(new V3(cornerMax.x, cornerMin.y)), deltaPosition, radius);
						if (collisionBottomRight.hit && tMin > collisionBottomRight.t) {
							hit = true;
							tMin = collisionBottomRight.t;
							wallNormal = collisionBottomRight.wn;
							console.log('hit br');
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
			}
		});

		const newPosition = entity.position.add(deltaPosition.scale(tMin));
		const moveValid = entities.map((e) => entity == e || !intersects(entity, newPosition, e)).reduce((a, b) => a && b);

		if (moveValid) {
			entity.position = newPosition;
			if (hit) {
				entity.velocity = entity.velocity.subtract(wallNormal.scale(entity.velocity.inner(wallNormal)));
				deltaPosition = deltaPosition.subtract(wallNormal.scale(deltaPosition.inner(wallNormal)));
			} else {
				break;
			}
		} else {
			break;
		}
	}

	/*entities.forEach((e, index) => {
		if (e != entity) {
			if (entity.position.x + 0.5 * entity.size.x >= e.position.x - 0.5 * e.size.x &&
				entity.position.x - 0.5 * entity.size.x <= e.position.x + 0.5 * e.size.x &&
				entity.position.y + 0.5 * entity.size.y >= e.position.y - 0.5 * e.size.y &&
				entity.position.y - 0.5 * entity.size.y <= e.position.y + 0.5 * e.size.y) {
				insideNew = true;
				console.log('nope r', index);
			}
			const radius = entity.radius + e.radius;
			if (entity.position.subtract(e.position).length() <= radius) {
				insideNew = true;
				console.log('nope c', index);
			}
		}
	});

	if (insideOld !== insideNew) {
		console.log('nope', entity.position.x, entity.position.y);
	}
	insideOld = insideNew;*/
}

function intersects(e1, np, e2) {
	if (e1 != e2) {
		const rp = np.subtract(e2.position);
		const sizeX = e1.size.x + e2.size.x;
		const sizeY = e1.size.x + e2.size.x;
		const radius = e1.radius + e2.radius;
		const epsilon = 0.001;

		if (sizeX) {
			if (radius) {
				const boxMin1 = new V3(sizeX + 2 * radius, sizeY - epsilon).scale(-0.5);
				const boxMax1 = new V3(sizeX + 2 * radius, sizeY - epsilon).scale(0.5);
				if (rp.x >= boxMin1.x && rp.x <= boxMax1.x && rp.y >= boxMin1.y && rp.y <= boxMax1.y) {
					console.log('i bx', rp, boxMin1, boxMax1);
					// return true;
				}
				const boxMin2 = new V3(sizeX - epsilon, sizeY + 2 * radius).scale(-0.5);
				const boxMax2 = new V3(sizeX - epsilon, sizeY + 2 * radius).scale(0.5);
				if (rp.x >= boxMin2.x && rp.x <= boxMax2.x && rp.y >= boxMin2.y && rp.y <= boxMax2.y) {
					console.log('i by');
					// return true;
				}
			} else {
				const boxMin = new V3(sizeX, sizeY).scale(-0.5);
				const boxMax = new V3(sizeX, sizeY).scale(0.5);
				if (rp.x >= boxMin.x && rp.x <= boxMax.x && rp.y >= boxMin.y && rp.y <= boxMax.y) {
					console.log('i b');
					// return true;
				}
			}
		}
		
		if (radius) {
			const radiusSqare = radius * radius;
			if (sizeX) {
				const rpTL = rp.add(new V3(-0.5 * sizeX, 0.5 * sizeY));
				if (rpTL.lengthSquare() <= radiusSqare) {
					console.log('i tl');
					return true;
				}
				const rpTR = rp.add(new V3(0.5 * sizeX, 0.5 * sizeY));
				if (rpTR.lengthSquare() <= radiusSqare) {
					console.log('i tr');
					return true;
				}
				const rpBL = rp.add(new V3(-0.5 * sizeX, -0.5 * sizeY));
				if (rpBL.lengthSquare() <= radiusSqare) {
					console.log('i bl');
					return true;
				}
				const rpBR = rp.add(new V3(0.5 * sizeX, -0.5 * sizeY));
				if (rpBR.lengthSquare() <= radiusSqare) {
					console.log('i br');
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
		if ((nt >= 0.) && (nt < t) && (y >= wy1) && (y <= wy2) && (ny >= wy1) && (ny <= wy2)) {
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
			t = Math.max(0, tFinal - epsilon);
			wn = rp.add(dp.scale(t)).normalize();
		}
	}

	return {hit, t, wn};
}

function draw() {
	renderer.clear();

	entities.forEach((entity) => { 
		renderer.save();
		renderer.translate(renderer.size.scale(0.5));
		const cameraPosition = renderer.cameraPosition.scale(metersToPixels);
		renderer.translate(cameraPosition);
		const position = entity.position.multiply(new V3(1., -1.)).scale(metersToPixels);
		renderer.translate(position);
		const image = imageStore.images[entityTypeToImage[entity.type]];
		const fullSize = entity.size.add(new V3(entity.radius, entity.radius).scale(2));
		const scalar = new V3(image.width / tileSizePixels, image.height / tileSizePixels).divide(fullSize);
		renderer.scale(scalar);
		renderer.scaleCenter(new V3(scale, scale), position);
		const imageCenterDelta = fullSize.multiply(entity.center).scale(metersToPixels).negate();
		renderer.drawImage(image, imageCenterDelta);
		renderer.restore();
	});

	debugDraw();
}

function debugDraw() {
	renderer.context.lineWidth = '1';
	renderer.context.strokeStyle = 'rgb(255,0,0)';
	renderer.context.fillStyle = 'rgb(255,0,0)';
	renderer.context.font = '30px courier';

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
	// renderer.context.fillText('the quick brown fox jumps over the lazy dog', 5, 120);
	// renderer.context.fillText('the quick brown fox jumps over the lazy dog', 5, 150);
	// renderer.context.fillText('the quick brown fox jumps over the lazy dog', 5, 180);

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
