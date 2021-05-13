class Static {
	constructor(vertices, faces) {
		this.pos = new Vec3();
		this.r = new Q();
		this.frictionFactor = 0.2;
		this.elasticFactor = 0.2;
		this.vertices = vertices;
		this.faces = faces;
		this.generateEdges();
		this.generateMesh();
	}
	generateEdges() {
		this.edges = [];
		let edgeMap = {};
		for (let face of this.faces) {
			for (let i = 0; i < 3; i++) {
				let a = face[i], b = face[(i+1)%3], t = a;

				if (a == b)
					continue;
				else if (a > b)
					a = b, b = t;
				
				let id = a + "," + b;
				if (!edgeMap[id]) {
					edgeMap[id] = true;
					this.edges.push([a, b]);
				}
			}
		}
	}
	setTexture(path) {
		this.mesh.material = new THREE.MeshStandardMaterial({side: THREE.DoubleSide, map: new THREE.TextureLoader().load(path)});
	}
	generateMesh() {
		let vertices = [];
		let faces = [];
		for (let v of this.vertices)
			vertices.push(v.x, v.y, v.z);
		for (let f of this.faces)
			faces.push(...f);
		
		this.mesh = new THREE.Mesh(new THREE.PolyhedronGeometry(vertices, faces, 1, 0), new THREE.MeshStandardMaterial({side: THREE.DoubleSide, color: 0x00ff00}));
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
	getModelVec(objectvec) {
		return objectvec.rotate(this.r.inverse());
	}
	getObjectVec(modelvec) {
		return modelvec.rotate(this.r);
	}
}