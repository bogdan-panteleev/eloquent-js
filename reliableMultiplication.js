class MultiplicatorUnitFailure extends Error {}

function primitiveMultiply(a, b) {
	if (Math.random() < 0.2) {
		return a * b;
	} else {
		throw new MultiplicatorUnitFailure('Klunk');
	}
}

function reliableMultiply(a, b) {
	console.log('called');
	try {
		return primitiveMultiply(a, b);
	} catch (e) {
		return reliableMultiply(a, b);
	}
	// let result;
	// while(isNaN(result)){
	//   try{
	//     result = primitiveMultiply(a, b);
	//   }catch(e) {
	//     console.log('err');
	//   }
	// }
	// return result;
}

console.log(reliableMultiply(8, 8));
// → 64
