import Cuid from 'cuid';
import { dom } from './ui';

export default function popup(options = {}) {
  const {
    target,
    onUnfocus = () => {}
  } = options;

  const id = Cuid();

  function render(targetId) {
    const pop = `<div id="${id}" class="popup-menu z-index-ontop-high"></div>`;
    document.getElementById(targetId).appendChild(dom.html(pop));
  }

  function getEl() {
    return document.getElementById(id);
  }

  function setPosition(position) {
    const el = getEl();
    if (position.top) el.style.top = position.top;
    if (position.bottom) el.style.bottom = position.bottom;
    if (position.left) el.style.left = position.left;
    if (position.right) el.style.right = position.right;
  }

  function setVisibility(visible) {
    const el = getEl();
    if (visible) {
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  }

  function setContent(content) {
    if (content) getEl().innerHTML = content;
  }

  function close() {
    setVisibility(false);
  }

  function show() {
    setVisibility(true);
  }

  function bindUIActions() {
    window.addEventListener('click', (e) => {
      const popupMenuEl = document.getElementById(id);
      if (!popupMenuEl.contains(e.target)) {
        onUnfocus(e);
        e.preventDefault();
      }
    });
  }

  render(target);
  bindUIActions();
  return {
    getEl,
    setPosition,
    setVisibility,
    setContent,
    close,
    show
  };
}
