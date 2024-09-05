import enLocale from '../loc/en_US.json';
import svLocale from '../loc/sv_SE.json';
import { Component, Button, Element, Collapse } from '../ui';

const Localization = function Localization(options = {}) {
  const {
    localeId, // name of an existing locale imported above
    fallbackLocaleId = 'sv-SE',
    showLocMenu = true
  } = options;

  let localizationMenu;
  let viewer;

  let currentLocaleId = localeId || fallbackLocaleId;

  const locales = {
    'en-US': enLocale,
    'sv-SE': svLocale
  };

  function getLocaleExists(locId) {
    return Object.hasOwn(locales, locId);
  }
  function getStoredLocales() {
    return JSON.parse(sessionStorage.getItem('addedLocales') || '[]');
  }

  const storedLocales = getStoredLocales();

  // if there are stored locales at (re)startup then add these locally
  if (storedLocales.length > 0) {
    storedLocales.forEach(locale => {
      locales[locale.id] = locale;
    });
  }

  function setStoredLocales(sessionLocales) {
    sessionStorage.setItem('addedLocales', JSON.stringify(sessionLocales));
  }

  /**
 * Adds an array of locales to the locales object and stores them in sessionStorage.
 *
 * @param {Array} locs - An array of locale objects to be added. Defaults to an empty array if not provided.
 * @return {void} This function does not return anything.
 */
  function addLocales(locs = []) {
    if (locs.length > 0) {
      locs.forEach(locale => {
        if (!(getLocaleExists(locale.id))) {
        // locales[locale.id] = locale; // Not useful in the current reload-to-apply solution
          storedLocales.push(locale);
        }
      });
    }
    setStoredLocales(storedLocales);
    window.location.reload();
  }

  function getLocale(locId = currentLocaleId) {
    if (Object.hasOwn(locales, locId)) {
      return locales[locId];
    } return false;
  }

  function getCurrentLocaleId() {
    return currentLocaleId;
  }

  function setLocale(locId) {
    if (getLocaleExists(locId)) {
      currentLocaleId = locId;
      return true;
    } return false;
  } // returns true if the provided locId exists in the locales object else false

  const recursiveSearch = ({ obj, objName = undefined, targetParentKey = undefined, targetKey }) => {
    if (obj === null || obj === undefined) {
      return undefined;
    }
    let result;
    const keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      // base case
      if ((key === targetKey) && ((targetParentKey === undefined) || (objName === targetParentKey))) {
        result = obj[key];
        break;
      }

      // recursive case
      const value = obj[key];
      if (typeof value === 'object') {
        result = recursiveSearch({ obj: value, objName: key, targetParentKey, targetKey });
        if (result !== undefined) {
          break;
        }
      }
      // case leaf that doesn't match, next key of the current object.. (iteration in the for-loop)
    }
    return result;
  };

  function getStringByKeys({ targetParentKey, targetKey }) {
    // first call of recursiveSearch may have a targetParentKey and won't have an objName since the top level of the json object
    let result = recursiveSearch({ obj: getLocale(currentLocaleId), targetParentKey, targetKey });
    if (!(result) && (localeId !== fallbackLocaleId)) {
      result = recursiveSearch({ obj: getLocale(fallbackLocaleId), targetParentKey, targetKey });
    }
    return result;
  }

  // UI bits start ----->

  function createCollapseHeader() {
    const headerButton = Button({
      cls: 'icon-smaller compact no-grow o-tooltip',
      icon: '#ic_chevron_right_24px',
      iconCls: 'rotate',
      style: {
        'align-self': 'flex-end'
      }
    });

    const headerTitleCmp = Component({
      render() { // the title of the dropdown needs localization too
        return `<div id="${this.getId()}" class="grow padding-left">${getStringByKeys({ targetKey: 'menuTitle' })}</div>`;
      }
    });

    return Component({
      onRender() {
        const el = document.getElementById(this.getId());
        el.addEventListener('click', () => {
          const customEvt = new CustomEvent('collapse:toggle', {
            bubbles: true
          });
          el.blur();
          el.dispatchEvent(customEvt);
        });
      },
      render() {
        return `<li id="${this.getId()}" class="flex row align-center padding-x padding-y-smaller hover pointer collapse-header" style="width: 100%;">
                  ${headerButton.render()}
                  ${headerTitleCmp.render()}
                </li>`;
      }
    });
  }

  function createLocItem(loc) {
    let locTextCmpClasses = 'grow padding-left-larger';
    if (loc.id === currentLocaleId) {
      locTextCmpClasses = `${locTextCmpClasses} localization-selected`;
    }
    const locTextCmp = Element({
      cls: locTextCmpClasses,
      innerHTML: loc.title,
      attributes: {
        data: {
          locale: loc.id
        }
      }
    });

    return Component({
      onRender() {
        const el = document.getElementById(this.getId());
        el.addEventListener('click', () => {
          if (loc.id === currentLocaleId) return;
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.set('loc', el.firstElementChild.dataset.locale);
          window.location.href = newUrl.href;
        });
      },
      render() {
        const classString = 'class="flex row align-center padding-x padding-y-smaller hover pointer';
        return `<li id="${this.getId()}" ${classString}">
        ${locTextCmp.render()}
      </li>`;
      }
    });
  }

  function createCollapseContent() {
    return Component({
      onInit() {
        Object.keys(locales).forEach(loc => {
          this.addComponent(createLocItem(locales[loc]));
        });
      },
      renderItems() {
        let linkItems = '';
        this.getComponents().forEach(contentCmp => {
          linkItems += contentCmp.render();
        });
        return linkItems;
      },
      render() {
        return `<ul id ="${this.getId()}" class="list margin-left">
                ${this.renderItems()}
              </ul>`;
      },
      onRender() {
        this.dispatch('render');
      }
    });
  }

  function createLocalizationMenu() {
    return Collapse({
      headerComponent: createCollapseHeader(),
      contentComponent: createCollapseContent(),
      collapseX: false,
      contentStyle: 'max-height: 300px; overflow-y: auto'
    });
  }

  // ------ UI bits end --/

  return Component({
    name: 'localization',
    getLocaleExists,
    getLocale,
    getStringByKeys,
    getCurrentLocaleId,
    addLocales,
    setLocale,

    onAdd(evt) {
      if (showLocMenu) {
        viewer = evt.target;
        const mapMenu = viewer.getControlByName('mapmenu');
        localizationMenu = createLocalizationMenu();
        mapMenu.appendMenuItem(localizationMenu);
        localizationMenu.onRender();
      }
    },
    onInit() {

    },
    render() {
      this.dispatch('render');
    }
  });
};
export default Localization;
