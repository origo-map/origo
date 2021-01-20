import { dom } from './ui';
import Featureinfo from './featureinfo';

function setVisibility(visible) {
  const sideEl = document.getElementById('o-sidebar');
  if (visible && sideEl) {
    sideEl.classList.add('o-sidebar-show');
  } else if (!visible && sideEl) {
    sideEl.classList.remove('o-sidebar-show');
  }
}

function closeSidebar() {
  setVisibility(false);
  Featureinfo().clear();
}

function bindUIActions() {
  document.querySelector('#o-sidebar .o-sidebar #o-close-button').addEventListener('click', (evt) => {
    closeSidebar();
    evt.preventDefault();
  });
}

function setTitle(title) {
  const sideti = document.querySelector('#o-sidebar #o-card-title');
  sideti.innerHTML = title;
}

function insertContent(content) {
  const el = document.querySelector('#o-sidebar .o-sidebar .o-card-content');
  el.innerHTML = content;
}

function setContent(config) {
  const { title, content } = config;
  if (title) {
    setTitle(title);
  } else {
    setTitle('');
  }
  if (content) {
    insertContent(content);
  } else {
    insertContent('');
  }
}

function init(viewer) {
  const mapId = viewer.getId();
  const el = `<div id="o-sidebar">
    <div class="o-sidebar o-card">
        <div class="flex row justify-end">
          <div id="o-card-title" class="justify-start margin-y-smaller margin-left text-weight-bold width-full"></div>
          <button id="o-close-button" class="small round margin-top-smaller margin-bottom-auto margin-right-small icon-smallest grey-lightest no-shrink" aria-label="Stäng">
            <span class="icon ">
              <svg>
                <use xlink:href="#ic_close_24px"></use>
              </svg>
            </span>
          </button>
        </div>
        <div class="flex column o-card-content"></div>
    </div>
    </div>`;
  document.getElementById(mapId).appendChild(dom.html(el));

  bindUIActions();
}

export default {
  init,
  setVisibility,
  setTitle,
  setContent,
  closeSidebar
};
