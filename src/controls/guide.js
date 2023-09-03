import { Component, Modal, Button, Icon } from '../ui';
import stripJSONComments from '../utils/stripjsoncomments';

const Guide = function Guide(options = {}) {
  const contentItems = [];
  const {
    title = 'Guide',
    cls,
    style
  } = options;

  let viewer;
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

  const getActiveControls = async () => {
    const configUrl = `${window.location.href}${viewer.getMapName()}`;
    try {
      const response = await fetch(configUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
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

  const getGuideConfig = async () => {
    const configUrl = `${window.location.href}guide.json`;
    try {
      const response = await fetch(configUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error: ${error}`);
      return null;
    }
  };

  const createContent = async () => {
    let groupItems = [];
    const userDefinedControl = { name: 'new control' };
    const controlsToRender = [];
    const activeControls = await getActiveControls();
    activeControls.push(userDefinedControl);
    const guideConfigControls = await getGuideConfig();
    // Make sure only active controls render in guide
    activeControls.forEach(activeControl => {
      const filterGuideConfigControls = guideConfigControls.filter((el) => el.name === activeControl.name || el.name === '');
      controlsToRender.push(...filterGuideConfigControls);
    });
    // Sort controls by guide config order
    controlsToRender.sort((a, b) => guideConfigControls.indexOf(a) - guideConfigControls.indexOf(b));
    controlsToRender.forEach(controlToRender => {
      if ('group' in controlToRender) {
        controlToRender.group.forEach(groupItem => {
          const groupItemIcon = Icon({
            icon: groupItem.icon
          });
          const groupEl = `<li class="flex o-guide text-align-left"><span class="flex icon icon-small">${groupItemIcon.render()}</span>${groupItem.description}</li>`;
          groupItems.push(groupEl);
        });
      } else if (!('group' in controlToRender)) {
        groupItems = [];
      }
      const targetValue = controlToRender.target;
      const descriptionValue = controlToRender.description;
      const iconValue = controlToRender.icon;
      const controlIcons = Icon({
        icon: iconValue
      });
      const listEl = `<li id="${targetValue}" class="o-guide text-align-left"><span class="flex icon icon-small">${controlIcons.render()}</span>${descriptionValue}<ul class="margin-right-large padding-left-largest padding-top-large padding-bottom-large">${groupItems.join(' ')}</ul></li>`;
      contentItems.push(listEl);
    });
  };

  const moveButtons = () => {
    const nextButtonHtml = nextButton.render();
    const prevButtonHtml = prevButton.render();
    content += nextButtonHtml;
    content += prevButtonHtml;
    return content;
  };

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

  const updateDisplayedItem = (prevElSelector) => {
    const currentElClass = items.at(currentIndex).id ? `.${items.at(currentIndex).id}` : false;
    const currentEl = document.querySelectorAll(currentElClass)[0];
    const prevEl = document.querySelectorAll(prevElSelector)[0];
    items.forEach((item, index) => {
      const itm = item;
      if (index === currentIndex) {
        itm.style.display = 'flex';
      } else {
        itm.style.display = 'none';
      }
    });
    if (prevEl && prevEl !== undefined) {
      prevEl.classList.remove('o-guide-target');
    }
    if (currentEl && currentEl !== undefined) {
      currentEl.classList.add('o-guide-target');
    }
  };

  const createModal = async (modalContent) => {
    content = modalContent;
    await createContent();
    if (!hideButton) {
      component.addComponent(nextButton);
      component.addComponent(prevButton);
      content = `<ul id="o-guide-slides-container">${contentItems.join(' ')}</ul>`;
      content = moveButtons();
    }
    if (hideButton) {
      setLocalStorage();
      component.addComponent(nextButton);
      component.addComponent(prevButton);
      component.addComponent(hideButton);
      content = `<ul id="o-guide-slides-container">${contentItems.join(' ')}</ul>`;
      content = moveButtons();
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
      component.dispatch('render');
    }
    list = document.getElementById('o-guide-slides-container');
    items = Array.from(list.children);
    updateDisplayedItem();
    const currentIndexElId = items[0].id;
    const currentEl = document.querySelectorAll(`.${currentIndexElId}`)[0];
    currentEl.classList.add('o-guide-target');
  };

  return Component({
    name: 'guide',
    onInit() {
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
            prevElClass = items.at(currentIndex - 1).id ? `.${items.at(currentIndex - 1).id}` : false;
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
            prevElClass = items.at(currentIndex - 1).id ? `.${items.at(currentIndex + 1).id}` : false;
            updateDisplayedItem(prevElClass);
          }
        }
      });
    },
    onAdd(evt) {
      component = this;
      viewer = evt.target;
      target = viewer.getId();
      contentKey = `guideContent;${window.location.pathname};${viewer.getMapName().split('.')[0]}`;
      visibilityKey = `guideVisibility;${window.location.pathname};${viewer.getMapName().split('.')[0]}`;
      createModal(content);
    }
  });
};

export default Guide;
