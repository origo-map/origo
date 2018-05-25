import $ from 'jquery';
import modal from '../modal';
import mapmenu from './mapmenu';
import utils from '../utils';
import permalink from '../permalink/permalink';

let shareButton;


function createContent() {
  return '<div class="o-share-link"><input type="text"></div>' +
    '<i>Kopiera och klistra in länken för att dela kartan.</i>';
}

function createLink() {
  const url = permalink.getPermalink();
  $('.o-share-link input').val(url).select();
}

function bindUIActions() {
  shareButton.on('click', (e) => {
    modal.createModal('#o-map', {
      title: 'Länk till karta',
      content: createContent()
    });
    modal.showModal();
    createLink(); // Add link to input
    mapmenu.toggleMenu();
    e.preventDefault();
  });
}

function init() {
  const el = utils.createListButton({
    id: 'o-share',
    iconCls: 'o-icon-fa-share-square-o',
    src: '#fa-share-square-o',
    text: 'Dela karta'
  });
  $('#o-menutools').append(el);
  shareButton = $('#o-share-button');
  bindUIActions();
}

export default { init };
