import { Component, Modal, Button, Icon, dom } from '../ui';
import utils from '../utils';
import stripJSONComments from '../utils/stripjsoncomments';
import isEmbedded from '../utils/isembedded';

const Guide = function Guide(options = {}) {
  const contentItems = [];
  const {
    title = 'Guide',
    cls,
    style,
    activeOnstart = false,
    url
  } = options;
  let viewer;
  let guideButton;
  let guideButtonEl;
  let hideButton;
  let nextButton;
  let prevButton;
  let modal;
  let component;
  let content;
  let contentKey;
  let visibilityKey;
  let items;
  let currentIndex = 0;
  let list;
  let prevElClass;
  let {
    target,
    hideButtonVisible,
    hideText,
    confirmText
  } = options;

  // Fetches the controls defined in json configuration and origos default controls
  const getActiveControls = async () => {
    const configUrl = `${window.location.href}${viewer.getMapName()}`;
    try {
      const response = await fetch(configUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}\nCould not GET origo configuration`);
      }
      const strippedOfComments = stripJSONComments(await response.text());
      const data = JSON.parse(strippedOfComments);
      // eslint-disable-next-line no-undef
      const defaultControls = origo.getConfig().defaultControls;
      const configControls = data.controls;
      const activeControls = defaultControls.concat(configControls);
      return activeControls;
    } catch (error) {
      console.error(`Error: ${error}`);
      return null;
    }
  };

  // Fetches the configuration json for guide
  const getGuideConfig = async () => {
    const configUrl = url || `${window.location.href}guide.json`;
    try {
      const response = await fetch(configUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}\nPlease configure url to guide.json or place it in application root`);
      }
      const strippedOfComments = stripJSONComments(await response.text());
      const data = JSON.parse(strippedOfComments);
      return data;
    } catch (error) {
      console.error(`Error: ${error}`);
      return null;
    }
  };

  // Filters and creates the content of the guide modal
  const createContent = async () => {
    let targetValue;
    let groupItems = [];
    const controlsToRender = [];
    const activeControls = await getActiveControls();
    const guideConfigControls = await getGuideConfig();
    // If map is embedded and controls hideWhenEmbedded is true, they are excluded from the guide
    const filterEmbedded = activeControls.map(activeControl => {
      const ifOptions = activeControl.options;
      if (ifOptions && ifOptions.hideWhenEmbedded && isEmbedded(viewer.getTarget())) {
        return {};
      }
      return activeControl;
    });

    const getActiveControlNames = filterEmbedded.map(obj => obj.name);
    function filterControlsByName(dataArray, namesToFilter) {
      const filtredControls = dataArray.filter(item => {
        if (namesToFilter.includes(item.name)) {
          return true;
        } else if (item.group) {
          // eslint-disable-next-line no-param-reassign
          item.group = filterControlsByName(item.group, namesToFilter);
          return true;
        }
        return false;
      });
      return filtredControls;
    }

    const filtredControls = filterControlsByName(guideConfigControls, getActiveControlNames);
    controlsToRender.push(...filtredControls);
    // Sort controls by guide config order
    controlsToRender.sort((a, b) => guideConfigControls.indexOf(a) - guideConfigControls.indexOf(b));
    // Creates nested group if configured
    controlsToRender.forEach(controlToRender => {
      // Sets the guides target control
      targetValue = controlToRender.target;

      // Specials, targets for different controls configured initial state.
      // Could this be configured with method in guide.json instead or both?
      if (controlToRender.name === 'legend' && 'expanded' in viewer.getControlByName('legend').options && !viewer.getControlByName('legend').options.expanded) {
        targetValue = 'o-legend-btn';
      }
      if (controlToRender.name === 'bookmarks' && !viewer.getControlByName('bookmarks').options.isActive) {
        targetValue = 'o-bookmarks-btn';
      }
      if (!isEmbedded(viewer.getTarget()) && 'group' in controlToRender) {
        const indx = controlToRender.group.findIndex(v => v.name === 'fullscreen');
        controlToRender.group.splice(indx, indx >= 0 ? 1 : 0);
      }

      // Creates the nested groups
      if ('group' in controlToRender) {
        controlToRender.group.forEach(groupItem => {
          const groupItemIcon = Icon({
            icon: groupItem.icon
          });
          const groupEl = `<li class="flex o-guide text-align-left margin-bottom-small"><span class="flex icon icon-small">${groupItemIcon.render()}</span>${groupItem.description}</li>`;
          groupItems.push(groupEl);
        });
      } else if (!('group' in controlToRender)) {
        groupItems = [];
      }

      // Creates the content of slides for modal
      const descriptionValue = controlToRender.description;
      const iconValue = controlToRender.icon;
      const controlIcons = Icon({
        icon: iconValue
      });
      const listEl = `<li id="${targetValue}" class="o-guide text-align-left"><span class="flex icon icon-small">${controlIcons.render()}</span>${descriptionValue}<ul class="margin-right-large padding-left-largest padding-top-large padding-bottom-large">${groupItems.join(' ')}</ul></li>`;
      contentItems.push(listEl);
    });
  };

  // Adds previous and next buttons
  const moveButtons = () => {
    const nextButtonHtml = nextButton.render();
    const prevButtonHtml = prevButton.render();
    content += nextButtonHtml;
    content += prevButtonHtml;
    return content;
  };
  // Adds the hide button
  const addHideButton = () => {
    const hideButtonHtml = hideButton.render();
    content += hideButtonHtml;
    return content;
  };
  const clearLocalStorage = () => {
    localStorage.removeItem(visibilityKey);
    localStorage.removeItem(contentKey);
  };
  const setLocalStorage = () => {
    const newContent = localStorage.getItem(contentKey) !== content;
    if (localStorage.getItem(visibilityKey) !== 'false' || content) {
      localStorage.setItem(contentKey, content);
      if (newContent) {
        localStorage.setItem(visibilityKey, 'true');
      }
    }
  };

  // Uppdates the sliders item to show and toggles the animation for target control
  const updateDisplayedItem = (prevElSelector) => {
    const currentElClass = items.at(currentIndex).id ? `${items.at(currentIndex).id}` : false;
    const currentEl = document.querySelectorAll(`.${currentElClass}`)[0] || document.querySelector(`#${currentElClass}`);
    const prevEl = document.querySelectorAll(`.${prevElSelector}`)[0] || document.querySelector(`#${prevElSelector}`);
    items.forEach((item, index) => {
      const itm = item;
      if (index === currentIndex) {
        itm.style.display = 'flex';
      } else {
        itm.style.display = 'none';
      }
    });
    prevEl.classList.remove('o-guide-target');
    currentEl.classList.add('o-guide-target');
  };

  // Creates the guide modal with its buttons and content
  const createModal = async () => {
    await createContent();
    component.addComponents([nextButton, prevButton]);
    content = `<ul id="o-guide-slides-container">${contentItems.join(' ')}</ul>`;
    content = moveButtons();
    if (hideButton) {
      setLocalStorage();
      component.addComponents([hideButton]);
      content = addHideButton();
    } else {
      clearLocalStorage();
    }
    if (localStorage.getItem(visibilityKey) !== 'false') {
      modal = Modal({
        title,
        content,
        cls,
        target,
        style: `text-align: center;${style}`
      });
      if (!modal) {
        component.dispatch('render');
      }
    }
    list = document.getElementById('o-guide-slides-container');
    items = Array.from(list.children);
    updateDisplayedItem();
  };

  return Component({
    name: 'guide',
    onInit() {
      guideButton = Button({
        icon: '#fa-signs-post',
        cls: 'o-guide-btn control icon-smaller medium round light',
        tooltipText: title,
        tooltipPlacement: 'east',
        click() {
          createModal();
        }
      });
      if (options.hideButton) {
        hideButtonVisible = Object.prototype.hasOwnProperty.call(options.hideButton, 'visible') ? options.hideButton.visible : false;
        hideText = Object.prototype.hasOwnProperty.call(options.hideButton, 'hideText') ? options.hideButton.hideText : 'Visa inte igen';
        confirmText = Object.prototype.hasOwnProperty.call(options.hideButton, 'confirmText') ? options.hideButton.confirmText : 'Är du säker på att du inte vill se guiden igen?';
      }
      if (hideButtonVisible) {
        hideButton = Button({
          cls: 'rounded margin-top-small padding-y grey-lightest',
          style: 'display: inline-block;',
          text: hideText,
          click() {
            const proceed = window.confirm(confirmText);
            if (proceed) {
              const currentTarget = document.querySelectorAll('.o-guide-target')[0];
              currentTarget.classList.remove('o-guide-target');
              modal.closeModal();
              localStorage.setItem(visibilityKey, false);
            }
          }
        });
      }
      nextButton = Button({
        cls: 'rounded margin-top-small padding-y icon-small hover',
        style: 'float: right',
        icon: '#fa-circle-chevron-right',
        click() {
          list = document.getElementById('o-guide-slides-container');
          items = Array.from(list.children);
          if (currentIndex < items.length - 1) {
            currentIndex += 1;
            prevElClass = items.at(currentIndex - 1).id ? `${items.at(currentIndex - 1).id}` : false;
            updateDisplayedItem(prevElClass);
          }
        }
      });
      prevButton = Button({
        cls: 'rounded margin-top-small padding-y icon-small hover',
        style: 'float: left',
        icon: '#fa-circle-chevron-left',
        click() {
          list = document.getElementById('o-guide-slides-container');
          items = Array.from(list.children);
          if (currentIndex > 0) {
            currentIndex -= 1;
            prevElClass = items.at(currentIndex - 1).id ? `${items.at(currentIndex + 1).id}` : false;
            updateDisplayedItem(prevElClass);
          }
        }
      });
    },
    onAdd(evt) {
      component = this;
      viewer = evt.target;
      target = document.querySelectorAll('.o-main')[0].id;
      contentKey = `guideContent;${window.location.pathname};${viewer.getMapName().split('.')[0]}`;
      visibilityKey = `guideVisibility;${window.location.pathname};${viewer.getMapName().split('.')[0]}`;
      if (activeOnstart) {
        createModal();
      }
      this.addComponents([guideButton]);
      this.render();
    },
    render() {
      guideButtonEl = dom.html(guideButton.render());
      document.getElementById(`${viewer.getMain().getMapTools().getId()}`).appendChild(guideButtonEl);
      this.dispatch('render');
    }
  });
};

export default Guide;
