import html from './html';

export default function replace(el, htmlString) {
  const newEl = html(htmlString);
  el.parentNode.replaceChild(newEl, el);
}
