class Vec3 {
	constructor(x=0, y=0, z=0) {
		if (x instanceof Vec3)
			this.x = x.x, this.y = x.y, this.z = x.z;
		else
			this.x = x, this.y = y, this.z = z;
	}
	equals(v) { return this.x == v.x && this.y == v.y && this.z == v.z; }
	add(v) { return new Vec3(this.x + v.x, this.y + v.y, this.z + v.z); }
	sub(v) { return new Vec3(this.x - v.x, this.y - v.y, this.z - v.z); }
	mult(c) { return new Vec3(this.x * c, this.y * c, this.z * c); }
	abs2() { return this.x * this.x + this.y * this.y + this.z * this.z; }
	abs() { return sqrt(this.abs2()); }
	normalize() { return new Vec3(this).mult(1 / this.abs()); }
	dot(v) { return this.x * v.x + this.y * v.y + this.z * v.z; }
	cross(v) { return new Vec3(this.y * v.z - this.z * v.y, this.z * v.x - this.x * v.z, this.x * v.y - this.y * v.x); }
	angle(v) { return arccos(this.dot(v) / (this.abs() * v.abs())); }
	rotateOnAxis(a, angle=null) {
		if (angle == null)
			return this.rotate(Q.fromAxisAngle(a, angle));
		return this.rotate(Q.fromAxis(a));
	}
	rotate(q) {
		let q2 = q.multiply(new Q(0, this.x, this.y, this.z)).multiply(q.inverse());
		return new Vec3(q2.i, q2.j, q2.k);
	}
	parallelComponent(v) {
		return v.mult(this.dot(v) / v.abs2());
	}
	perpComponent(v) {
		return this.sub(this.parallelComponent(v));
	}
	lengthAlong(v) {
		return this.dot(v) / v.abs();
	}
}