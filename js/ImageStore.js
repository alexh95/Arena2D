export default class ImageStore {

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
