import $ from 'jquery';
// eslint-disable-next-line import/no-cycle
import Featureinfo from './featureinfo';

function setVisibility(visible) {
  if (visible) {
    $('#o-sidebar').addClass('o-sidebar-show');
  } else {
    $('#o-sidebar').removeClass('o-sidebar-show');
  }
}

function closeSidebar() {
  setVisibility(false);
  Featureinfo().clear();
}

function bindUIActions() {
  $('#o-sidebar .o-sidebar #o-close-button').on('click', (evt) => {
    closeSidebar();
    evt.preventDefault();
  });
}

function setTitle(title) {
  $('#o-sidebar #o-card-title').html(title);
}

function setContent(config) {
  if (config.title) {
    $('#o-sidebar .o-sidebar #o-card-title').html(config.title);
  } else {
    $('#o-sidebar .o-sidebar #o-card-title').html('');
  }
  if (config.content) {
    $('#o-sidebar .o-sidebar .o-card-content').html(config.content);
  } else {
    $('#o-sidebar .o-sidebar .o-card-content').html('');
  }
}

function init(viewer) {
  const mapId = viewer.getId();
  const el = `<div id="o-sidebar">
    <div class="o-sidebar o-card">
        <div class="flex row justify-end">
          <div id="o-card-title" class="justify-start margin-y-smaller margin-left text-weight-bold width-full"></div>
          <button id="o-close-button" class="small round margin-top-smaller margin-bottom-auto margin-right-small icon-smallest grey-lightest no-shrink">
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
  $(`#${mapId}`).append(el);

  bindUIActions();
}

export default {
  init,
  setVisibility,
  setTitle,
  setContent,
  closeSidebar
};
