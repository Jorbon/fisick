const canvas = document.createElement("canvas");

window.addEventListener("resize", () => {
	renderer.setSize(window.innerWidth, window.innerHeight);
});
window.addEventListener("contextmenu", event => { event.stopPropagation(); event.preventDefault(); });
window.addEventListener("dragenter", event => { event.stopPropagation(); event.preventDefault(); });
window.addEventListener("dragover", event => { event.stopPropagation(); event.preventDefault(); });
window.addEventListener("drop", event => { event.stopPropagation(); event.preventDefault(); });

window.addEventListener("mousedown", event => {
	
});

window.addEventListener("mouseup", event => {
	
});

window.addEventListener("mousemove", event => {
	
});

window.addEventListener("wheel", event => {
	
});

const keys = [];
for (let i = 0; i < 256; i++) { keys[i] = false; }
window.addEventListener("keydown", event => {
	if (!(event.metaKey || event.ctrlKey))
		keys[event.which || event.keyCode] = true;

	switch (event.key) {
		case "f":
			timestep(1/60);
			break;
		case "r":
			paused = !paused;
			break;
		case "t":
			slow = !slow;
			break;
		case "h":
			reset();
			break;
	}
});

window.addEventListener("keyup", event => {
	keys[event.which || event.keyCode] = false;
});



const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({canvas});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.autoClear = false;
document.body.appendChild(renderer.domElement);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const light = new THREE.DirectionalLight(0xffffff, 1.5, 100);
light.position.set(1, 3, 0.5);
light.castShadow = true;
scene.add(light);

const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambientLight);

const SMOL = 1e-14;



function tick(t=1, prevSfer=null, prevOther=null, prevPart=null) {
	for (let s of sfers)
		s.applyGravityForce(t);
	
	let collision = { t };

	for (let i = 0; i < sfers.length; i++) {
		let c1 = sfers[i] == prevSfer;
		for (let j = i+1; j < sfers.length; j++) {
			if ((c1 && sfers[j] == prevOther) || !sfers[i].couldCollide(sfers[j], t))
				continue;
			let [collided, t1] = sfers[i].testCollisionSfer(sfers[j], t);
			if (collided && t1 < collision.t)
				collision = { t: t1, type: 0, sfer: sfers[i], other: sfers[j] };
		}
		for (let s of statics) {
			let c2 = c1 && s == prevOther;
			for (let face of s.faces) {
				if (c2 && face == prevPart)
					continue;
				let [collided, t1, sferpos] = sfers[i].testCollisionFace([s.vertices[face[0]], s.vertices[face[1]], s.vertices[face[2]]], t);
				if (collided && t1 < collision.t)
					collision = { t: t1, type: 1, sfer: sfers[i], other: s, part: face, sferpos };
			}
			for (let edge of s.edges) {
				if (c2 && edge == prevPart)
					continue;
				let [collided, t1, t2] = sfers[i].testCollisionEdge([s.vertices[edge[0]], s.vertices[edge[1]]], t);
				if (collided && t1 < collision.t)
					collision = { t: t1, type: 2, sfer: sfers[i], other: s, part: edge, t2 };
			}
			for (let vert of s.vertices) {
				if (c2 && vert == prevPart)
					continue;
				let [collided, t1] = sfers[i].testCollisionVert(vert, t);
				if (collided && t1 < collision.t)
					collision = { t: t1, type: 3, sfer: sfers[i], other: s, part: vert };
			}
		}
	}

	if (collision.t < t) {
		for (let s of sfers)
			s.tick(collision.t);
		
		let {sfer, other, sferpos, part, t2} = collision;
		switch (collision.type) {
			case 0:
				sferpos = other.pos.sub(sfer.pos).mult(sfer.radius / (sfer.radius + other.radius));
				break;
			case 2:
				sferpos = other.vertices[part[0]].add(other.vertices[part[1]].sub(other.vertices[part[0]]).mult(t2)).sub(sfer.pos);
				break;
			case 3:
				sferpos = part.sub(sfer.pos);
				break;
		}

		sfer.applyCollisionForce(sferpos, other);

		return [false, t - collision.t, sfer, other, part];
	} else {
		for (let s of sfers)
			s.tick(t);
	}
	return [true];
}

function timestep(t=1) {
	let done = false, prevSfer, prevOther, prevPart;
	while (!done)
		[done, t, prevSfer, prevOther, prevPart] = tick(t, prevSfer, prevOther, prevPart);
}




let paused = true;
let slow = false;

const sfers = [];
const statics = [];


let vertices = [
	new Vec3(-1.5, -10, -1.5),
	new Vec3(-1.5, -10, 1.5),
	new Vec3(1.5, -10, 1.5),
	new Vec3(1.5, -10, -1.5),
	new Vec3(-10, 0, -10),
	new Vec3(-10, 0, 10),
	new Vec3(10, 0, 10),
	new Vec3(10, 0, -10),
	new Vec3(-11, 4, -11),
	new Vec3(-11, 4, 11),
	new Vec3(11, 4, 11),
	new Vec3(11, 4, -11),
];

let faces = [
	[0, 1, 4],
	[1, 4, 5],
	[1, 2, 5],
	[2, 5, 6],
	[2, 3, 6],
	[3, 6, 7],
	[3, 0, 7],
	[0, 7, 4],
	[4, 5, 8],
	[5, 8, 9],
	[5, 6, 9],
	[6, 9, 10],
	[6, 7, 10],
	[7, 10, 11],
	[7, 4, 11],
	[4, 11, 8],
];

const ramp = new Static(vertices, faces);
statics.push(ramp);
scene.add(ramp.mesh);
ramp.elasticFactor = 0.5;


function reset() {
	while (sfers.length > 0)
		scene.remove(sfers.pop().mesh);
	for (let i = 0; i < 50; i++) {
		let ball = new Sfer(random.float(0.3, 0.7), 0.1);
		sfers.push(ball);
		scene.add(ball.mesh);
		ball.pos.z = random.float(-9, 9);
		ball.pos.x = random.float(-9, 9);
		ball.pos.y = random.float(0, 3);
		ball.updateMeshPos();
		ball.setTexture("resources/earth.png");
		ball.frictionFactor = 0.5;
		ball.elasticFactor = 0.2;
	}
}

reset();




let timestampnow = performance.now(), timestampprev = performance.now();
camera.dx = 0, camera.dy = 0, camera.r = new THREE.Quaternion();

camera.position.x = 0;
//camera.position.y = 5;
camera.position.z = 40;
camera.dx = 0;
//camera.dy = -0.337;


function draw() {
	requestAnimationFrame(draw);

	// fps-independify fps-dependent inputs
	timestampnow = performance.now();
	let delta = (timestampnow - timestampprev) * 0.001;
	timestampprev = timestampnow;

	let dx = 0, dy = 0, f = 0, l = 0, u = 0;
	if (keys[37]) dx++;
	if (keys[38]) dy++;
	if (keys[39]) dx--;
	if (keys[40]) dy--;
	if (keys[87]) f++;
	if (keys[83]) f--;
	if (keys[65]) l++;
	if (keys[68]) l--;
	if (keys[32]) u++;
	if (keys[16]) u--;
	camera.dx += dx * delta * 1;
	camera.dy += dy * delta * 1;
	camera.position.x += -delta * 10 * (f * sin(camera.dx) + l * cos(camera.dx));
	camera.position.y += delta * 10 * u;
	camera.position.z += delta * 10 * (l * sin(camera.dx) - f * cos(camera.dx));

	// update camera rotation
	camera.r.w = Math.cos(camera.dx / 2) * Math.cos(camera.dy / 2);
	camera.r.z = -Math.sin(camera.dx / 2) * Math.sin(camera.dy / 2);
	camera.r.x = Math.cos(camera.dx / 2) * Math.sin(camera.dy / 2);
    camera.r.y = Math.sin(camera.dx / 2) * Math.cos(camera.dy / 2);
    camera.setRotationFromQuaternion(camera.r);

	

	// gravity is very nice
	/*
	for (let s of sfers) {
		let g = new Vec3();
		for (let s1 of sfers) {
			if (s1 == s)
				continue;
			let p = s1.pos.sub(s.pos);
			let pa = p.abs2()
			g = g.add(p.mult(s1.m / (pa * sqrt(pa))));
		}
		s.g = g.mult(10);
	}*/


	// physics time step
	if (!paused) {
		timestep(1/(slow ? 600 : 60));
		let sum = 0;
		for (let s of sfers)
			sum += s.getMechanicalEnergy();
		console.log(sum);
	}




	renderer.render(scene, camera);

}

requestAnimationFrame(draw);

