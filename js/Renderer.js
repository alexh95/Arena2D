import {V3} from './Math.js';
import vertexShaderCode from './shaders/VertexShader.js';
import fragmentShaderCode from './shaders/FragmentShader.js';

export default class Renderer {

	constructor() {
		this.context2d = document.getElementById('canvas-2d').getContext('2d');
		this.gl = document.getElementById('canvas-webgl').getContext('webgl');

		this.cameraPosition = new V3();
		this.setSize();
		this.initWebGL();
	}

	setSize() {
		this.context2d.canvas.width = window.innerWidth;
		this.context2d.canvas.height = window.innerHeight;
		this.context2d.imageSmoothingEnabled = false;
		this.gl.canvas.width = window.innerWidth;
		this.gl.canvas.height = window.innerHeight;
		this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
	}

	get size() {
		const result = new V3(this.gl.canvas.width, this.gl.canvas.height);
		return result;
	}

	save() {
		this.context2d.save();
	}

	restore() {
		this.context2d.restore();
	}

	clear() {
		this.context2d.clearRect(0, 0, this.context2d.canvas.width, this.context2d.canvas.height);
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
	}

	// WebGL
	initWebGL() {
		this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);
		const shaderProgram = this.initShaderProgram(vertexShaderCode, fragmentShaderCode);
		this.programInfo = {
			shaderProgram,
			attribLocations: {
				vertexPosition: this.gl.getAttribLocation(shaderProgram, 'vertexPosition'),
				textureCoordinate: this.gl.getAttribLocation(shaderProgram, 'textureCoordinate')
			},
			uniformLocations: {
				projectionMatrix: this.gl.getUniformLocation(shaderProgram, 'projectionMatrix'),
				modelViewMatrix: this.gl.getUniformLocation(shaderProgram, 'modelViewMatrix'),
				sampler: this.gl.getUniformLocation(shaderProgram, 'sampler'),
			}
		}

		const vertexPositionBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexPositionBuffer);
		const vertexPositionData = new Float32Array([
			-1.0,  1.0,
			1.0,  1.0,
			-1.0, -1.0,
			1.0, -1.0
		]);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, vertexPositionData, this.gl.STATIC_DRAW);

		const textureCooridantesBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, textureCooridantesBuffer);
		const textureCooridantesData = new Float32Array([
			0.0, 0.0,
			1.0, 0.0,
			0.0, 1.0,
			1.0, 1.0
		]);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, textureCooridantesData, this.gl.STATIC_DRAW);

		this.buffers = {
			vertexPositionBuffer,
			textureCooridantesBuffer
		}

		this.grassTileTexture = this.loadTexture('res/grass_tile.png');
	}

	initShaderProgram(vertexShaderSource, fragmentShaderSource) {
		const vertexShader = this.loadShader(this.gl.VERTEX_SHADER, vertexShaderSource)
		const fragmentShader = this.loadShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource)
		const shaderProgram = this.gl.createProgram();
		this.gl.attachShader(shaderProgram, vertexShader);
		this.gl.attachShader(shaderProgram, fragmentShader);
		this.gl.linkProgram(shaderProgram);

		if (this.gl.getProgramParameter(shaderProgram, this.gl.LINK_STATUS)) {
			return shaderProgram;
		} else {
			alert('Shader link error: ' + this.gl.getProgramInfoLog(shaderProgram));
			return null;
		}
	}

	loadShader(type, source) {
		const shader = this.gl.createShader(type);
		this.gl.shaderSource(shader, source);
		this.gl.compileShader(shader);

		if (this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
			return shader;
		} else {
			alert('Shader comilation error: ' + this.gl.getShaderInfoLog(shader));
			this.gl.deleteShader(shader);
			return null;
		}
	}

	loadTexture(url) {
		const texture = this.gl.createTexture();
		const target = this.gl.TEXTURE_2D;
		const level = 0;
		const internalFormat = this.gl.RGBA;
		const width = 1;
		const height = 1;
		const border = 0;
		const format = this.gl.RGBA;
		const type = this.gl.UNSIGNED_BYTE;
		const pixels = new Uint8Array([0, 0, 255, 255]);
		this.gl.bindTexture(target, texture);
		this.gl.texImage2D(target, level, internalFormat, width, height, border, format, type, pixels);
	
		const image = new Image();
		image.onload = () => {
			this.gl.bindTexture(target, texture);
			this.gl.texImage2D(target, level, internalFormat, format, type, image);
	
			if (this.isPowerOf2(image.width) && this.isPowerOf2(image.height)) {
				this.gl.generateMipmap(target);
			} 

			this.gl.texParameteri(target, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST_MIPMAP_NEAREST);
			this.gl.texParameteri(target, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
			this.gl.texParameteri(target, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
			this.gl.texParameteri(target, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
		};
		image.src = url;
	
		return texture;
	}
	
	isPowerOf2(value) {
		return (value & (value - 1)) == 0;
	}

}
