import { Component } from '.';

export default function popup(options = {}) {
  const {
    onUnfocus = () => {},
    style = '',
    cls = ''
  } = options;

  let id;
  let isVisible = true;

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

  function getVisibility() {
    return isVisible;
  }

  function setVisibility(visible) {
    isVisible = visible;
    const el = getEl();
    if (visible) {
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  }

  function toggleVisibility() {
    setVisibility(!isVisible);
  }

  function setContent(content) {
    if (content) getEl().innerHTML = content;
  }

  return Component({
    onInit() {
      id = this.getId();
      window.addEventListener('click', (e) => {
        const popupMenuEl = document.getElementById(id);
        if (popupMenuEl && !popupMenuEl.contains(e.target)) {
          onUnfocus(e);
          e.preventDefault();
        }
      });
    },
    getEl,
    setPosition,
    getVisibility,
    setVisibility,
    toggleVisibility,
    setContent,
    render() {
      return `<div id="${this.getId()}" class="popup-menu z-index-ontop-high ${cls}" style="${style}"></div>`;
    }
  });
}
