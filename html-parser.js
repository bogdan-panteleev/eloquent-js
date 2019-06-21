

function parseHTML(html) {
  const {rest, tree} = parseTag(html);
  console.log(rest);
  if (rest) throw new Error('Error in syntax');
  console.log(tree);
}

function parseTag(html, tree) {
  html = skipSpace(html);
  if(html[0] !== '<') {throw new Error('Unexpected token');}
  if(html[1] === '/') {
    const closeIndex = html.indexOf('>');
    const tagName = html.slice(2, closeIndex).trim();
    if (tagName !== tree.name) {throw new Error('Tried to close not existing tag');}
    return {rest: html.slice(closeIndex + 1) || '', tree};
  }
  html = html.slice(1);

  const element = {children: []};
  const match = /^\w+/.exec(html);
  element.name = match[0];
  html = skipSpace(html.slice(match[0].length));
  const {attributes, rest} = parseAttributes(html);
  attributes.forEach((attr) => element[attr.attrName] = attr.attrVal);
  html = rest;

  while(html.indexOf(`</${element.name}>`) !== 0 && html.length) {
    const {rest: restHtml, elem: textElem} = parseText(html);
    html = restHtml;
    if(textElem) {
      element.children.push(textElem);
      continue;
    }

    const {tree: child, rest: rest} = parseTag(html, element);
    element.children.push(child);
    html = skipSpace(rest);
  }

  if(html.length === 0) {throw new Error('Not closed tag');}
  return parseTag(html, element);
}

function parseText(html) {
  const bracketIndex = html.indexOf('<');
  const text = html.slice(0, bracketIndex);
  return {rest: html.slice(bracketIndex), elem: text ? new TextNode(text) : null};
}

class TextNode {
  constructor(text){
    this.text = text;
  };
}

const attributeDelimiter = '=';

function parseAttributes(html) {
  const closeIndex = html.indexOf('>');
  const inner = html.slice(0, closeIndex);
  const attributesMatch = /\w+="\w+"/g.exec(inner);
  const attributes = (attributesMatch || []).map((attrMatch) => {
    const delimiterIndex = attrMatch.indexOf(attributeDelimiter);
    const attrName = attrMatch.slice(0, delimiterIndex);
    const attrVal = skipSpace(skipSpace(attrMatch.slice(delimiterIndex + 1)).slice(1, -1));
    return {attrName, attrVal};
  });
  return {rest: skipSpace(html.slice(closeIndex + 1)), attributes};
}

function skipSpace(string) {
  return string.trim();
}

parseHTML(
`
<body>   kek<a><div></div>LOL</a>
</body>
`
);
