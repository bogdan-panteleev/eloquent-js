function parseExpression(program) {
  program = skipSpace(program);
  let match, expr;
  if (match = /^"([^"]*)"/.exec(program)) {
    expr = {type: "value", value: match[1]};
  } else if (match = /^\d+\b/.exec(program)) {
    expr = {type: "value", value: Number(match[0])};
  } else if (match = /^[^\s(),#"]+/.exec(program)) {
    expr = {type: "word", name: match[0]};
  } else {
    throw new SyntaxError("Unexpected syntax: " + program);
  }

  return parseApply(expr, program.slice(match[0].length));
}

function skipSpace(string) {
  const trimmed = string.trim();
  if(trimmed[0] === '#') {
    const newLineIndex = trimmed.indexOf('\n');
    return newLineIndex === -1 ? '' : skipSpace(trimmed.slice(newLineIndex + 1));
  }
  return trimmed;
}

function parseApply(expr, program) {
  program = skipSpace(program);
  if (program[0] !== "(") {
    return {expr: expr, rest: program};
  }

  program = skipSpace(program.slice(1));
  expr = {type: "apply", operator: expr, args: []};
  while (program[0] != ")") {
    let arg = parseExpression(program);
    expr.args.push(arg.expr);
    program = skipSpace(arg.rest);
    if (program[0] == ",") {
      program = skipSpace(program.slice(1));
    } else if (program[0] != ")") {
      throw new SyntaxError("Expected ',' or ')'");
    }
  }
  return parseApply(expr, program.slice(1));
}

function parse(program) {
  let {expr, rest} = parseExpression(program);
  if (skipSpace(rest).length > 0) {
    throw new SyntaxError("Unexpected text after program");
  }
  return expr;
}





const specialForms = Object.create(null);

function evaluate(expr, scope) {
  if (expr.type == "value") {
    return expr.value;
  } else if (expr.type == "word") {
    if (expr.name in scope) {
      return scope[expr.name];
    } else {
      throw new ReferenceError(
        `Undefined binding: ${expr.name}`);
    }
  } else if (expr.type == "apply") {
    let {operator, args} = expr;
    if (operator.type == "word" &&
      operator.name in specialForms) {
      return specialForms[operator.name](expr.args, scope);
    } else {
      let op = evaluate(operator, scope);
      if (typeof op == "function") {
        return op(...args.map(arg => evaluate(arg, scope)));
      } else {
        throw new TypeError("Applying a non-function.");
      }
    }
  }
}

specialForms.if = (args, scope) => {
  if (args.length != 3) {
    throw new SyntaxError("Wrong number of args to if");
  } else if (evaluate(args[0], scope) !== false) {
    return evaluate(args[1], scope);
  } else {
    return evaluate(args[2], scope);
  }
};

specialForms.while = (args, scope) => {
  if (args.length != 2) {
    throw new SyntaxError("Wrong number of args to while");
  }
  while (evaluate(args[0], scope) !== false) {
    evaluate(args[1], scope);
  }
  // Since undefined does not exist in Egg, we return false,
  // for lack of a meaningful result.
  return false;
};

specialForms.do = (args, scope) => {
  let value = false;
  for (let arg of args) {
    value = evaluate(arg, scope);
  }
  return value;
};

specialForms.define = (args, scope) => {
  if (args.length != 2 || args[0].type != "word") {
    throw new SyntaxError("Incorrect use of define");
  }
  let value = evaluate(args[1], scope);
  scope[args[0].name] = value;
  return value;
};

specialForms.set = (args, scope) => {
  if(args.length !== 2 || args[0].type !== 'word') {
    throw new SyntaxError('Incorrect use of set');
  }
  let value = evaluate(args[1], scope);
  let currentScope = scope;
  while(currentScope) {
    if(Object.prototype.hasOwnProperty.call(currentScope, args[0].name)) {
      currentScope[args[0].name] = value;
      return value;
    }
    currentScope = Object.getPrototypeOf(currentScope);
  }
  throw new ReferenceError('No such a binding');
};


const topScope = Object.create(null);

topScope.true = true;
topScope.false = false;

const operators = ["+", "-", "*", "/", "==", "<", ">", '||', '&&'];

for (let op of operators) {
  topScope[op] = Function("a, b", `return a ${op} b`);
}

topScope.print = value => {
  console.log(value);
  return value;
};

topScope.array = (...args) => args;

topScope.length = (arr) => {
  if(!('length' in arr)) {
    throw new Error ('Propery length is not accessible');
  }
  return arr.length;
};

topScope.element = (arr, n) => {
  if(n in arr){
    return arr[n];
  }
  throw new Error('Out of array size');
};

specialForms.fun = (args, scope) => {
  if (!args.length) {
    throw new SyntaxError("Functions need a body");
  }
  let body = args[args.length - 1];
  let params = args.slice(0, args.length - 1).map(expr => {
    if (expr.type != "word") {
      throw new SyntaxError("Parameter names must be words");
    }
    return expr.name;
  });

  return function () {
    if (arguments.length != params.length) {
      throw new TypeError("Wrong number of arguments");
    }
    let localScope = Object.create(scope);
    for (let i = 0; i < arguments.length; i++) {
      localScope[params[i]] = arguments[i];
    }
    return evaluate(body, localScope);
  };
};

function run(program) {
  return evaluate(parse(program), Object.create(topScope));
}

function compile(astRoot) {
  return compileExpression(astRoot);
}

function compileExpression(ast) {
  if(ast.type === 'apply') {
    return compileApply(ast);
  }
  if(ast.type === 'value') {
    return ast.value;
  }
  if(ast.type === 'word') {
    return ast.name;
  }
  throw new Error('Not known type');
}

function compileApply(ast) {
  if(ast.operator.name in specialForms) {
    return compileSpecialForm(ast);
  }
  if(operators.includes(ast.operator.name)){
    return compileOperator(ast);
  }
  return compileFunctionCall(ast);
  // throw new Error('Unexpected Apply');
}

function compileOperator(ast) {
  return `(${compileExpression(ast.args[0])} ${ast.operator.name} ${compileExpression(ast.args[1])})`
}

function compileSpecialForm(ast) {
  return specialFormCompileMatcher[ast.operator.name](ast);
}

function compileFunctionCall(ast) {
  if(ast.operator.name in topScope) {
    return topScopeCompileMatcher[ast.operator.name](ast);
  }
  return `${ast.operator.name}(${ast.args.map((arg) => compileExpression(arg))})`;
}

const specialFormCompileMatcher = {
  do: function compileDo(ast) {
    return ast.args.map((arg) => `${compileExpression(arg)};`).join('\n');
  },
  define: function compileDefine(ast) {
    return `var ${ast.args[0].name} = ${compileExpression(ast.args[1])}`
  },
  set: function compileSet(ast) {
    return `${ast.args[0].name} = ${compileExpression(ast.args[1])}`
  },
  fun: function compileFunction(ast) {
    const functionParams = ast.args.slice(0, -1).map((arg) => compileExpression(arg));
    let functionBody;
    functionBody = compileExpression(ast.args[ast.args.length - 1]).split('\n');
    if(ast.args[ast.args.length - 1].operator.name === 'do'){
      functionBody[functionBody.length - 1] = `return ${functionBody[functionBody.length - 1]}`;
      functionBody = functionBody.join('\n');
    } else {
      functionBody = `return ${functionBody.join('\n')}`;
    }
    return`function (${functionParams.join(', ')}) {
      ${functionBody}
  }`
  },
  if: function compileIf(ast) {
    return `${compileExpression(ast.args[0])} ? ${compileExpression(ast.args[1])} : ${compileExpression(ast.args[2])}`;
  }
};

const topScopeCompileMatcher = {
  print: function compilePrint(ast) {
    const input = ast.args[0].type === 'value' && typeof ast.args[0].value === 'string' ?
      `"${compileExpression(ast.args[0])}"` : `${compileExpression(ast.args[0])}`;
    return `console.log(${input})`;
  },
  array: function compileArray(ast) {
    return `[${ast.args.map((arg) => compileExpression(arg))}]`;
  },
  element: function compileElement(ast) {
    return `${ast.args[0].name}[${compileExpression(ast.args[1])}]`;
  },
  length: function compileLength(ast) {
    return `${ast.args[0].name}.length`;
  }
};


function getCompiled(program) {
  return compile(parse(program));
}

const program = `
  do(
      define(logDecorator, 3)
    )
`;

// const compiled = getCompiled(program);
// console.log(compiled);
// eval(compiled);
run(program);


// console.log(getCompiled(`
// do(
//    define(x, /(+(4,2), /(6,3))),
//    define(y, +(x,5)),
//    set(y, 100),
//    define(setx, fun(val, set(x, val)))
//    )
// `));


// run(`
// do(define(x, 4),
//    define(setx, fun(val, set(x, val))),
//    setx(50),
//    print(x))
// `);
