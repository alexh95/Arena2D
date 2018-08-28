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

	const wallTL = new Entity(EntityTypes.WALL, new V3(-8., 4.5), new V3(tileSizeMeters, tileSizeMeters), new V3(0.5, 0.5));
	const wallTR = new Entity(EntityTypes.WALL, new V3(8., 4.5), new V3(tileSizeMeters, tileSizeMeters), new V3(0.5, 0.5));
	const wallBL = new Entity(EntityTypes.WALL, new V3(8., -4.5), new V3(tileSizeMeters, tileSizeMeters), new V3(0.5, 0.5));
	const wallBR = new Entity(EntityTypes.WALL, new V3(-8., -4.5), new V3(tileSizeMeters, tileSizeMeters), new V3(0.5, 0.5));
	const wallM = new Entity(EntityTypes.WALL, new V3(-4., 0.), new V3(tileSizeMeters, tileSizeMeters), new V3(0.5, 0.5));
	player = new Entity(EntityTypes.PLAYER, new V3(0., 0.), new V3(tileSizeMeters, tileSizeMeters), new V3(0.5, 0.5));
	
	entities.push(wallTL);
	entities.push(wallTR);
	entities.push(wallBL);
	entities.push(wallBR);
	entities.push(wallM);
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
		fps = 1000 / (sum / msDeltaMax);
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
		direction.x -= 1.0;
	}
	if (keys[Keys.D]) {
		direction.x += 1.0;
	}
	if (keys[Keys.W]) {
		direction.y += 1.0;
	}
	if (keys[Keys.S]) {
		direction.y -= 1.0;
	}

	direction.normalizeEquals();	

	moveEntity(dt, player, speed, direction);
}

function moveEntity(dt, entity, speed, direction) {
	const acceleration = direction.scale(speed).subtract(entity.velocity.scale(8.));
	const newVelocity = entity.velocity.add(acceleration.scale(dt));

	const deltaPosition = entity.velocity.scale(dt).add(acceleration.scale(0.5 * dt * dt));
	const newPosition = entity.position.add(deltaPosition);

	const deltaLength = deltaPosition.length();

	let hit = false;
	entities.forEach((e, index) => {
		if (e != entity) {
			const tr = e.position.add(e.size.scale(0.5));
			const bl = e.position.subtract(e.size.scale(0.5));
			const d = (newPosition.x - 0.5 * entity.size.x - tr.x) / deltaLength;
			if (0 <= d && d <= 1.) {
				console.log(d);
			}
		}
	});

	entity.velocity = newVelocity;
	entity.position = newPosition;	
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
		const scalar = new V3(tileSizePixels / image.width, tileSizePixels / image.height);
		renderer.scale(scalar);
		renderer.scaleCenter(new V3(scale, scale), position);
		const imageCenterDelta = entity.size.multiply(entity.center).scale(metersToPixels).negate();
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
	const center = new V3(
		0.5 * renderer.canvas.width + (renderer.canvas.width % 2 == 0 ? 0.5 : 0),
		0.5 * renderer.canvas.height + (renderer.canvas.height % 2 == 0 ? 0.5 : 0),
		0.);
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

	const playerSpeedText = `Player Speed (${displayText(player.velocity.x, 2, 0.01, true)},${displayText(player.velocity.y, 2, 0.01, true)})`;
	const playerSpeedTextMetrics = renderer.context.measureText(playerSpeedText);
	renderer.context.fillText(playerSpeedText, renderer.canvas.width - playerSpeedTextMetrics.width - 5, 60);

	// Bottom Rignt
	const nameVersionDisplayTextMetrics = renderer.context.measureText(nameVersionDisplay);
	renderer.context.fillText(nameVersionDisplay, renderer.canvas.width - nameVersionDisplayTextMetrics.width - 5, renderer.canvas.height - 5);
}
