import $ from 'jquery';

export default function isEmbedded(target) {
  if (window.top !== window.self || $(target).parent().is('BODY') === false) {
    return true;
  }
  return false;
}
