function getPGroupClass() {
	class PGroup {
		constructor(values) {
			this.__set = [];
			for (let value of values) {
				if (this.__set.includes(value)) {
					continue;
				}
				this.__set.push(value);
			}
		}
		add(val) {
			if (this.__set.includes(val)) {
				return null;
			}
			return new PGroup(this.__set.concat(val));
		}
		delete(val) {
			if (!this.__set.includes(val)) {
				return null;
			}
			if (this.__set.length === 1) {
				return PGroup.empty;
			}
			return new PGroup(this.__set.filter((item) => item !== val));
		}
		has(val) {
			return this.__set.includes(val);
		}
	}
	class EmptyPGroup {
		constructor() {
			console.log('created');
		}
		add(val) {
			return new PGroup(val);
		}
		delete() {
			return null;
		}
		has() {
			return null;
		}
	}
	PGroup.empty = new EmptyPGroup();
	return PGroup;
}

const PGroup = getPGroupClass();

// let group = Group.from([10, 20]);
// console.log(group.has(10));
// // → true
// console.log(group.has(30));
// // → false
// group.add(10);
// group.delete(10);
// console.log(group.has(10));
// // → false

// class PGroup {
//   // Your code here
// }
//

let a = PGroup.empty.add('a');
let ab = a.add('b');
let b = ab.delete('a');

console.log(a === ab);
// console.log(b.has("b"));
// → true
// console.log(a.has("b"));
// → false
// console.log(b.has("a"));
// → false
