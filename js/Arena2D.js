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

let renderer = null;
let imageStore = null;

let ballIndex;

init();

function init() {
	console.log('Arena2D 0.0.2');

	renderer = new Renderer();
	imageStore = new ImageStore();
	ballIndex = imageStore.loadImage('res/ball.png');

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

	renderer.context.drawImage(imageStore.images[ballIndex], 200, 200);
}
