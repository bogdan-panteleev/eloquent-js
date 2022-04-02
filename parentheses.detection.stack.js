function isCorrectParentheses(inp) {
	const stack = new Stack();
	for (let i = 0; i < inp.length; i++) {
		let letter = inp[i];
		if (isOpening(letter)) {
			stack.add(letter);
			continue;
		}
		let last;
		try {
			last = stack.getLast().data;
		} catch (e) {
			return false;
		}
		if (isSameType(last, letter)) {
			stack.removeLast();
		}
	}
	return stack.isEmpty();
}

function isOpening(letter) {
	return letter === '(' || letter === '{' || letter === '[';
}

function isClosing(letter) {
	return letter === ')' || letter === '}' || letter === ']';
}

function isSameType(first, second) {
	return (first === '(' && second === ')') || (first === '{' && second === '}') || (first === '[' && second === ']');
}

class Stack {
	add(data) {
		const newNode = new StackNode(data);
		if (this._head) {
			let currentNode = this._head;
			while (currentNode.next) {
				currentNode = currentNode.next;
			}
			currentNode.next = newNode;
		} else {
			this._head = newNode;
		}
	}
	getLast() {
		if (!this._head) {
			throw new Error('incorrect bracket');
		}
		let currentNode = this._head;
		while (currentNode.next) {
			currentNode = currentNode.next;
		}
		return currentNode;
	}
	removeLast() {
		if (this._head.next === null) {
			this._head = null;
		} else {
			let currentNode = this._head;
			while (currentNode.next.next) {
				currentNode = currentNode.next;
			}
			currentNode.next = null;
		}
	}
	isEmpty() {
		return !this._head;
	}
}

class StackNode {
	constructor(data) {
		this.data = data;
		this.next = null;
	}
}

const examples = ['{()()[[([])]]}{}{}{}[{}]', '(}{)[}', '{)', '{{[{(}]}}', '{{{)))', '{(((()))){}{}{}[{({)(})}]()}'];

const result = examples.map((ex) => isCorrectParentheses(ex));
console.log(result);
