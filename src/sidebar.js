import $ from 'jquery';

function setVisibility(visible) {
  if (visible) {
    $('#o-sidebar').addClass('o-sidebar-show');
  } else {
    $('#o-sidebar').removeClass('o-sidebar-show');
  }
}

function closeSidebar() {
  setVisibility(false);
}

function bindUIActions() {
  $('#o-sidebar .o-sidebar .o-close-button').on('click', (evt) => {
    closeSidebar();
    evt.preventDefault();
  });
}

function setTitle(title) {
  $('#o-sidebar .o-card-title').html(title);
}

function setContent(config) {
  if (config.title) {
    $('#o-sidebar .o-sidebar .o-card-title').html(config.title);
  } else {
    $('#o-sidebar .o-sidebar .o-card-title').html('');
  }
  if (config.content) {
    $('#o-sidebar .o-sidebar .o-card-content').html(config.content);
  } else {
    $('#o-sidebar .o-sidebar .o-card-content').html('');
  }
}

function init() {
  const el = `<div id="o-sidebar">
    <div class="o-sidebar o-card">
    <div class="o-close-button"><svg class="o-icon-fa-times"><use xlink:href="#fa-times"></use></svg></div>
    <div class="o-card-title"></div>
    <div class="o-card-content"></div>
    </div>
    </div>`;
  $('#o-map').append(el);

  bindUIActions();
}

export default {
  init,
  setVisibility,
  setTitle,
  setContent,
  closeSidebar
};
