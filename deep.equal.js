function deepEqual(a, b) {
	if (!(a instanceof Object) || !(b instanceof Object)) {
		return a === b;
	}
	if (Array.isArray(a) && Array.isArray(b)) {
		if (a.length !== b.length) {
			return false;
		}
		return a.find((_, key) => !deepEqual(a[key], b[key])) === undefined;
	}
	let keysA = Object.keys(a);
	let keysB = Object.keys(b);
	if (deepEqual(keysA, keysB)) {
		return keysA.find((key) => !deepEqual(a[key], b[key])) === undefined;
	}
	return false;
}

let obj = [1, 2, 3];
console.log(deepEqual(obj, [1, 2, 3]));
