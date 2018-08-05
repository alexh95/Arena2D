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
	}

}
