export default class Renderer {

	constructor() {
		this.canvas = document.getElementById('canvas');
		this.context = canvas.getContext('2d');
		this.setSize();
	}

	setSize() {
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;
	}

}
