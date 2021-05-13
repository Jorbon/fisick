/*
General purpose math and management stuff for general use.
Removes annoying Math namespace (π works), new math functions, event scheduling, n-dimensional vectors, matrices, 2d frames for nested coordinate references, and a bit of mouse and keyboard input help.
*/

const abs = Math.abs, sin = Math.sin, cos = Math.cos, tan = Math.tan, asin = Math.asin, acos = Math.acos, atan = Math.atan, atan2 = Math.atan2, floor = Math.floor, ceil = Math.ceil, round = Math.round, sign = Math.sign, sqrt = Math.sqrt, cbrt = Math.cbrt, min = Math.min, max = Math.max;

const arccos = Math.acos, arcsin = Math.asin, arctan = Math.atan;

function sq(n) { return n*n; }
function cb(n) { return n*n*n; }

const random = {
	int: function(n1=2, n2=0) { return Math.floor(Math.random() * (n2 - n1)) + n1; },
	float: function(n1=1, n2=0) { return Math.random() * (n2 - n1) + n1; },
	choose: function(list) { return list[Math.floor(Math.random() * list.length)]; }
};

function roundTo(n, d) {
	return Math.round(n/d)*d;
};

const E = Math.E, PI = Math.PI, pi = Math.PI, π = Math.PI, SQRT2 = Math.SQRT2;

function lerp(min, max, t) { return t * (max - min) + min; };
function prel(min, max, t) { return (t - min) / (max - min); };
function cubicLerp(min, max, t) {
    t = -2 * t * t * t + 3 * t * t;
    return min + t * (max - min);
};
function sineLerp(min, max, t) {
	t = (1 - Math.cos(Math.PI * t)) / 2;
	return min + t * (max - min);
};
function bind(x, m1, m2) {
	if (m1 < m2) return Math.min(m2, Math.max(m1, x));
	else return Math.min(m1, Math.max(m2, x));
};
function wrap(x, m1, m2) {
	if (m2 < m1) { let mt = m1; m1 = m2; m2 = mt; };
	return lerp(m1, m2, mod(prel(m1, m2, x), 1));
};
function integrate(f, a, b, steps=10000) {
	let sum = 0;
	for (let i = a + (b-a)/(steps*2); i < b; i += (b-a)/steps) sum += f(i);
	return sum * (b-a)/steps;
};
function splitDecimal(num) {
	return [Math.floor(num), num >= 0 ? num%1 : 1-num%1];
};
function mod(n, d) {
	if (n >= 0) return n % d;
	else if (n < 0) return d + n % d;
};




