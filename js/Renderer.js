import {V3} from './Math.js';
import {entities, entityTypeToImage, EntityTypes} from './Entity.js';
import {imageStore} from './ImageStore.js';
import {settings} from './Settings.js';
import {nameVersionDisplay} from './Constants.js';
import vertexShaderCode from './shaders/VertexShader.js';
import fragmentShaderCode from './shaders/FragmentShader.js';

export default class Renderer {

	constructor() {
		this.tileSizeMeters = 1.;
		this.tileSizePixels = 16;
		this.metersToPixels = this.tileSizePixels / this.tileSizeMeters;
		this.pixelsToMeters = this.tileSizeMeters / this.tileSizePixels;
		this.zoomLevel = 4.;

		this.joystickBaseIndex = null;
		this.joystickStickIndex = null;
		this.joystick = {
			direction: new V3()
		};

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
		const sceneShaderProgram = this.initShaderProgram(vertexShaderCode, fragmentShaderCode);
		this.sceneProgramInfo = {
			shaderProgram: sceneShaderProgram,
			attribLocations: {
				vertexPosition: this.gl.getAttribLocation(sceneShaderProgram, 'vertexPosition'),
				textureCoordinate: this.gl.getAttribLocation(sceneShaderProgram, 'textureCoordinate')
			},
			uniformLocations: {
				projectionMatrix: this.gl.getUniformLocation(sceneShaderProgram, 'projectionMatrix'),
				modelViewMatrix: this.gl.getUniformLocation(sceneShaderProgram, 'modelViewMatrix'),
				textureCoordinateMatrix: this.gl.getUniformLocation(sceneShaderProgram, 'textureCoordinateMatrix'),
				sampler: this.gl.getUniformLocation(sceneShaderProgram, 'sampler'),
			}
		}
		// const guiShaderProgram = this.initShaderProgram();
		// this.guiShaderInfo = {
		// 	shaderProgram: this.guiShaderProgram,
		// 	attribLocations: {

		// 	},
		// 	uniformLocations: {

		// 	}
		// }

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

	loadTexture(image) {
		const texture = this.gl.createTexture();
		const target = this.gl.TEXTURE_2D;
		const level = 0;
		const internalFormat = this.gl.RGBA;
		const format = this.gl.RGBA;
		const type = this.gl.UNSIGNED_BYTE;
		this.gl.bindTexture(target, texture);
		this.gl.texImage2D(target, level, internalFormat, format, type, image);
		if (this.isPowerOf2(image.width) && this.isPowerOf2(image.height)) {
			this.gl.generateMipmap(target);
		} 
		this.gl.texParameteri(target, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST_MIPMAP_NEAREST);
		this.gl.texParameteri(target, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
		this.gl.texParameteri(target, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
		this.gl.texParameteri(target, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
		return texture;
	}

	createTexture(level, width, height, pixels) {
		const texture = this.gl.createTexture();
		this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
		const internalFormat = this.gl.RGBA;
		const border = 0;
		const format = this.gl.RGBA;
		const type = this.gl.UNSIGNED_BYTE;
		this.gl.texImage2D(this.gl.TEXTURE_2D, level, internalFormat, width, height, border, format, type, pixels);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
		return texture;
	}
	
	isPowerOf2(value) {
		return (value & (value - 1)) == 0;
	}

	initDraw(grassTile) {
		this.tileGrassTexture = this.loadTexture(imageStore.images[grassTile]);
		this.entityTextures = [];
		entityTypeToImage.forEach((index) => this.entityTextures.push(this.loadTexture(imageStore.images[index])));
		this.healthBarTexture = this.createTexture(0, 2, 1, new Uint8Array([255, 0, 0, 255, 255, 0, 0, 128]));

		this.gl.useProgram(this.sceneProgramInfo.shaderProgram);
		this.setupAttribute(this.buffers.vertexPositionBuffer, this.sceneProgramInfo.attribLocations.vertexPosition);
		this.setupAttribute(this.buffers.textureCooridantesBuffer, this.sceneProgramInfo.attribLocations.textureCoordinate);
	}

	setupAttribute(buffer, index) {
		const size = 2;
		const type = this.gl.FLOAT;
		const normalized = false;
		const stride = 0;
		const offset = 0;
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
		this.gl.vertexAttribPointer(index, size, type, normalized, stride, offset);
		this.gl.enableVertexAttribArray(index);
	}

	buildTileMap() {
		const level = 0;
		const width = 64 * this.metersToPixels;
		const height = 64 * this.metersToPixels;
		this.tileMapTexture = this.createTexture(level, width, height, null);
	
		const tileMapFrameBuffer = this.gl.createFramebuffer();
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, tileMapFrameBuffer);
		this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.tileMapTexture, level);
	
		this.gl.viewport(0, 0, width, height);
	
		this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
		this.gl.clearDepth(1.0);
		this.gl.enable(this.gl.DEPTH_TEST);
		this.gl.depthFunc(this.gl.LEQUAL);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
	
		const projectionMatrix = mat4.create();
		{
			const left = -0.5 * width * this.pixelsToMeters;
			const right = 0.5 * width * this.pixelsToMeters;
			const bottom = -0.5 * height * this.pixelsToMeters;
			const top = 0.5 * height * this.pixelsToMeters;
			const near = -0.5 * height * this.pixelsToMeters;
			const far = 0.5 * height * this.pixelsToMeters;
			mat4.ortho(projectionMatrix, left, right, bottom, top, near, far);
		}
		this.gl.uniformMatrix4fv(this.sceneProgramInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
	
		let textureCoordinateMatrix = mat4.create();
		this.gl.uniformMatrix4fv(this.sceneProgramInfo.uniformLocations.textureCoordinateMatrix, false, textureCoordinateMatrix);
	
		this.gl.activeTexture(this.gl.TEXTURE0);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.tileGrassTexture);
	
		this.gl.uniform1i(this.sceneProgramInfo.uniformLocations.sampler, 0);
		
		const cameraPosition = this.cameraPosition;
		const mode = this.gl.TRIANGLE_STRIP;
		const first = 0;
		const count = 4;
		for (let yTile = -32; yTile < 32; ++yTile) {
			for (let xTile = -32; xTile < 32; ++xTile) {
				const modelViewMatrix = mat4.create();
				mat4.translate(modelViewMatrix, modelViewMatrix, [xTile - cameraPosition.x + 0.5, yTile - cameraPosition.y + 0.5, 0.0]);
				mat4.scale(modelViewMatrix, modelViewMatrix, [0.5 * 16 * this.pixelsToMeters, 0.5 * 16 * this.pixelsToMeters, 1.0]);
				this.gl.uniformMatrix4fv(this.sceneProgramInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
				this.gl.drawArrays(mode, first, count);
			}
		}
	}

	draw() {
		this.drawScene();
		this.drawGui();
		this.draw2d();
	}

	initSceneDraw() {
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
		this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
		this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
		this.gl.clearDepth(1.0);
		this.gl.enable(this.gl.DEPTH_TEST);
		this.gl.disable(this.gl.BLEND);
		this.gl.depthFunc(this.gl.LEQUAL);

		this.gl.useProgram(this.sceneProgramInfo.shaderProgram);
		this.setupAttribute(this.buffers.vertexPositionBuffer, this.sceneProgramInfo.attribLocations.vertexPosition);
		this.setupAttribute(this.buffers.textureCooridantesBuffer, this.sceneProgramInfo.attribLocations.textureCoordinate);

		this.updateProjectionMatrix(this.zoomLevel);

		this.gl.uniform1i(this.sceneProgramInfo.uniformLocations.sampler, 0);
	}

	updateProjectionMatrix(zoomLevel) {
		const canvasSize = this.size.scale(0.5);
		const viewportSize = canvasSize.scale(this.pixelsToMeters / zoomLevel);
		const projectionMatrix = mat4.create();
		mat4.ortho(projectionMatrix, -viewportSize.x, viewportSize.x, -viewportSize.y, viewportSize.y, -canvasSize.y, canvasSize.y);
		this.gl.uniformMatrix4fv(this.sceneProgramInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
	}

	drawScene() {
		this.initSceneDraw();

		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
	
		this.gl.activeTexture(this.gl.TEXTURE0);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.tileMapTexture);

		let modelViewMatrix = mat4.create();
		const cameraPosition = this.cameraPosition;
		mat4.translate(modelViewMatrix, modelViewMatrix, [-cameraPosition.x, -cameraPosition.y, -0.5 * this.size.y]);
		mat4.scale(modelViewMatrix, modelViewMatrix, [64 * 0.5 * 16 * this.pixelsToMeters, 64 * 0.5 * 16 * this.pixelsToMeters, 1.0]);
		this.gl.uniformMatrix4fv(this.sceneProgramInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
	
		let textureCoordinateMatrix = mat4.create();
		this.gl.uniformMatrix4fv(this.sceneProgramInfo.uniformLocations.textureCoordinateMatrix, false, textureCoordinateMatrix);

		this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
	
		entities.forEach((entity) => {
			if (entity) {
				this.gl.activeTexture(this.gl.TEXTURE0);
				const texture = this.entityTextures[entityTypeToImage[entity.type]];
				this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
                
				const image = imageStore.images[entityTypeToImage[entity.type]];
				const imageSize = new V3(image.width, image.height);
				const size = imageSize.scale(this.pixelsToMeters);
				if (entity.spritesheetModel) {
					size.divideEquals(entity.spritesheetModel.size);
				}
				const centerOffset = size.multiply(new V3(0.5, 0.5).subtract(entity.center));
				const positionOffset = entity.position.subtract(this.cameraPosition);
				const offset = positionOffset.add(centerOffset);

				if (entity.spritesheetModel) {
					modelViewMatrix = mat4.create();
					mat4.translate(modelViewMatrix, modelViewMatrix, [offset.x, offset.y, -entity.position.y]);
					mat4.rotate(modelViewMatrix, modelViewMatrix, entity.rotation, [0.0, 0.0, 1.0]);
					mat4.scale(modelViewMatrix, modelViewMatrix, [0.5 * size.x, 0.5 * size.y, 1.0]);
					this.gl.uniformMatrix4fv(this.sceneProgramInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
		
					textureCoordinateMatrix = mat4.create();
					const textureOffset = entity.spritesheetModel.index.divide(entity.spritesheetModel.size);
					mat4.translate(textureCoordinateMatrix, textureCoordinateMatrix, [textureOffset.x, textureOffset.y, 0.0]);
					mat4.scale(textureCoordinateMatrix, textureCoordinateMatrix, [1.0 / entity.spritesheetModel.size.x, 1.0 / entity.spritesheetModel.size.y, 1.0]);
					this.gl.uniformMatrix4fv(this.sceneProgramInfo.uniformLocations.textureCoordinateMatrix, false, textureCoordinateMatrix);

					this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
				} else {
					textureCoordinateMatrix = mat4.create();
					this.gl.uniformMatrix4fv(this.sceneProgramInfo.uniformLocations.textureCoordinateMatrix, false, textureCoordinateMatrix);
		
					if (entity.repeatedModel) {
						for (let repeatedIndex = 0; repeatedIndex < entity.repeatedModel.count; ++repeatedIndex) {
							const repeatedOffset = size.multiply(entity.repeatedModel.sizeScale).multiply(entity.repeatedModel.direction).scale(repeatedIndex).add(offset);
			
							modelViewMatrix = mat4.create();
							mat4.translate(modelViewMatrix, modelViewMatrix, [repeatedOffset.x, repeatedOffset.y, -entity.position.y]);
							mat4.scale(modelViewMatrix, modelViewMatrix, [0.5 * size.x, 0.5 * size.y, 1.0]);
							this.gl.uniformMatrix4fv(this.sceneProgramInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);

							this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
						}
					} else {
						modelViewMatrix = mat4.create();
						mat4.translate(modelViewMatrix, modelViewMatrix, [offset.x, offset.y, -entity.position.y]);
						mat4.scale(modelViewMatrix, modelViewMatrix, [0.5 * size.x, 0.5 * size.y, 1.0]);
						this.gl.uniformMatrix4fv(this.sceneProgramInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);

						this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
					}
				}
			}
		});
	}

	initGuiDraw() {
		this.gl.disable(this.gl.DEPTH_TEST);
		this.gl.enable(this.gl.BLEND);
		this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

		this.gl.useProgram(this.sceneProgramInfo.shaderProgram);
		this.setupAttribute(this.buffers.vertexPositionBuffer, this.sceneProgramInfo.attribLocations.vertexPosition);
		this.setupAttribute(this.buffers.textureCooridantesBuffer, this.sceneProgramInfo.attribLocations.textureCoordinate);

		this.updateProjectionMatrix(1.0);

		this.gl.uniform1i(this.sceneProgramInfo.uniformLocations.sampler, 0);
	}

	drawGui() {
		this.initGuiDraw();

		this.gl.activeTexture(this.gl.TEXTURE0);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.healthBarTexture);

		entities.forEach((entity) => {
			if (entity && entity.combatModel) {
				const modelViewMatrix = mat4.create();
				const offset = entity.position.subtract(this.cameraPosition).scale(this.zoomLevel);
				mat4.translate(modelViewMatrix, modelViewMatrix, [offset.x, offset.y - 1.0 * this.zoomLevel, 0.0]);
				mat4.scale(modelViewMatrix, modelViewMatrix, [this.zoomLevel * 16 * this.pixelsToMeters, this.zoomLevel * 2 * this.pixelsToMeters, 1.0]);
				this.gl.uniformMatrix4fv(this.sceneProgramInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);

				const textureCoordinateMatrix = mat4.create();
				const ratio = 0.5 * (1.0 - entity.combatModel.health);
				mat4.translate(textureCoordinateMatrix, textureCoordinateMatrix, [ratio, 0.0, 0.0, 0.0]);
				mat4.scale(textureCoordinateMatrix, textureCoordinateMatrix, [0.5, 1.0, 1.0, 1.0]);
				this.gl.uniformMatrix4fv(this.sceneProgramInfo.uniformLocations.textureCoordinateMatrix, false, textureCoordinateMatrix);

				const mode = this.gl.TRIANGLE_STRIP;
				const first = 0;
				const count = 4;
				this.gl.drawArrays(mode, first, count);
			}
		});
	}

	draw2d() {
		this.clear();
	
		if (settings.isAndroid) {
			this.save();
			const canvasSize = this.size;
			const diameter = 0.4 * canvasSize.y - 16;
			const joystickSize = new V3(diameter, diameter);
			const joystickOffset = new V3(-16., joystickSize.y - canvasSize.y + 16.);
			const baseImage = imageStore.images[this.joystickBaseIndex];
			this.drawImage(baseImage, joystickOffset, joystickSize);
			const stickImage = imageStore.images[this.joystickStickIndex];
			const stickDirectionOffset = this.joystick.direction.scale(0.5 * diameter);
			stickDirectionOffset.x = -stickDirectionOffset.x;
			const stickOffset = joystickOffset.add(stickDirectionOffset);
			this.drawImage(stickImage, stickOffset, joystickSize);
			this.restore();
		}
	
		if (settings.debugInfoOn) {
			this.debugDraw();
		} else {
			this.infoDraw();
		}
	}
	
	infoDraw() {
		this.context2d.fillStyle = 'rgb(255,255,255)';
		this.context2d.font = '30px courier';
		this.context2d.fillText(nameVersionDisplay, 10, 30);
	}

	debugDraw() {
		this.context2d.lineWidth = '1';
		this.context2d.strokeStyle = 'rgb(255,0,0)';
		this.context2d.fillStyle = 'rgb(255,0,0)';
		this.context2d.font = '30px courier';
	
		const canvasSize = this.size;
		if (settings.debugGridOn) {
			this.save();
			this.context2d.fillStyle = 'rgb(255,255,0)';
			this.context2d.globalAlpha = 0.5;
			const cameraOffset = this.cameraPosition.scale(this.metersToPixels);
			for (let y = -32; y < 32; ++y) {
				for (let x = -32; x < 32; ++x) {
					if ((y + x) % 2 === 0) {
						this.context2d.fillRect(
							0.5 * (canvasSize.x) + this.zoomLevel * (x * this.metersToPixels - cameraOffset.x), 
							0.5 * (canvasSize.y) - this.zoomLevel * (y * this.metersToPixels - cameraOffset.y), 
							this.tileSizePixels * this.zoomLevel, 
							this.tileSizePixels * this.zoomLevel);
					}
				}
			}
			this.restore();
		}
	
		this.context2d.strokeRect(0.5, 0.5, canvasSize.x - 1, canvasSize.y - 1);
	
		// Center
		const center = new V3(0.5 * canvasSize.x + (canvasSize.x % 2 == 0 ? 0.5 : 0),
							  0.5 * canvasSize.y + (canvasSize.y % 2 == 0 ? 0.5 : 0));
		const crossWidth = canvasSize.x % 2 == 0 ? 1 : 0;
		const crossHeight = canvasSize.y % 2 == 0 ? 1 : 0;
		this.context2d.strokeRect(center.x - crossWidth, center.y - 32, crossWidth, 64 - crossHeight);
		this.context2d.strokeRect(center.x - 32, center.y - crossHeight, 64 - crossWidth, crossHeight);
		this.context2d.fillText('X', center.x + 32, center.y + 8);
		this.context2d.fillText('-X', center.x - 70, center.y + 8);
		this.context2d.fillText('Y', center.x - 10, center.y - 40);
		this.context2d.fillText('-Y', center.x - 27, center.y + 56);
	
		// Top Left
		this.context2d.fillText('Resolution: ' + canvasSize.x + ' x ' + canvasSize.y, 10, 30);
		this.context2d.fillText('FPS: ' + settings.fps.toString().substring(0, settings.fps.toString().indexOf('.')), 10, 60);
		// const mouseWorldPosition = controller.mouse.position.add(player.position);
		// this.context2d.fillText(`Mouse: (${displayText(mouseWorldPosition.x, 2, 0.01, true)}, ${displayText(mouseWorldPosition.y, 2, 0.01, true)})` + (controller.mouse.left ? ' L' : '') + (controller.mouse.middle ? ' M' : '') + (controller.mouse.right ? ' R' : ''), 10, 90);
		// this.context.fillText('the quick brown fox jumps over the lazy dog', 10, 120);
		// this.context.fillText('the quick brown fox jumps over the lazy dog', 10, 150);
	
		// Top Right
		/*const playerPositionText = `Player Pos: (${displayText(player.position.x, 2, 0.01, true)},${displayText(player.position.y, 2, 0.01, true)})`;
		const playerPositionTextMetrics = this.context2d.measureText(playerPositionText);
		this.context2d.fillText(playerPositionText, canvasSize.x - playerPositionTextMetrics.width - 5, 30);
	
		const playerSpeedText = `Player Speed: ${displayText(player.velocity.length(), 2, 0.01, true)}, (${displayText(player.velocity.x, 2, 0.01, true)},${displayText(player.velocity.y, 2, 0.01, true)})`;
		const playerSpeedTextMetrics = this.context2d.measureText(playerSpeedText);
		this.context2d.fillText(playerSpeedText, canvasSize.x - playerSpeedTextMetrics.width - 5, 60);*/
	
		// Bottom Rignt
		const nameVersionDisplayTextMetrics = this.context2d.measureText(nameVersionDisplay);
		this.context2d.fillText(nameVersionDisplay, canvasSize.x - nameVersionDisplayTextMetrics.width - 5, canvasSize.y - 5);
	}

}
