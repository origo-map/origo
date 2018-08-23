import $ from 'jquery';

function render(target) {
  const pop = `<div id="o-popup">
  <div class="o-popup o-card">
    <div class="o-close-button"><svg class="o-icon-fa-times"><use xlink:href="#fa-times"></use></svg></div>
    <div class="o-card-title"></div>
    <div class="o-card-content"></div>
  </div>
</div>`;
  $(target).append(pop);
}

function getEl() {
  return $('#o-popup').get(0);
}

function setVisibility(visible) {
  if (visible) {
    $('#o-popup').css('display', 'block');
  } else {
    $('#o-popup').css('display', 'none');
  }
}

function setTitle(title) {
  $('#o-popup .o-card-title').html(title);
}

function setContent(config) {
  if (config.title) {
    $('#o-popup .o-popup .o-card-title').html(config.title);
  } else {
    $('#o-popup .o-popup .o-card-title').html('');
  }
  if (config.content) {
    $('#o-popup .o-popup .o-card-content').html(config.content);
  } else {
    $('#o-popup .o-popup .o-card-content').html('');
  }
}

function closePopup() {
  setVisibility(false);
}

function bindUIActions() {
  $('#o-popup .o-popup .o-close-button').on('click', (evt) => {
    closePopup();
    evt.preventDefault();
  });
}

export default function (target) {
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
