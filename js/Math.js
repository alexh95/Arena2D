export class V3 {

	constructor(x, y, z) {
		this.x = x;
		this.y = y;
		this.z = z;
	}

	opposite() {
		const result = new V3(-this.x, -this.y, -this.z);
		return result;
	}

	add(that) {
		const result = new V3(this.x + that.x, this.y + that.y, this.z + that.z);
		return result;
	}

	addEquals(that) {
		this.x += that.x;
		this.y += that.y;
		this.y += that.y;
		return this;
	}

	subtract(that) {
		const result = new V3(this.x - that.x, this.y - that.y, this.z - that.z);
		return result;
	}

	subtractEquals(that) {
		this.x -= that.x;
		this.y -= that.y;
		this.y -= that.y;
		return this;
	}

	multiply(that) {
		const result = new V3(this.x * that.x, this.y * that.y, this.z * that.z);
		return result;
	}

	multiplyEquals(that) {
		this.x *= that.x;
		this.y *= that.y;
		this.y *= that.y;
		return this;
	}

	divide(that) {
		const result = new V3(this.x / that.x, this.y / that.y, this.z / that.z);
		return result;
	}

	divideEquals(that) {
		this.x /= that.x;
		this.y /= that.y;
		this.y /= that.y;
		return this;
	}

	scale(scalar) {
		const result = new V3(this.x * scalar, this.y * scalar, this.z * scalar);
		return result;
	}

	scaleEquals(scalar) {
		this.x *= scalar;
		this.y *= scalar;
		this.y *= scalar;
		return this;
	}

	inner(that) {
		const result = this.x * that.x + this.y * that.y + this.z * that.z;
		return result;
	}

}
