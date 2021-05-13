class Q {
	constructor(r=1, i=0, j=0, k=0) {
		if (r instanceof Q)
			this.r = r.r, this.i = r.i, this.j = r.j, this.k = r.k;
		else
			this.r = r, this.i = i, this.j = j, this.k = k;
	}
	equals(q) {
		return this.r == q.r && this.i == q.i && this.j == q.j && this.k == q.k;
	}
	multiply(q) {
		if (q instanceof Q)
			return new Q(
				this.r * q.r - this.i * q.i - this.j * q.j - this.k * q.k,
				this.r * q.i + this.i * q.r + this.j * q.k - this.k * q.j,
				this.r * q.j - this.i * q.k + this.j * q.r + this.k * q.i,
				this.r * q.k + this.i * q.j - this.j * q.i + this.k * q.r
			);
		else
			return new Q(this.r * q, this.i * q, this.j * q, this.k * q);
	}
	abs2() { return this.r * this.r + this.i * this.i + this.j * this.j + this.k * this.k; }
	abs() { return sqrt(this.abs2()); }
	normalize() { return this.multiply(1 / this.abs()); }
	inverse() { return new Q(this.r, -this.i, -this.j, -this.k); }
	static fromAxis(a) {
		let l = a.abs();
		if (l == 0)
			return new Q();
		return Q.fromAxisAngle(a.mult(1 / l), l, true);
	}
	static fromAxisAngle(a, angle, n=false) {
		if (a.abs2() == 0)
			return new Q();
		if (!n)
			a = a.normalize();
		angle *= 0.5;
		let s = sin(angle);
		return new Q(cos(angle), a.x * s, a.y * s, a.z * s);
	}
}