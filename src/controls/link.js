import $ from 'jquery';
import utils from '../utils';

let url;
let title;
let $linkButton;

function render() {
  const el = utils.createListButton({
    id: 'o-link',
    iconCls: 'o-icon-fa-external-link',
    src: '#fa-external-link',
    text: title

  });
  $('#o-menutools').append(el);
  $linkButton = $('#o-link-button');
}

function bindUIActions() {
  $linkButton.on('click', () => {
    window.open(url);
  });
}

function init(optOptions) {
  const options = optOptions || {};
  url = options.url;
  title = options.title;

  render();
  bindUIActions();
}

export default { init };
