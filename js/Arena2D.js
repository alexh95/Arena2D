import Renderer from './Renderer.js';
import ImageStore from './ImageStore.js';
import {V3} from './Math.js';
import {Entity, EntityTypes, entities, entityTypeToImage} from './Entity.js';
import {nameVersionDisplay} from './Constants.js';

const renderer = new Renderer();
const imageStore = new ImageStore();

export default function start() {
	console.log(nameVersionDisplay);

	window.addEventListener('resize', (event) => renderer.setSize());

	entityTypeToImage[EntityTypes.WALL] = imageStore.loadImage('res/wall.png');
	entityTypeToImage[EntityTypes.BALL] = imageStore.loadImage('res/ball.png');

	const wall1 = new Entity(EntityTypes.WALL, new V3(128, 128, 0), new V3(128, 128, 0));
	const wall2 = new Entity(EntityTypes.WALL, new V3(renderer.canvas.width - 128, 128, 0), new V3(128, 128, 0));
	const ball = new Entity(EntityTypes.BALL, new V3(250, 250, 0), new V3(128, 128, 0));
	
	entities.push(wall1);
	entities.push(wall2);
	entities.push(ball);

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
const fpsTarget = 60;

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
	const dt = (1000 / msDelta) / fpsTarget;

	draw();
}

function draw() {
	renderer.context.clearRect(0, 0, renderer.canvas.width, renderer.canvas.height);

	for (const entity of entities) {
		renderer.context.save();
		renderer.context.translate(-entity.center.x, -entity.center.y);
		const image = imageStore.images[entityTypeToImage[entity.type]];
		renderer.context.drawImage(image, entity.p.x, entity.p.y);
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
	renderer.context.fillText('Resolution: ' + renderer.canvas.width + ' x ' + renderer.canvas.height, 5, 30);
	renderer.context.fillText('FPS: ' + fps.toString().substring(0, 2), 5, 60);
	// renderer.context.fillText('the quick brown fox jumps over the lazy dog', 5, 90);
	// renderer.context.fillText('the quick brown fox jumps over the lazy dog', 5, 120);
	// renderer.context.fillText('the quick brown fox jumps over the lazy dog', 5, 150);
	// renderer.context.fillText('the quick brown fox jumps over the lazy dog', 5, 180);

	const nameVersionDisplayTextMetrics = renderer.context.measureText(nameVersionDisplay);
	renderer.context.fillText(nameVersionDisplay, renderer.canvas.width - nameVersionDisplayTextMetrics.width - 5, renderer.canvas.height - 5);
}
