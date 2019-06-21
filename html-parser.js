

function parseHTML(html) {
  const {string, tree} = parseTag(html);
  console.log(string);
  if (string) throw new Error('Error in syntax');
  console.log(tree);
}

function parseTag(string, tree) {
  string = skipSpace(string);
  if(!string) {
    return {tree, string};
  }
  if(string[0] !== '<') {
    throw new Error('Unexpected token');
  }
  if(string[1] === '/') {
    const closeIndex = string.indexOf('>');
    const tagName = string.slice(2, closeIndex).trim();
    if (tagName !== tree.name) {
      throw new Error('Tried to close not existing tag');
    }
    return {string: string.slice(closeIndex + 1) || '', tree};
  }
  string = string.slice(1);
  const element = {children: []};
  const match = /^\w+/.exec(string);
  element.name = match[0];
  const {attributes, rest} = parseAttributes(skipSpace(string.slice(match[0].length)));
  attributes.forEach((attr) => element[attr.attrName] = attr.attrVal);

  if(tree) {tree.children.push(element)}
  else { tree = element; }

  string = skipSpace(rest);
  while(string.indexOf(`</${element.name}>`) !== 0 && string.length) {
    // if(string[0] !== '<') {
    //   const openIndex = string.indexOf('<');
    //   element.children.push(new TextNode(string.slice(0, openIndex)));
    //   string = string.slice(openIndex);
    // }
    const {tree: newTree, string: rest} = parseTag(string, element);
    if(newTree !== element) {
      element.children.push(newTree);
    }
    string = skipSpace(rest);
  }
  if(string.length === 0) {
    throw new Error('Not closed tag');
  }
  return parseTag(string, element);
}

class TextNode {
  constructor(text){
    this.text = text;
  };
}

const attributeDelimiter = '=';

function parseAttributes(string) {
  const closeIndex = string.indexOf('>');
  const inner = string.slice(0, closeIndex);
  const attributesMatch = /\w+="\w+"/g.exec(inner);
  const attributes = (attributesMatch || []).map((attrMatch) => {
    const delimiterIndex = attrMatch.indexOf(attributeDelimiter);
    const attrName = attrMatch.slice(0, delimiterIndex);
    const attrVal = skipSpace(skipSpace(attrMatch.slice(delimiterIndex + 1)).slice(1, -1));
    return {attrName, attrVal};
  });
  return {rest: string.slice(closeIndex + 1), attributes};
}

function skipSpace(string) {
  return string.trim();
}

parseHTML(
`
<div><a></a></div>
`
);
// <div class="kek" id="hui">
//   <a>
//   <a></a>
//   </a>
//   <div><asssd><div></div></aasdsdsssd></div>
// <div><span></span></div>
// </div>
