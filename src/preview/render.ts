import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import json from 'highlight.js/lib/languages/json';
import markdownLanguage from 'highlight.js/lib/languages/markdown';
import xml from 'highlight.js/lib/languages/xml';
import bash from 'highlight.js/lib/languages/bash';
import css from 'highlight.js/lib/languages/css';
import { marked } from 'marked';
import { EMPTY_STRING } from '../constants';

const ALLOWED_TAGS = new Set([
  'a',
  'blockquote',
  'br',
  'code',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'li',
  'ol',
  'p',
  'pre',
  'strong',
  'table',
  'tbody',
  'td',
  'th',
  'thead',
  'tr',
  'ul'
]);

let highlightingConfigured = false;

function ensureHighlightingConfigured(): void {
  if (highlightingConfigured) {
    return;
  }

  hljs.registerLanguage('javascript', javascript);
  hljs.registerLanguage('typescript', typescript);
  hljs.registerLanguage('json', json);
  hljs.registerLanguage('markdown', markdownLanguage);
  hljs.registerLanguage('html', xml);
  hljs.registerLanguage('css', css);
  hljs.registerLanguage('bash', bash);
  highlightingConfigured = true;
}

function getNodeConstructor(sourceDocument: Document): typeof Node {
  return (sourceDocument.defaultView?.Node ?? Node) as typeof Node;
}

function createParser(sourceDocument: Document): DOMParser {
  const Parser = sourceDocument.defaultView?.DOMParser ?? DOMParser;
  return new Parser();
}

function cloneHighlightedNodes(source: Node, target: HTMLElement, sourceDocument: Document): void {
  const NodeConstructor = getNodeConstructor(sourceDocument);

  for (const child of source.childNodes) {
    if (child.nodeType === NodeConstructor.TEXT_NODE) {
      target.append(sourceDocument.createTextNode(child.textContent ?? EMPTY_STRING));
      continue;
    }

    if (child.nodeType !== NodeConstructor.ELEMENT_NODE) {
      continue;
    }

    const element = child as HTMLElement;
    if (element.tagName.toLowerCase() !== 'span') {
      cloneHighlightedNodes(element, target, sourceDocument);
      continue;
    }

    const span = sourceDocument.createElement('span');
    span.className = element.className;
    cloneHighlightedNodes(element, span, sourceDocument);
    target.append(span);
  }
}

function createCodeElement(code: string, className: string, sourceDocument: Document): HTMLElement {
  ensureHighlightingConfigured();

  const codeElement = sourceDocument.createElement('code');
  const languageClass = className.replace('language-', EMPTY_STRING);
  const highlighted = languageClass.length > 0
    ? hljs.highlight(code, { language: languageClass, ignoreIllegals: true })
    : hljs.highlightAuto(code);

  const parsed = createParser(sourceDocument).parseFromString(`<div>${highlighted.value}</div>`, 'text/html');
  const wrapper = parsed.body.firstElementChild;

  if (wrapper instanceof sourceDocument.defaultView!.HTMLElement) {
    cloneHighlightedNodes(wrapper, codeElement, sourceDocument);
  } else {
    codeElement.textContent = code;
  }

  return codeElement;
}

function sanitizePreviewNode(node: Node, sourceDocument: Document): Node | null {
  const NodeConstructor = getNodeConstructor(sourceDocument);

  if (node.nodeType === NodeConstructor.TEXT_NODE) {
    return sourceDocument.createTextNode(node.textContent ?? EMPTY_STRING);
  }

  if (node.nodeType !== NodeConstructor.ELEMENT_NODE) {
    return null;
  }

  const element = node as HTMLElement;
  const tag = element.tagName.toLowerCase();

  if (!ALLOWED_TAGS.has(tag)) {
    const fragment = sourceDocument.createDocumentFragment();
    for (const child of [...element.childNodes]) {
      const sanitized = sanitizePreviewNode(child, sourceDocument);
      if (sanitized !== null) {
        fragment.append(sanitized);
      }
    }
    return fragment;
  }

  if (tag === 'pre') {
    const pre = sourceDocument.createElement('pre');
    const codeNode = element.querySelector('code');
    const codeText = codeNode?.textContent ?? element.textContent ?? EMPTY_STRING;
    const className = codeNode?.className ?? EMPTY_STRING;
    pre.append(createCodeElement(codeText, className, sourceDocument));
    return pre;
  }

  const next = sourceDocument.createElement(tag);

  if (tag === 'a') {
    const href = element.getAttribute('href') ?? EMPTY_STRING;
    if (/^(https?:|mailto:|#)/u.test(href)) {
      next.setAttribute('href', href);
      next.setAttribute('target', '_blank');
      next.setAttribute('rel', 'noreferrer');
    }
  }

  for (const child of [...element.childNodes]) {
    const sanitized = sanitizePreviewNode(child, sourceDocument);
    if (sanitized !== null) {
      next.append(sanitized);
    }
  }

  return next;
}

export function renderMarkdownFragment(content: string, sourceDocument: Document = document): DocumentFragment {
  const html = marked.parse(content, {
    gfm: true,
    breaks: true
  }) as string;

  const parsed = createParser(sourceDocument).parseFromString(html, 'text/html');
  const fragment = sourceDocument.createDocumentFragment();

  for (const child of [...parsed.body.childNodes]) {
    const sanitized = sanitizePreviewNode(child, sourceDocument);
    if (sanitized !== null) {
      fragment.append(sanitized);
    }
  }

  return fragment;
}

export function renderMarkdownPreview(container: HTMLElement, content: string): void {
  const sourceDocument = container.ownerDocument ?? document;
  container.replaceChildren(renderMarkdownFragment(content, sourceDocument));
}

export function renderMarkdownToHtml(content: string, sourceDocument: Document = document): string {
  const container = sourceDocument.createElement('div');
  container.append(renderMarkdownFragment(content, sourceDocument));
  return container.innerHTML;
}
