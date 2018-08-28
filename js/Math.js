export class V3 {

	constructor(x = 0, y = 0, z = 0) {
		this.x = x;
		this.y = y;
		this.z = z;
	}

	copyFrom(that) {
		this.x = that.x;
		this.y = that.y;
		this.z = that.z;
	}

	negate() {
		const result = new V3(-this.x, -this.y, -this.z);
		return result;
	}

	add(that) {
		const result = new V3(this.x + that.x, this.y + that.y, this.z + that.z);
		return result;
	}

	addEquals(that) {
		const added = this.add(that);
		this.copyFrom(added);
		return this;
	}

	subtract(that) {
		const result = new V3(this.x - that.x, this.y - that.y, this.z - that.z);
		return result;
	}

	subtractEquals(that) {
		const subtracted = this.subtract(that);
		this.copyFrom(subtracted);
		return this;
	}

	multiply(that) {
		const result = new V3(this.x * that.x, this.y * that.y, this.z * that.z);
		return result;
	}

	multiplyEquals(that) {
		const multiplied = this.multiply(that);
		this.copyFrom(multiplied);
		return this;
	}

	divide(that) {
		const result = new V3(this.x / that.x, this.y / that.y, this.z / that.z);
		return result;
	}

	divideEquals(that) {
		const divided = this.divide(that);
		this.copyFrom(divided);
		return this;
	}

	scale(scalar) {
		const result = new V3(this.x * scalar, this.y * scalar, this.z * scalar);
		return result;
	}

	scaleEquals(scalar) {
		const scaled = this.scale(that);
		this.copyFrom(scaled);
		return this;
	}

	inner(that) {
		const result = this.x * that.x + this.y * that.y + this.z * that.z;
		return result;
	}

	lengthSq() {
		const result = this.inner(this);
		return result;
	}

	length() {
		const result = Math.sqrt(this.lengthSq());
		return result;
	}

	normalize() {
		const length = this.length();
		if (length > 0) {
			const result = this.scale(1 / length);
			return result;
		}
		return this;
	}

	normalizeEquals() {
		const normalized = this.normalize();
		this.copyFrom(normalized);
		return this;
	}

}

export function displayText(number, decimals = 0, epsilon = 0.01, signSpace = false) {
	const string = (Math.abs(number) > epsilon) ? number.toString() : '0';
	const dotIndex = string.indexOf('.');
	let result = (signSpace && (number >= 0)) ? ' ' : ((number > -epsilon) ? ' ' : '');
	if (dotIndex > 0) {
		result += string.substring(0, dotIndex + decimals + 1);
	} else {
		result += string + ((decimals > 0) ? ('.' + '0'.repeat(decimals)) : '');
	}
	return result;
}
