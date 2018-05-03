import $ from 'jquery';
import modal from './modal';
import viewer from './viewer';

const defaultTitle = 'Om kartan';
const defaultContent = '<p></p>';
const cls = 'o-splash';
let title;
let content;

function init(opt_options) {
  const options = opt_options || {};
  title = options.title || defaultTitle;
  if (options.url) {
    const url = viewer.getBaseUrl() + options.url;
    getContent(url)
      .done((data) => {
        content = data;
        openModal();
      });
  } else {
    content = options.content || defaultContent;
    openModal();
  }
}

function getContent(url) {
  return $.get(url);
}

function openModal() {
  modal.createModal('#o-map', {
    title,
    content,
    cls
  });
  modal.showModal();
}

export default { init };
