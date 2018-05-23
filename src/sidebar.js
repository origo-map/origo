import $ from 'jquery';

let sidebar;

function init() {
  const el = `<div id="o-sidebar">
    <div class="o-sidebar o-card">
    <div class="o-close-button"><svg class="o-icon-fa-times"><use xlink:href="#fa-times"></use></svg></div>
    <div class="o-card-title"></div>
    <div class="o-card-content"></div>
    </div>
    </div>`;
  $('#o-map').append(el);
  sidebar = $('#o-sidebar');

  bindUIActions();
}

function bindUIActions() {
  $('#o-sidebar .o-sidebar .o-close-button').on('click', (evt) => {
    closeSidebar();
    evt.preventDefault();
  });
}

function setVisibility(visible) {
  if (visible) {
    $('#o-sidebar').addClass('o-sidebar-show');
  } else {
    $('#o-sidebar').removeClass('o-sidebar-show');
  }
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

function closeSidebar() {
  setVisibility(false);
}

export default {
  init,
  setVisibility,
  setTitle,
  setContent,
  closeSidebar
};
