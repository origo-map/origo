import Origo from '../../origo';
import { Component, Modal, Button, Icon } from '../ui';
import stripJSONComments from '../utils/stripjsoncomments';
import isEmbedded from '../utils/isembedded';

const Guide = function Guide(options = {}) {
  const contentItems = [];
  const {
    title = 'Guide',
    mapConfigUrl,
    guideConfigUrl
  } = options;
  let {
    target
  } = options;
  let viewer;
  let nextButton;
  let prevButton;
  let modal;
  let component;
  let content;
  let items;
  let currentIndex = 0;
  let list;
  let prevElClass;
  let contentCreated = false;
  let menuItem;
  let mapMenu;

  // Fetches the controls defined in json configuration and origos default controls
  const getActiveControls = async () => {
    const configUrl = mapConfigUrl || `${window.location.href}${viewer.getMapName()}`;
    try {
      const response = await fetch(configUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}\nCould not GET origo configuration`);
      }
      const strippedOfComments = stripJSONComments(await response.text());
      const data = JSON.parse(strippedOfComments);
      // eslint-disable-next-line no-undef
      const defaultControls = Origo().getConfig().defaultControls;
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
    const configUrl = guideConfigUrl || `${window.location.href}guide.json`;
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
      if (currentIndex === 0) {
        document.getElementById(prevButton.getId()).classList.add('hidden');
      } else {
        document.getElementById(prevButton.getId()).classList.remove('hidden');
      }
      if (currentIndex === items.length - 1) {
        document.getElementById(nextButton.getId()).classList.add('hidden');
      } else {
        document.getElementById(nextButton.getId()).classList.remove('hidden');
      }
    });
    prevEl.classList.remove('o-guide-target');
    currentEl.classList.add('o-guide-target');
  };

  // Creates the guide modal with its buttons and content
  const createModal = async () => {
    if (!contentCreated) {
      await createContent();
    }
    contentCreated = true;
    component.addComponents([nextButton, prevButton]);
    content = `<ul id="o-guide-slides-container">${contentItems.join(' ')}</ul>`;
    content = moveButtons();
    modal = Modal({
      title,
      content,
      cls: 'guideModal',
      target,
      style: 'text-align: center'
    });
    component.dispatch('render');
    list = document.getElementById('o-guide-slides-container');
    items = Array.from(list.children);
    updateDisplayedItem();

    // Observers if guide modal is removed from DOM and sets the proper state to guide menu item
    const observer = new MutationObserver((mutationsList) => {
      mutationsList.forEach((mutation) => {
        mutation.removedNodes.forEach((removedNode) => {
          if (removedNode.id === modal.getId()) {
            menuItem.getComponents()[0].setState('initial');
            observer.disconnect();
          }
        });
      });
    });
    observer.observe(document.getElementsByClassName('o-main')[0], { subtree: false, childList: true });
  };

  return Component({
    name: 'guide',
    onAdd(evt) {
      component = this;
      viewer = evt.target;
      target = document.querySelectorAll('.o-main')[0].id;
      mapMenu = viewer.getControlByName('mapmenu');
      menuItem = mapMenu.MenuItem({
        click() {
          if (this.getState() === 'initial') {
            createModal();
            this.setState('active');
          } else if (this.getState() === 'active') {
            modal.closeModal();
            this.setState('initial');
          }
          mapMenu.close();
        },
        icon: '#ic_routes_24px',
        title,
        ariaLabel: title
      });
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
      this.addComponents([menuItem]);
      this.render();
    },
    render() {
      mapMenu.appendMenuItem(menuItem);
      this.dispatch('render');
    }
  });
};

export default Guide;
