class Sfer {
	constructor(radius=1, density=1, meshDetail=16) {
		this.pos = new Vec3();
		this.v = new Vec3();
		this.r = new Q();
		this.g = new Vec3(0, -9.8, 0);
		this.w = new Vec3();
		this.radius = radius;
		this.m = density * 4/3 * pi * this.radius * this.radius * this.radius;
		this.I = 2/5 * this.m * this.radius * this.radius; // 2/5 for solid, 2/3 for hollow shell
		this.frictionFactor = 0.5;
		this.elasticFactor = 0.9;
		this.grounded = false;
		this.generateMesh(meshDetail);
	}
	static SMOL = 1e-14;
	applyGravityForce(t) {
		if (!this.grounded)
			this.v = this.v.add(this.g.mult(t));
	}
	tick(t) {
		if (this.grounded)
			return;
		
		this.pos = this.pos.add(this.v.mult(t));
		this.r = Q.fromAxis(this.w.mult(t)).multiply(this.r);

		this.updateMeshPos();
	}
	setTexture(path) {
		this.mesh.material = new THREE.MeshStandardMaterial({side: THREE.FrontSide, map: new THREE.TextureLoader().load(path)});
	}
	generateMesh(detail) {
		this.mesh = new THREE.Mesh(new THREE.SphereGeometry(this.radius, detail, ceil(detail * 0.75)), new THREE.MeshStandardMaterial({side: THREE.FrontSide, color: 0xff0000}));
	}
	updateMeshPos() {
		this.mesh.quaternion.w = this.r.r;
		this.mesh.quaternion.x = this.r.i;
		this.mesh.quaternion.y = this.r.j;
		this.mesh.quaternion.z = this.r.k;
		this.mesh.position.x = this.pos.x;
		this.mesh.position.y = this.pos.y;
		this.mesh.position.z = this.pos.z;
	}
	getVelocityOfPos(sferpos) {
		return this.v.add(this.w.cross(sferpos));
	}
	applyForce(sferpos, sferforce, t=1) {
		let moment = sferforce.mult(t);
		this.v = this.v.add(moment.mult(1 / this.m));
		this.w = this.w.add(sferpos.cross(moment).mult(1 / this.I));
	}
	couldCollide(sfer, t) {
		let r = sfer.pos.sub(this.pos);
		return sq(t * (this.v.lengthAlong(r) - sfer.v.lengthAlong(r)) + this.radius + sfer.radius) >= r.abs2();
	}

	// time for math throw up, I worked this out in desmos and I need them to be really fast.
	testCollisionSfer(sfer, t) {
		let vr = sfer.v.sub(this.v),
			cr = sfer.pos.sub(this.pos),
			r = this.radius + sfer.radius;
		let a = vr.abs2(),
			b = 2 * vr.dot(cr),
			c = cr.abs2() - r * r;
		let d = b*b - 4*a*c;
		
		if (d >= 0) {
			let sd = sqrt(d);
			if (sd < -b - Sfer.SMOL) {
				let t1 = -0.5 * (b + sd) / a;
				//				   -	always extraneous
				if (t1 < t)
					return [true, t1];
			}
		}
		return [false];
	}
	testCollisionFace(face, t) {
		let l1 = face[1].sub(face[0]),
			l2 = face[2].sub(face[1]),
			l3 = face[0].sub(face[2]);
		let n = l1.cross(l2).normalize();
		let ndv = n.dot(this.v);
		let t1 = -(sign(ndv) * n.dot(this.pos.sub(face[0])) + this.radius) / abs(ndv);
		//													-	always extraneous

		if (t1 > Sfer.SMOL && t1 < t) {
			let sferpos = n.mult(sign(ndv) * this.radius),
				p = this.pos.add(this.v.mult(t1)).add(sferpos);
			let in1 = p.sub(face[0]).dot(n.cross(l1));
			if (in1 >= 0) {
				let in2 = p.sub(face[1]).dot(n.cross(l2));
				if (in2 >= 0) {
					let in3 = p.sub(face[2]).dot(n.cross(l3));
					if (in3 >= 0)
						return [true, t1, sferpos];
				}
			}
		}
		return [false];
	}
	testCollisionEdge(edge, t) {
		let p = edge[0];
		let l = edge[1].sub(p),
			g = this.pos.sub(p);
		let n1 = 1 / l.abs2();
		let p1 = l.mult(n1);
		let p2 = p1.mult(this.v.dot(l)).sub(this.v),
			p3 = p1.mult(g.dot(l)).sub(g);
		let a = p2.abs2(),
			b = 2 * p2.dot(p3),
			c = p3.abs2() - this.radius * this.radius;
		let d = b*b - 4*a*c;
		if (d >= 0) {
			let sd = sqrt(d);
			if (sd < -b - Sfer.SMOL) {
				let t1 = -0.5 * (b + sd) / a;
				//				   -	always extraneous
				if (t1 < t) {
					let t2 = n1 * g.add(this.v.mult(t1)).dot(l);
					if (t2 > Sfer.SMOL && t2 < 1 - Sfer.SMOL)
						return [true, t1, t2];
				}
			}
		}
		return [false];
	}
	testCollisionVert(vert, t) {
		let rp = this.pos.sub(vert);
		let a = this.v.abs2(),
			b = 2 * this.v.dot(rp),
			c = rp.abs2() - this.radius * this.radius;
		let d = b*b - 4*a*c;
		
		if (d >= 0) {
			let sd = sqrt(d);
			if (sd < -b - Sfer.SMOL) {
				let t1 = -0.5 * (b + sd) / a;
				//				   -	this will always be a point exiting rather than entering, applies to all four above
				if (t1 < t)
					return [true, t1];
			}
		}
		return [false];
	}
	applyCollisionForce(sferpos, other) {
		let frictionCoef = this.frictionFactor * other.frictionFactor,
			elasticity = 1 - (1 - this.elasticFactor) * (1 - other.elasticFactor);
		let cor = sqrt(elasticity);
		//let normal = sferpos / this.radius;

		if (other instanceof Sfer) {
			let sfer2pos = sferpos.mult(-other.radius / this.radius);
			let vrel = other.getVelocityOfPos(sfer2pos).sub(this.getVelocityOfPos(sferpos));
			
			let vDirect = vrel.parallelComponent(sferpos);
			let dpDirect = this.v.mult(this.m).add(other.v.mult(other.m)).mult(1 / (this.m + other.m)).sub(this.v).mult(this.m * (1 + cor));
			this.v = this.v.add(dpDirect.mult(1 / this.m));
			other.v = other.v.add(dpDirect.mult(-1 / other.m));
			
			let vTangent = vrel.sub(vDirect);
			let dpTangent = vTangent.mult(frictionCoef * dpDirect.abs() / vTangent.abs());
			this.applyForce(sferpos, dpTangent);
			other.applyForce(sfer2pos, dpTangent.mult(-1));
		} else {
			let vrel = this.getVelocityOfPos(sferpos).mult(-1);

			let vDirect = vrel.parallelComponent(sferpos);
			let dvDirect = vDirect.mult(1 + cor);
			this.v = this.v.add(dvDirect);

			let vTangent = vrel.sub(vDirect);
			let dvTangent = vTangent.mult(frictionCoef * dvDirect.abs() * this.m / vTangent.abs());
			this.applyForce(sferpos, dvTangent);
		}
	}
	getMechanicalEnergy() {
		return this.m * (this.g.abs() * this.pos.y + 0.5 * this.v.abs2()) + 0.5 * this.I * this.w.abs2();
	}
}