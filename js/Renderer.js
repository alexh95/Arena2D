import {V3} from './Math.js';

export default class Renderer {

	constructor() {
		this.canvas = document.getElementById('canvas');
		this.context = canvas.getContext('2d');
		this.cameraPosition = new V3(0., 0., 0.);
		this.setSize();
	}

	setSize() {
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;
		this.context.imageSmoothingEnabled = false;
	}

	get size() {
		const result = new V3(this.canvas.width, this.canvas.height);
		return result;
	}

	save() {
		this.context.save();
	}

	restore() {
		this.context.restore();
	}

	clear() {
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
	}

	translate(position) {
		this.context.translate(position.x, position.y);
	}

	scale(scalar) {
		this.context.scale(scalar.x, scalar.y);
	}

	scaleCenter(scalar, center) {
		this.translate(center.negate());
		this.scale(scalar);
		this.translate(center);
	}

	drawImage(image, dst, dstSize) {
		this.context.drawImage(image, -dst.x, -dst.y, dstSize.x, dstSize.y);
	}

	drawSprite(image, src, srcSize, dst, dstSize) {
		this.context.drawImage(image, src.x, src.y, srcSize.x, srcSize.y, -dst.x, -dst.y, dstSize.x, dstSize.y);
	}

}
