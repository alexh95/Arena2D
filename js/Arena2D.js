class Renderer {

	constructor() {
		this.canvas = document.getElementById('canvas');
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;
		this.context = canvas.getContext('2d');
	}

}

class ImageStore {

	constructor() {
		this.images = [];
		this.imageLoadedCount = 0;
		this.imagesToLoad = 0;
	}

	loadImage(src) {
		++this.imagesToLoad;
		const image = new Image();
		const reference = this;
		image.onload = () => ++reference.imageLoadedCount;
		image.src = src;
		const index = this.images.length;
		this.images.push(image);
		return index;
	}

	isLoadingFinished() {
		return this.imageLoadedCount == this.imagesToLoad;
	}

}

class V3 {

	constructor(x, y, z) {
		this.x = x;
		this.y = y;
		this.z = z;
	}

}

const EntityTypes = Object.freeze({
	PLAYER: 0,
	WALL: 1,
	BALL: 2
});

class Entity {

	constructor(type, p, center) {
		this.type = type;
		this.p = p;
		this.center = center;
	}

}

const entityTypeToImage = {};
const entities = [];

let renderer = null;
let imageStore = null;

init();

function init() {
	console.log('Arena2D 0.0.3');

	renderer = new Renderer();
	imageStore = new ImageStore();
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

function loop() {
	// TODO(alex): test with request frame as the last instruction
	window.requestAnimationFrame(loop);

	renderer.context.clearRect(0, 0, renderer.canvas.width, renderer.canvas.height);

	for (const entity of entities) {
		renderer.context.save();
		renderer.context.translate(-entity.center.x, -entity.center.y);
		renderer.context.drawImage(imageStore.images[entityTypeToImage[entity.type]], entity.p.x, entity.p.y);
		renderer.context.restore();
	}
}
