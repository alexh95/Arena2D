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
	entityTypeToImage[EntityTypes.WALL] = imageStore.loadImage('res/wall.png');
	entityTypeToImage[EntityTypes.BALL] = imageStore.loadImage('res/ball.png');
	entityTypeToImage[EntityTypes.ELLIPSE_2_1] = imageStore.loadImage('res/ellipse_2_1.png');
	entityTypeToImage[EntityTypes.ELLIPSE_4_1] = imageStore.loadImage('res/ellipse_4_1.png');
	entityTypeToImage[EntityTypes.ELLIPSE_1_2] = imageStore.loadImage('res/ellipse_1_2.png');
	entityTypeToImage[EntityTypes.ELLIPSE_1_4] = imageStore.loadImage('res/ellipse_1_4.png');

	const wallTL = new Entity(EntityTypes.WALL, new V3(-8., 4.5), new V3(tileSizeMeters, tileSizeMeters), new V3(0., 0.), new V3(0.5, 0.5));
	const wallTR = new Entity(EntityTypes.WALL, new V3(8., 4.5), new V3(tileSizeMeters, tileSizeMeters), new V3(0., 0.), new V3(0.5, 0.5));
	const wallBL = new Entity(EntityTypes.WALL, new V3(8., -4.5), new V3(tileSizeMeters, tileSizeMeters), new V3(0., 0.), new V3(0.5, 0.5));
	const wallBR = new Entity(EntityTypes.WALL, new V3(-8., -4.5), new V3(tileSizeMeters, tileSizeMeters), new V3(0., 0.), new V3(0.5, 0.5));
	const wallM = new Entity(EntityTypes.WALL, new V3(0., 0.), new V3(tileSizeMeters, tileSizeMeters), new V3(0., 0.), new V3(0.5, 0.5));
	const ballM = new Entity(EntityTypes.ELLIPSE_2_1, new V3(0., 0.), new V3(0., 0.), new V3(tileSizeMeters, 0.5 * tileSizeMeters), new V3(0.5, 0.5));
	player = new Entity(EntityTypes.ELLIPSE_2_1, new V3(-5., -5.), new V3(0., 0.), new V3(tileSizeMeters, 0.5 * tileSizeMeters), new V3(0.5, 0.5));

	// entities.push(wallTL);
	// entities.push(wallTR);
	// entities.push(wallBL);
	// entities.push(wallBR);
	// entities.push(wallM);
	entities.push(ballM);
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

	const acceleration = direction.scale(speed).subtract(entity.velocity.scale(2.));
	let deltaPosition = entity.velocity.scale(dt).add(acceleration.scale(0.5 * dt * dt));
	entity.velocity = entity.velocity.add(acceleration.scale(dt));

	for (let collisionIndex = 0; collisionIndex < 4; ++collisionIndex) {
		let hit = false;
		let tMin = 1.;
		let wallNormal = new V3(0., 0.);

		entities.forEach((e, index) => {
			if (e != entity) {
				if (e.type === EntityTypes.WALL) {
					const wallCornerMin = entity.size.add(e.size).scale(-0.5);
					const wallCornerMax = entity.size.add(e.size).scale(0.5);
					const relativePosition = entity.position.subtract(e.position);
					// Left wall
					const collisionLeft = collideWall(relativePosition.x, relativePosition.y, deltaPosition.x, deltaPosition.y, wallCornerMin.x, wallCornerMin.y, wallCornerMax.y, tMin);
					if (collisionLeft.hit) {
						hit = true;
						tMin = collisionLeft.t;
						wallNormal = new V3(-1., 0.);
					}
					// Right wall
					const collisionRight = collideWall(relativePosition.x, relativePosition.y, deltaPosition.x, deltaPosition.y, wallCornerMax.x, wallCornerMin.y, wallCornerMax.y, tMin);
					if (collisionRight.hit) {
						hit = true;
						tMin = collisionRight.t;
						wallNormal = new V3(1., 0.);
					}
					// Bottom wall
					const collisionBottom = collideWall(relativePosition.y, relativePosition.x, deltaPosition.y, deltaPosition.x, wallCornerMin.y, wallCornerMin.x, wallCornerMax.x, tMin);
					if (collisionBottom.hit) {
						hit = true;
						tMin = collisionBottom.t;
						wallNormal = new V3(0., -1.);
					}
					// Top wall
					const collisionTop = collideWall(relativePosition.y, relativePosition.x, deltaPosition.y, deltaPosition.x, wallCornerMax.y, wallCornerMin.x, wallCornerMax.x, tMin);
					if (collisionTop.hit) {
						hit = true;
						tMin = collisionTop.t;
						wallNormal = new V3(0., 1.);
					}
				} else if (e.type === EntityTypes.BALL || e.type === EntityTypes.ELLIPSE_2_1) {
					const ballRadius = entity.radius.add(e.radius);
					const relativePosition = entity.position.subtract(e.position);
					const denominator = ballRadius.y * ballRadius.y * deltaPosition.x * deltaPosition.x + ballRadius.x * ballRadius.x * deltaPosition.y * deltaPosition.y;
					const innerDifference = relativePosition.x * deltaPosition.y - relativePosition.y * deltaPosition.x;
					const squaredInnerDifference = innerDifference * innerDifference;
					const deltaSquared = denominator - squaredInnerDifference;
			      	if (deltaSquared >= 0. && Math.abs(denominator) > 0) {
			      		const delta = ballRadius.x * ballRadius.y * Math.sqrt(deltaSquared);
			      		const numeratorPart = -(ballRadius.y * ballRadius.y * relativePosition.x * deltaPosition.x + ballRadius.x * ballRadius.x * relativePosition.y * deltaPosition.y);
			      		const t1 = (numeratorPart + delta) / denominator;
			      		const t2 = (numeratorPart - delta) / denominator;
			      		const tMin12 = Math.min((t1 < 0.) ? tMin : t1, (t2 < 0.) ? tMin : t2);
			      		if (tMin12 < 1. && tMin12 < tMin) {
				      		console.log(t1, t2, tMin12);
				      		hit = true;
				      		tMin = Math.max(0., tMin12 - 0.0001);
							const newPosition = relativePosition.add(deltaPosition.scale(tMin));
				      		wallNormal = newPosition.normalize();	
			      		}
			      	}
				}
			}
		});

		entity.position = entity.position.add(deltaPosition.scale(tMin));

		if (hit) {
			console.log('normal', wallNormal, tMin);
			console.log('before', entity.velocity, deltaPosition);
			entity.velocity = entity.velocity.subtract(wallNormal.scale(entity.velocity.inner(wallNormal)));
			deltaPosition = deltaPosition.subtract(wallNormal.scale(deltaPosition.inner(wallNormal)));
			console.log('after', entity.velocity, deltaPosition);
		} else {
			break;
		}
	}

	entities.forEach((e, index) => {
			if (e != entity) {
				if (entity.position.x + 0.5 * entity.size.x >= e.position.x - 0.5 * e.size.x &&
					entity.position.x - 0.5 * entity.size.x <= e.position.x + 0.5 * e.size.x &&
					entity.position.y + 0.5 * entity.size.y >= e.position.y - 0.5 * e.size.y &&
					entity.position.y - 0.5 * entity.size.y <= e.position.y + 0.5 * e.size.y) {
					insideNew = true;
				}
			}
		});

	if (insideOld !== insideNew) {
		// console.log('nope', entity.position.x, entity.position.y);
	}
	insideOld = insideNew;
}

function collideWall(x, y, dx, dy, wx, wy1, wy2, tMin) {
	let hit = false;
	let t = 1.;
	const epsilon = 0.0001;

	if (dx !== 0.) {
		const nt = (wx - x) / dx;
		const ny = y + tMin * dy;
		if ((nt >= 0.) && (nt < tMin) && (y >= wy1) && (y <= wy2) && (ny >= wy1) && (ny <= wy2)) {
			hit = true;
			t = Math.max(0., nt - epsilon);
		}
	}

	const log = `${hit}, ${t}, ${dx} != 0 <= ${(wx - x) / dx} <= ${tMin} && ${wy1} <= ${y + tMin * dy} <= ${wy2}`;
	return {hit, t, log};
}

function collideBall() {

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
		const fullSize = entity.size.add(entity.radius.scale(2));
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
