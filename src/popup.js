import { dom } from './ui';

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

/**
 * Closes the window and optionally calls a callback set at init
 * @param {any} cb
 */
function closePopupInternal(cb) {
  setVisibility(false);
  if (cb) {
    cb();
  }
}

/**
 * Creates a new popup and adds it to the dom.
 * @param {any} target id of parent DOM object
 * @param {Object} opts options.
 * @param {function} opts.closeCb Function without parameters to be called when popup is closed from close button.
 */
export default function popup(target, opts = {}) {
  const {
    closeCb
  } = opts;

  function bindUIActions() {
    const closeel = document.querySelector('#o-popup .o-popup #o-close-button');
    closeel.addEventListener('click', (evt) => {
      closePopupInternal(closeCb);
      evt.preventDefault();
    });
  }

  render(target);
  bindUIActions();

  return {
    getEl,
    setVisibility,
    setTitle,
    setContent,
    closePopup: () => {
      closePopupInternal(closeCb);
    }
  };
}
