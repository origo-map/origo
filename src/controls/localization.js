import enLocale from '../loc/en_US.json';
import svLocale from '../loc/sv_SE.json';
import { Component, Button, Element, Collapse } from '../ui';

const Localization = function Localization(options = {}) {
  const {
    localeId, // name of an existing locale imported above
    fallbackLocaleId = 'sv-SE',
    showLocMenu = false
  } = options;

  let localizationMenu;
  let viewer;
  let locMenuId;

  let currentLocaleId = localeId || fallbackLocaleId;

  const locales = {
    'en-US': enLocale,
    'sv-SE': svLocale
  };

  function getLocaleExists(locId) {
    return Object.hasOwn(locales, locId);
  }
  function getStoredLocales() {
    return JSON.parse(localStorage.getItem('origoAddedLocales') || '[]');
  }

  const storedLocales = getStoredLocales();

  // if there are local-stored locales at startup then add these locally
  if (storedLocales.length > 0) {
    storedLocales.forEach(locale => {
      locales[locale.id] = locale;
    });
  }

  // if there is an origoSelectedLocale locale specification in local storage then use that
  const origoSelectedLocale = localStorage.getItem('origoSelectedLocale');
  if (origoSelectedLocale) {
    if (getLocaleExists(origoSelectedLocale)) {
      currentLocaleId = origoSelectedLocale;
    }
  }

  function setStoredLocales(localLocales) {
    localStorage.setItem('origoAddedLocales', JSON.stringify(localLocales));
  }

  function drawLocMenu(redraw = false) {
    if (redraw) {
      document.getElementById(locMenuId).remove();
    }
    const mapMenu = viewer.getControlByName('mapmenu');
    // eslint-disable-next-line no-use-before-define
    localizationMenu = createLocalizationMenu();
    mapMenu.appendMenuItem(localizationMenu);
    localizationMenu.onRender();
    locMenuId = localizationMenu.getId();
  }

  /**
 * Adds an array of locales to the locales object and stores them in localStorage.
 *
 * @param {Array} locs - An array of locale objects to be added. Defaults to an empty array if not provided.
 * If a locale id matches a current locale then the current locale will be overwritten.
 * @return {boolean} True if locales were added, false otherwise.
 */
  function addLocales(locs = []) {
    if (locs.length > 0) {
      locs.forEach(locale => { // replace if locale already appears to exist (id)
        locales[locale.id] = locale;
        const matchedLocaleIndex = storedLocales.findIndex(storedLocale => storedLocale.id === locale.id);
        if (matchedLocaleIndex > -1) {
          storedLocales[matchedLocaleIndex] = locale;
        } else storedLocales.push(locale);
      });
      setStoredLocales(storedLocales);
      drawLocMenu(true);
      localizationMenu.expand(); // to illustrate that there's a new locale available, expand the localization menu
      return true;
    }
    return false;
  }

  function getLocale(locId = currentLocaleId) {
    if (Object.hasOwn(locales, locId)) {
      return locales[locId];
    } return false;
  }

  function getCurrentLocaleId() {
    return currentLocaleId;
  }

  // setLocale only changes currentLocaleId if the proposed locale exists and if origoSelectedLocale is not already in local storage.
  function setLocale(locId) {
    if (getLocaleExists(locId)) {
      if (!origoSelectedLocale) {
        currentLocaleId = locId;
        return true;
      }
    } return false;
  }

  /**
   * Adds a new plugin language object to the specified existing locale.
   *
   * @param {string} locId - The ID of the locale to add the plugin to.
   * @param {object} additionObj - The plugin language object to add to the locale.
   * @return {boolean} True if the plugin language object was added, false otherwise.
   */
  function addPluginToLocale(locId, additionObj) {
    if (getLocaleExists(locId)) {
      locales[locId].plugins = { ...locales[locId].plugins, ...additionObj };
      return true;
    } return false;
  }

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
      iconCls: 'rotate'
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
          localStorage.setItem('origoSelectedLocale', loc.id);
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
    addPluginToLocale,

    onAdd(evt) {
      viewer = evt.target;
      if (showLocMenu) {
        drawLocMenu();
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
