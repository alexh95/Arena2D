const renderer = {};
init();

function init() {
	console.log('Arena2D 0.0.1');

	renderer.canvas = document.getElementById('canvas');
	renderer.canvas.width = window.innerWidth;
	renderer.canvas.height = window.innerHeight;
	renderer.context = canvas.getContext('2d');

	loop();
}

function loop() {
	window.requestAnimationFrame(loop);

	renderer.context.clearRect(0, 0, renderer.canvas.width, renderer.canvas.height);
}
