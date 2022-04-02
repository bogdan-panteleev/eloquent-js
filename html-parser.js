export function parseHTML(html) {
	const { rest, tree } = parseTag(html);
	if (rest) throw new Error('Error in syntax');
	return tree;
}

function parseTag(html, tree) {
	html = skipSpace(html);
	if (html[0] !== '<') {
		throw new Error('Unexpected token');
	}
	if (html[1] === '/') {
		return handleTagClose(html, tree);
	}

	const handledOpeningTag = handleOpeningTag(html.slice(1));
	const element = handledOpeningTag.element;
	html = handledOpeningTag.rest;

	while (html.indexOf(`</${element.name}>`) !== 0 && html.length) {
		const parsedChunk = parseChunk(html, element);
		element.children.push(parsedChunk.element);
		html = parsedChunk.rest;
	}

	if (html.length === 0) {
		throw new Error('Not closed tag');
	}
	return parseTag(html, element);
}

function parseChunk(html, element) {
	const { rest: restHtml, parsedTextElem } = parseText(html);
	if (parsedTextElem) {
		return { rest: restHtml, element: parsedTextElem };
	}
	const { tree: child, rest } = parseTag(html, element);
	return { rest: skipSpace(rest), element: child };
}

function handleOpeningTag(html) {
	const openElementHandlingResult = handleElementOpen(html);
	html = openElementHandlingResult.rest;
	let element = openElementHandlingResult.element;

	const attributeHandlingResult = handleTagAttributes(html, element);
	html = attributeHandlingResult.rest;
	element = attributeHandlingResult.element;
	return { element, rest: html };
}

function handleTagAttributes(html, element) {
	const { attributes, rest } = parseAttributes(html);
	attributes.forEach((attr) => (element[attr.attrName] = attr.attrVal));
	return { rest, element: element };
}

function handleTagClose(html, tree) {
	const closeIndex = html.indexOf('>');
	const tagName = html.slice(2, closeIndex).trim();
	if (tagName !== tree.name) {
		throw new Error('Tried to close not existing tag');
	}
	return { rest: html.slice(closeIndex + 1) || '', tree };
}

function handleElementOpen(html) {
	const element = { children: [] };
	const match = /^\w+/.exec(html);
	element.name = match[0];
	return { element, rest: skipSpace(html.slice(match[0].length)) };
}

function parseText(html) {
	const bracketIndex = html.indexOf('<');
	const text = html.slice(0, bracketIndex);
	return { rest: html.slice(bracketIndex), parsedTextElem: text ? new TextNode(text) : null };
}

class TextNode {
	constructor(text) {
		this.text = text;
	}
}

const attributeDelimiter = '=';

function parseAttributes(html) {
	const closeIndex = html.indexOf('>');
	const inner = html.slice(0, closeIndex);
	const attributesMatch = inner.matchAll(/\w+="\w+"/g);
	const attrsArray = Array.from(attributesMatch) || [];
	const attributes = attrsArray.map(parseAttribute);
	return { rest: skipSpace(html.slice(closeIndex + 1)), attributes };
}

function parseAttribute(matchArr) {
	const attrMatch = matchArr[0];
	const delimiterIndex = attrMatch.indexOf(attributeDelimiter);
	const attrName = attrMatch.slice(0, delimiterIndex);
	const attrVal = skipSpace(skipSpace(attrMatch.slice(delimiterIndex + 1)).slice(1, -1));
	return { attrName, attrVal };
}

function skipSpace(string) {
	return string.trim();
}
