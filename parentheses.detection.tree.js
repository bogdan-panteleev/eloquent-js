
function checkParentheses(inp) {
  const ast = buildAST(inp);
  return ast.isValid().isValid;
}

function buildAST(inp) {
  const root = new RootNode();
  let currentNode = root;
  const invalidReport = {
    isValid: true,
    wrongPosition: null
  };
  for(let i = 0; i < inp.length; i++) {
    const letter = inp[i];
    if(isOpeningBracket(letter)) {
      const newNode = new Node(Brackets.getBrackets(letter), currentNode);
      currentNode.children.push(newNode);
      currentNode = newNode;
    }
    const isClosing = isClosingBracket(letter);
    if(isClosing && currentNode instanceof RootNode) {
      invalidReport.isValid = false;
      invalidReport.wrongPosition = i;
      return new BracketAST(root, invalidReport);
    }
    const isSameType = currentNode.data.isSameType(letter);
    if(isClosing && isSameType) {
      currentNode.data.close();
      currentNode = currentNode.parent;
    }
    if(isClosing && !isSameType) {
      invalidReport.isValid = false;
      invalidReport.wrongPosition = i;
      return new BracketAST(root, invalidReport);
    }
    if(!currentNode instanceof RootNode){
      throw new Error('Na hui');
    }
  }
  return new BracketAST(root);
}


class BracketAST {
  static isASTValid(ast) {
    if(ast.children.length) {
      return ast.children.every((subAst) => BracketAST.isASTValid(subAst))
    }
    return ast.data.isDone();
  }
  constructor(ast, validationReport) {
    this.ast = ast;
    this.validationReport = validationReport;
  }
  isValid() {
    if(this.validationReport && !this.validationReport.isValid) {
      return this.validationReport;
    }
    return {
      isValid: BracketAST.isASTValid(this.ast),
      wrongPosition: null
    }
  }
}

function isClosingBracket(bracket) {
  return bracket === ')' || bracket === '}' || bracket === ']';
}

function isOpeningBracket(bracket) {
  return bracket === '(' || bracket === '{' || bracket === '[';
}

class RootNode {
  constructor () {
    this.data = null;
    this.parent = null;
    this.children = [];
  }
}

class Node {
  constructor(data, parent) {
    this.data = data;
    this.parent = parent;
    this.children = [];
  }
}

class Brackets {
  static getBrackets(bracket) {
    if(bracket === '(') return new RoundBrackets();
    if(bracket === '[') return new SquareBrackets();
    if(bracket === '{') return new FigureBrackets();
    throw new Error('HUI');
  }
  constructor(){this.opened = true, this.closed = false}
  open() {this.opened = true}
  close() {this.closed = true}
  isDone() {return this.opened && this.closed}
}

class RoundBrackets extends Brackets {
  constructor(){
    super();
  }
  isSameType(letter) {
    return letter === '(' || letter === ')';
  }
}
class SquareBrackets extends Brackets {
  constructor(){
    super();
  }
  isSameType(letter) {
    return letter === '[' || letter === ']';
  }
}
class FigureBrackets extends Brackets {
  constructor(){
    super();
  }
  isSameType(letter) {
    return letter === '{' || letter === '}';
  }
}

const examples = [
  '{()()[[([])]]}{}{}{}[{}]',
  '(}{)[}',
  '{)',
  '{{[{(}]}}',
  '{{{)))',
  '((())){}{}{}[])}]'
];
const result = examples.map((ex) => checkParentheses(ex));
console.log(result);
