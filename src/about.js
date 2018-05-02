import $ from 'jquery';
import utils from './utils';
import modal from './modal';

let $aboutButton;
let buttonText;
let title;
let content;

function init(opt) {
  const options = opt || {};
  buttonText = options.buttonText || 'Om kartan';
  title = options.title || 'Om kartan';
  content = options.content || '<p></p>';

  render();
  bindUIActions();
}

function render() {
  const el = utils.createListButton({
    id: 'o-about',
    iconCls: 'o-icon-fa-info-circle',
    src: '#fa-info-circle',
    text: buttonText
  });
  $('#o-menutools').append(el);
  $aboutButton = $('#o-about-button');
}

function bindUIActions() {
  $aboutButton.on('click', (e) => {
    modal.createModal('#o-map', {
      title,
      content
    });

    modal.showModal();
    e.preventDefault();
  });
}

export default init;
