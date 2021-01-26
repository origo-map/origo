import { dom } from './ui';
import Featureinfo from './featureinfo';

function render(target) {
  const pop = `<div id="o-popup">
      <div class="o-popup o-card">
        <div class="flex row justify-end">
          <div id="o-card-title" class="justify-start margin-y-smaller margin-left text-weight-bold" style="width:100%;"></div>
          <button id="o-close-button" class="small round margin-top-smaller margin-bottom-auto margin-right-small icon-smallest grey-lightest no-shrink" aria-label="Stäng">
            <span class="icon ">
              <svg>
                <use xlink:href="#ic_close_24px"></use>
              </svg>
            </span>
          </button>
        </div>
        <div class="o-card-content"></div>
      </div>
    </div>`;
  document.getElementById(target.substring(1)).appendChild(dom.html(pop));
}

function getEl() {
  return document.getElementById('o-popup');
}

function setVisibility(visible) {
  const popel = document.getElementById('o-popup');
  const { style } = popel;
  if (visible) {
    style.display = 'block';
  } else {
    style.display = 'none';
  }
}

function setTitle(title) {
  const popel = document.getElementById('o-card-title');
  popel.innerHTML = title;
}

function insertContent(content) {
  const popel = document.getElementById('o-popup').getElementsByClassName('o-card-content')[0];
  popel.innerHTML = content;
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

function closePopup() {
  setVisibility(false);
  Featureinfo().clear();
}

function bindUIActions() {
  const closeel = document.querySelector('#o-popup .o-popup #o-close-button');
  closeel.addEventListener('click', (evt) => {
    closePopup();
    evt.preventDefault();
  });
}

export default function popup(target) {
  render(target);
  bindUIActions();
  return {
    getEl,
    setVisibility,
    setTitle,
    setContent,
    closePopup
  };
}
