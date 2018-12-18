import 'core-js/fn/string/ends-with';
import 'core-js/fn/string/starts-with';
import 'core-js/fn/array/find';
import 'core-js/fn/array/includes';
import 'core-js/fn/array/is-array';
import 'core-js/fn/object/assign';
import 'core-js/fn/object/keys';
import 'core-js/fn/promise';

/**
 * Polyfills included in Origo aims to support ie11. Older versions of ie are not supported.
 * To get full coverage of polyfills in Origo it is required to use several polyfill sources.
 * When available, polyfills included in Babel are used. However Polyfills for fetch and
 * non ecma standard features are not available.
 * Polyfills in Origo are available in the global scope in order to help developing plugins
 * that are not part of the Origo core.
 * Fetch is provided in a webpack plugin.
 */

// Polyfill for CustomEvent from https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent
function CustomEvent(event, {
  bubbles = false,
  cancelable = false,
  detail = undefined
} = {}) {
  const evt = document.createEvent('CustomEvent');
  evt.initCustomEvent(event, bubbles, cancelable, detail);
  return evt;
}

// Polyfill for Element remove https://developer.mozilla.org/en-US/docs/Web/API/ChildNode/remove
function ElementRemove(arr) {
  arr.forEach((item) => {
    if ('remove' in item) {
      return;
    }
    Object.defineProperty(item, 'remove', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: function remove() {
        this.parentNode.removeChild(this);
      }
    });
  });
}

export default function polyfill() {
  if (typeof window.CustomEvent !== 'function') {
    CustomEvent.prototype = window.Event.prototype;
    window.CustomEvent = CustomEvent;
  }
  if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector;
  }
  ElementRemove([Element.prototype, CharacterData.prototype, DocumentType.prototype].filter(Boolean));
}

