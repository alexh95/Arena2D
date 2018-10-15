import {V3} from './Math.js';

export default class Renderer {

	constructor() {
		this.canvas2d = document.getElementById('canvas-2d');
		this.context2d = this.canvas2d.getContext('2d');
		this.canvasGl = document.getElementById('canvas-webgl');
		this.gl = this.canvasGl.getContext('webgl');

		this.cameraPosition = new V3();
		this.setSize();
	}

	setSize() {
		this.canvas2d.width = window.innerWidth;
		this.canvas2d.height = window.innerHeight;
		this.context2d.imageSmoothingEnabled = false;
		this.canvasGl.width = window.innerWidth;
		this.canvasGl.height = window.innerHeight;
	}

	get size() {
		const result = new V3(this.canvas2d.width, this.canvas2d.height);
		return result;
	}

	save() {
		this.context2d.save();
	}

	restore() {
		this.context2d.restore();
	}

	clear() {
		this.context2d.clearRect(0, 0, this.canvas2d.width, this.canvas2d.height);
	}

	translate(position) {
		this.context2d.translate(position.x, position.y);
	}

	scale(scalar) {
		this.context2d.scale(scalar.x, scalar.y);
	}

	scaleCenter(scalar, center) {
		this.translate(center.negate());
		this.scale(scalar);
		this.translate(center);
	}

	drawImage(image, dst, dstSize) {
		this.context2d.drawImage(image, -dst.x, -dst.y, dstSize.x, dstSize.y);
	}

	drawSprite(image, src, srcSize, dst, dstSize) {
		this.context2d.drawImage(image, src.x, src.y, srcSize.x, srcSize.y, -dst.x, -dst.y, dstSize.x, dstSize.y);
		// this.context.drawImage(image, 0, 32, 16, 32, -16, -48, 32, 64);
		// this.context.drawImage(image, 0, 0, 16, 32, -8, -24, 16, 32);
	}

}
