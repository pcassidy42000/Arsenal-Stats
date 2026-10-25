/** Small markdown subset rendered as DOM nodes, never via innerHTML. */

const INLINE = /\*\*([^*]+)\*\*|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;

export function parseInlines(text) {
  const nodes = [];
  const pattern = new RegExp(INLINE.source, "g");
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > last) {
      nodes.push({ type: "text", text: text.slice(last, match.index) });
    }
    if (match[1] != null) nodes.push({ type: "strong", text: match[1] });
    else nodes.push({ type: "link", text: match[2], href: match[3] });
    last = match.index + match[0].length;
  }
  if (last < text.length) nodes.push({ type: "text", text: text.slice(last) });
  return nodes;
}

function listMarker(line) {
  const match = /^( *)- (.*)$/.exec(line);
  if (!match) return null;
  return { indent: match[1].length, text: match[2] };
}

function parseList(lines, index, indent) {
  const items = [];
  while (index < lines.length) {
    if (!lines[index].trim()) {
      let look = index + 1;
      while (look < lines.length && !lines[look].trim()) look += 1;
      const ahead = look < lines.length ? listMarker(lines[look]) : null;
      if (!ahead || ahead.indent < indent) break;
      index = look;
      continue;
    }
    const marker = listMarker(lines[index]);
    if (!marker || marker.indent !== indent) break;
    index += 1;
    const children = [];
    const nested = index < lines.length ? listMarker(lines[index]) : null;
    if (nested && nested.indent > indent) {
      const parsed = parseList(lines, index, nested.indent);
      children.push(parsed.node);
      index = parsed.next;
    }
    items.push({ inlines: parseInlines(marker.text), children });
  }
  return { node: { type: "ul", items }, next: index };
}

export function parseMarkdown(source) {
  const lines = String(source).replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let index = 0;
  while (index < lines.length) {
    if (!lines[index].trim()) {
      index += 1;
      continue;
    }
    const marker = listMarker(lines[index]);
    if (marker) {
      const parsed = parseList(lines, index, marker.indent);
      blocks.push(parsed.node);
      index = parsed.next;
      continue;
    }
    const paragraph = [lines[index].trim()];
    index += 1;
    while (index < lines.length && lines[index].trim() && !listMarker(lines[index])) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    blocks.push({ type: "p", inlines: parseInlines(paragraph.join(" ")) });
  }
  return blocks;
}

function appendInlines(parent, inlines, doc) {
  for (const node of inlines) {
    if (node.type === "text") parent.append(doc.createTextNode(node.text));
    else if (node.type === "strong") {
      const strong = doc.createElement("strong");
      strong.textContent = node.text;
      parent.append(strong);
    } else if (node.type === "link") {
      const link = doc.createElement("a");
      link.setAttribute("href", node.href);
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noreferrer noopener");
      link.textContent = node.text;
      parent.append(link);
    }
  }
}

function renderBlock(block, doc) {
  if (block.type === "p") {
    const paragraph = doc.createElement("p");
    appendInlines(paragraph, block.inlines, doc);
    return paragraph;
  }
  const list = doc.createElement("ul");
  for (const item of block.items) {
    const li = doc.createElement("li");
    appendInlines(li, item.inlines, doc);
    for (const child of item.children) li.append(renderBlock(child, doc));
    list.append(li);
  }
  return list;
}

export function renderMarkdown(source, doc = document) {
  const fragment = doc.createDocumentFragment();
  for (const block of parseMarkdown(source)) fragment.append(renderBlock(block, doc));
  return fragment;
}
