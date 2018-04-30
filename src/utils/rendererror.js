import $ from 'jquery';
import utils from '../utils';

export default function renderError(type, el) {
  if (type === 'browser') {
    renderBrowserError(el);
  }

  function renderBrowserError(el) {
    var message = 'Det ser ut som att du använder en föråldrad webbläsare. Prova att uppgradera din webbläsare för att visa kartan.'
    var elMessage = utils.createElement('div', message, {
      cls: 'o-no-map-message'
    });
    var container = utils.createElement('div', elMessage, {
      cls: 'o-no-map'
    });
    $(function() {
      $(el).append(container);
    });
  }
}
