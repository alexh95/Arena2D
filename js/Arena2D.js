import Renderer from './Renderer.js';
import ImageStore from './ImageStore.js';
import {V3} from './Math.js';
import {Entity, EntityTypes, entities, entityTypeToImage} from './Entity.js';
import {nameVersionDisplay} from './Constants.js';

const renderer = new Renderer();
const imageStore = new ImageStore();

const tileSizeMeters = 1.;
const tileSizePixels = 64;
const metersToPixels = tileSizePixels / tileSizeMeters;

const keys = new Array(256).fill(false);

let player = null;

export default function start() {
	console.log(nameVersionDisplay);

	window.addEventListener('resize', (event) => renderer.setSize());
	window.addEventListener('keydown', (event) => {
		keys[event.keyCode] = true;
	});
	window.addEventListener('keyup', (event) => {
		keys[event.keyCode] = false;
	});

	entityTypeToImage[EntityTypes.WALL] = imageStore.loadImage('res/wall.png');
	entityTypeToImage[EntityTypes.BALL] = imageStore.loadImage('res/ball.png');

	const wall1 = new Entity(EntityTypes.WALL, new V3(-8., -4.5, 0.), new V3(tileSizeMeters, tileSizeMeters, 0.), new V3(0.5 * tileSizeMeters, 0.5 * tileSizeMeters, 0.));
	const wall2 = new Entity(EntityTypes.WALL, new V3(8., -4.5, 0.), new V3(tileSizeMeters, tileSizeMeters, 0.), new V3(0.5 * tileSizeMeters, 0.5 * tileSizeMeters, 0.));
	const wall3 = new Entity(EntityTypes.WALL, new V3(-8., 4.5, 0.), new V3(tileSizeMeters, tileSizeMeters, 0.), new V3(0.5 * tileSizeMeters, 0.5 * tileSizeMeters, 0.));
	const wall4 = new Entity(EntityTypes.WALL, new V3(8., 4.5, 0.), new V3(tileSizeMeters, tileSizeMeters, 0.), new V3(0.5 * tileSizeMeters, 0.5 * tileSizeMeters, 0.));
	const ball = new Entity(EntityTypes.BALL, new V3(0., 0., 0.), new V3(tileSizeMeters, tileSizeMeters, 0.), new V3(0.5 * tileSizeMeters, 0.5 * tileSizeMeters, 0.));
	
	entities.push(wall1);
	entities.push(wall2);
	entities.push(wall3);
	entities.push(wall4);
	entities.push(ball);

	player = ball;

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
	const direction = new V3(0., 0., 0.);

	if (keys[65]) {
		direction.x -= 1.0;
	}
	if (keys[68]) {
		direction.x += 1.0;
	}
	if (keys[87]) {
		direction.y -= 1.0;
	}
	if (keys[83]) {
		direction.y += 1.0;
	}

	const acceleration = direction.scale(speed).subtract(player.velocity.scale(8.));
	const deltaPosition = player.velocity.scale(dt).add(acceleration.scale(0.5 * dt * dt));
	player.velocity.addEquals(acceleration.scale(dt));
	player.position.addEquals(deltaPosition);
}

function draw() {
	renderer.context.clearRect(0, 0, renderer.canvas.width, renderer.canvas.height);

	for (const entity of entities) {
		renderer.context.save();
		renderer.context.translate(0.5 * renderer.canvas.width, 0.5 * renderer.canvas.height);
		const cameraPosition = renderer.cameraPosition.scale(metersToPixels);
		renderer.context.translate(cameraPosition.x, cameraPosition.y);
		const position = entity.position.subtract(entity.center).scale(metersToPixels);
		renderer.context.translate(position.x, position.y);
		const image = imageStore.images[entityTypeToImage[entity.type]];
		renderer.context.drawImage(image, 0, 0);
		renderer.context.restore();
	}

	debugDraw();
}

function debugDraw() {
	renderer.context.lineWidth = '1';
	renderer.context.strokeStyle = 'rgb(255,0,0)';
	renderer.context.fillStyle = 'rgb(255,0,0)';
	renderer.context.font = '30px courier';

	renderer.context.strokeRect(0.5, 0.5, renderer.canvas.width - 1, renderer.canvas.height - 1);
	const center = new V3(
		0.5 * renderer.canvas.width + (renderer.canvas.width % 2 == 0 ? 0.5 : 0),
		0.5 * renderer.canvas.height + (renderer.canvas.height % 2 == 0 ? 0.5 : 0),
		0.);
	renderer.context.strokeRect(center.x, center.y - 32, 0, 64);
	renderer.context.strokeRect(center.x - 32, center.y, 64, 0);

	renderer.context.fillText('Resolution: ' + renderer.canvas.width + ' x ' + renderer.canvas.height, 10, 30);
	renderer.context.fillText('FPS: ' + fps.toString().substring(0, fps.toString().indexOf('.')), 10, 60);
	const keysPressed = keys.map((value, index) => value ? String.fromCharCode(index) + ' ' + index : 0).filter((value) => value);
	renderer.context.fillText(keysPressed, 10, 90);
	// renderer.context.fillText('the quick brown fox jumps over the lazy dog', 5, 120);
	// renderer.context.fillText('the quick brown fox jumps over the lazy dog', 5, 150);
	// renderer.context.fillText('the quick brown fox jumps over the lazy dog', 5, 180);

	const nameVersionDisplayTextMetrics = renderer.context.measureText(nameVersionDisplay);
	renderer.context.fillText(nameVersionDisplay, renderer.canvas.width - nameVersionDisplayTextMetrics.width - 5, renderer.canvas.height - 5);
}
