import { simpleExportHandler, layerSpecificExportHandler } from './infowindow_exporthandler';
import exportToFile from './utils/exporttofile';
import { Component, Collapse, CollapseHeader, dom, Button } from './ui';

let parentElement;
let mainContainer;
let urvalContainer;
let sublists;
let subexports;
let urvalElements;
let urvalElementContents;
let expandableContents;
let exportOptions;
let activeSelectionGroup;
let selectionManager;
let viewer;
let infowindowOptions;

function createSvgElement(id, className) {
  const svgContainer = document.createElement('div');
  const svgElem = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const useElem = document.createElementNS('http://www.w3.org/2000/svg', 'use');

  svgElem.setAttribute('class', className); // this instead of above line to support ie!
  useElem.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', `#${id}`);
  svgElem.appendChild(useElem);
  svgContainer.appendChild(svgElem);
  svgContainer.classList.add(`${className}-container`);

  return svgContainer;
}

const debounceTimeout = [];
function debounce(func, id) {
  if (debounceTimeout[id]) clearTimeout(debounceTimeout[id]);
  debounceTimeout[id] = setTimeout(() => {
    func();
  }, 50);
}

function toggleExpandCollapse() {
  const visibleGroups = [];
  urvalElements.forEach(cmp => {
    const el = document.getElementById(cmp.getId());
    if (!el.classList.contains('hidden')) {
      visibleGroups.push({ cmp, el });
    }
  });

  visibleGroups.forEach(group => {
    if (visibleGroups.length === 1) {
      // Debounce needed due to race condition in rendering expand/collaps animation.
      debounce(() => group.cmp.getComponents()[0].expand(), group.cmp.getId());
    } else {
      // Debounce needed due to race condition in rendering expand/collaps animation.
      debounce(() => group.cmp.getComponents()[0].collapse(), group.cmp.getId());
    }
  });
}

function hideInfowindow() {
  mainContainer.classList.add('hidden');
}

function showInfowindow() {
  toggleExpandCollapse();
  mainContainer.classList.remove('hidden');
}

function makeElementDraggable(elm) {
  const elmnt = elm;
  let pos1 = 0;
  let pos2 = 0;
  let pos3 = 0;
  let pos4 = 0;

  function elementDrag(evt) {
    const e = evt || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top = `${elmnt.offsetTop - pos2}px`;
    elmnt.style.left = `${elmnt.offsetLeft - pos1}px`;
  }

  function closeDragElement() {
    /* stop moving when mouse button is released: */
    document.onmouseup = null;
    document.onmousemove = null;
  }

  function dragMouseDown(evt) {
    const e = evt || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  if (document.getElementById(`${elmnt.id}-draggable`)) {
    /* if present, the header is where you move the DIV from: */
    document.getElementById(`${elmnt.id}-draggable`).onmousedown = dragMouseDown;
  } else {
    /* otherwise, move the DIV from anywhere inside the DIV: */
    elmnt.onmousedown = dragMouseDown;
  }
}

function setInfowindowStyle() {
  // Only change style for standard screen size (desktop).
  const shouldSetWidth = document.querySelectorAll('div[class*="o-media-l"]').length === 0;
  if (infowindowOptions.contentStyle && shouldSetWidth) {
    mainContainer.style = dom.createStyle(infowindowOptions.contentStyle);
  }
}

function createCloseButton() {
  return Button({
    cls: 'closebutton-svg-container small round small icon-smaller grey-lightest margin-top-small margin-right-small z-index-ontop-low ',
    icon: '#ic_close_24px',
    state: 'initial',
    validStates: ['initial', 'hidden'],
    ariaLabel: 'Stäng'
  });
}

function render(viewerId) {
  mainContainer = document.createElement('div');
  setInfowindowStyle();
  mainContainer.classList.add('sidebarcontainer', 'expandable_list');
  mainContainer.id = 'sidebarcontainer';
  urvalContainer = document.createElement('div');
  urvalContainer.classList.add('urvalcontainer');

  const urvalTextNodeContainer = document.createElement('div');
  urvalTextNodeContainer.id = 'sidebarcontainer-draggable';
  urvalTextNodeContainer.classList.add('urval-textnode-container');
  const urvalTextNode = document.createTextNode(infowindowOptions.title || 'Träffar');
  urvalTextNodeContainer.appendChild(urvalTextNode);
  mainContainer.appendChild(urvalTextNodeContainer);
  const closeButton = createCloseButton();
  mainContainer.appendChild(dom.html(closeButton.render()));
  mainContainer.appendChild(urvalContainer);

  parentElement = document.getElementById(viewerId);
  parentElement.appendChild(mainContainer);
  mainContainer.classList.add('hidden');

  document.getElementById(closeButton.getId()).addEventListener('click', () => {
    const detail = {
      name: 'multiselection',
      active: false
    };
    viewer.dispatch('toggleClickInteraction', detail);
    selectionManager.clearSelection();
    hideInfowindow();
  });

  // Make the DIV element draggagle:
  makeElementDraggable(mainContainer);
}

function showSelectedList(selectionGroup) {
  if (activeSelectionGroup === selectionGroup) {
    return;
  }

  activeSelectionGroup = selectionGroup;
}

function createExportButton(buttonText) {
  const container = document.createElement('div');

  const spinner = document.createElement('img');
  spinner.src = 'img/loading.gif';
  spinner.classList.add('spinner');
  spinner.style.visibility = 'hidden';

  const button = document.createElement('button');
  button.classList.add('export-button');
  button.textContent = buttonText;

  container.appendChild(spinner);
  container.appendChild(button);

  container.loadStart = () => {
    button.disabled = true;
    button.classList.add('disabled');
    spinner.style.visibility = 'visible';
  };

  container.loadStop = () => {
    button.disabled = false;
    button.classList.remove('disabled');
    spinner.style.visibility = 'hidden';
  };

  return container;
}

function createToaster(status, message) {
  let msg = message;
  const toaster = document.createElement('div');
  toaster.style.fontSize = '12px';
  if (!message) {
    const successMsg = exportOptions.toasterMessages && exportOptions.toasterMessages.success ? exportOptions.toasterMessages.success : 'Success!';
    const failMsg = exportOptions.toasterMessages && exportOptions.toasterMessages.fail ? exportOptions.toasterMessages.fail : 'Sorry, something went wrong. Please contact your administrator';
    msg = status === 'ok' ? successMsg : failMsg;
  }
  // It cannot be appended to infowindow bcuz in mobile tranform:translate is used css, and it causes that position: fixed loses its effect.
  parentElement.appendChild(toaster);
  setTimeout(() => {
    // message must be added here inside timeout otherwise it will be shown 50 ms before it take the effect of the css
    toaster.textContent = msg;
    toaster.classList.add('toaster');
    if (status === 'ok') {
      toaster.classList.add('toaster-successful');
    } else {
      toaster.classList.add('toaster-unsuccessful');
    }
  }, 50);

  setTimeout(() => {
    toaster.parentNode.removeChild(toaster);
  }, 5000);
}

function createSubexportComponent(selectionGroup) {
  // OBS! selectionGroup corresponds to a layer with the same name in most cases, but in case of a group layer it can contain selected items from all the layers in that GroupLayer.

  let layerSpecificExportOptions;
  const simpleExportLayers = exportOptions.simpleExportLayers ? exportOptions.simpleExportLayers : [];
  const simpleExportUrl = exportOptions.simpleExportUrl;
  const simpleExportButtonText = exportOptions.simpleExportButtonText || 'Export';
  const exportedFileName = exportOptions.exportedFileName;
  const activeLayer = viewer.getLayer(selectionGroup);

  const subexportContainer = document.createElement('div');
  subexportContainer.classList.add('export-buttons-container');

  if (exportOptions.layerSpecificExport) {
    layerSpecificExportOptions = exportOptions.layerSpecificExport.find((i) => i.layer === selectionGroup);
  }

  if (layerSpecificExportOptions) {
    const exportUrls = layerSpecificExportOptions.exportUrls || [];
    const attributesToSendToExportPerLayer = layerSpecificExportOptions.attributesToSendToExport;

    exportUrls.forEach((obj) => {
      const buttonText = obj.buttonText || 'Export';
      const url = obj.url;
      const layerSpecificExportedFileName = obj.exportedFileName;
      const attributesToSendToExport = obj.attributesToSendToExport ? obj.attributesToSendToExport : attributesToSendToExportPerLayer;
      const exportBtn = createExportButton(buttonText);
      const btn = exportBtn.querySelector('button');
      btn.addEventListener('click', () => {
        if (!url) {
          createToaster('fail');
          return;
        }
        exportBtn.loadStart();
        const selectedItems = selectionManager.getSelectedItemsForASelectionGroup(selectionGroup);
        layerSpecificExportHandler(url, activeLayer, selectedItems, attributesToSendToExport, layerSpecificExportedFileName).then((data) => {
          if (data) {
            switch (data.status) {
              case 'ok':
                createToaster('ok');
                break;

              case 'fail':
                createToaster('fail');
                break;

              default:
                break;
            }
          }
          exportBtn.loadStop();
        }).catch((err) => {
          console.error(err);
          createToaster('fail');
          exportBtn.loadStop();
        });
      });
      subexportContainer.appendChild(exportBtn);
    });
  } else if (simpleExportLayers.length) {
    const exportAllowed = simpleExportLayers.find((l) => l === selectionGroup);
    if (exportAllowed) {
      const exportBtn = createExportButton(simpleExportButtonText);
      const btn = exportBtn.querySelector('button');
      btn.addEventListener('click', () => {
        if (!simpleExportUrl) {
          createToaster('fail');
          return;
        }
        exportBtn.loadStart();
        const selectedItems = selectionManager.getSelectedItemsForASelectionGroup(selectionGroup);
        simpleExportHandler(simpleExportUrl, activeLayer, selectedItems, exportedFileName).then(() => {
          exportBtn.loadStop();
        }).catch((err) => {
          console.error(err);
          createToaster('fail');
          exportBtn.loadStop();
        });
      });
      subexportContainer.appendChild(exportBtn);
    }
  } else if (exportOptions.clientExport) {
    const conf = exportOptions.clientExport;
    const exportAllowed = !conf.layers || conf.layers.find((l) => l === selectionGroup);
    if (exportAllowed) {
      const exportBtn = createExportButton(conf.buttonText || 'Exportera');
      const btn = exportBtn.querySelector('button');
      btn.addEventListener('click', () => {
        exportBtn.loadStart();
        const selectedItems = selectionManager.getSelectedItemsForASelectionGroup(selectionGroup);
        const features = selectedItems.map(i => i.getFeature());
        exportToFile(features, conf.format, {
          featureProjection: viewer.getProjection().getCode(),
          filename: selectionGroup
        });
        exportBtn.loadStop();
      });
      subexportContainer.appendChild(exportBtn);
    }
  }

  return subexportContainer;
}

function createUrvalElement(selectionGroup, selectionGroupTitle) {
  const sublistContainer = document.createElement('div');
  sublistContainer.classList.add('sublist');
  sublists.set(selectionGroup, sublistContainer);

  const subexportComponent = createSubexportComponent(selectionGroup);
  subexportComponent.classList.add('sublist');
  subexports.set(selectionGroup, subexportComponent);

  const urvalContentCmp = Component({
    render() {
      return `<div class="urvalcontent" id="${this.getId()}"></div>`;
    }
  });

  const groupCmp = Collapse({
    cls: '',
    expanded: false,
    headerComponent: CollapseHeader({
      cls: 'hover padding-x padding-y-small grey-lightest border-bottom text-small',
      icon: '#ic_chevron_right_24px',
      title: selectionGroupTitle
    }),
    contentComponent: urvalContentCmp,
    collapseX: false
  });

  const urvalCmp = Component({
    onInit() {
      this.addComponent(groupCmp);
    },
    render() {
      return `<div class="urvalelement" id="${this.getId()}">${groupCmp.render()}</div>`;
    }
  });

  urvalContainer.appendChild(dom.html(urvalCmp.render()));
  urvalCmp.dispatch('render');
  urvalElements.set(selectionGroup, urvalCmp);
  const urvalContentEl = document.getElementById(urvalContentCmp.getId());
  urvalElementContents.set(selectionGroup, urvalContentEl);
}

function highlightListElement(featureId) {
  sublists.forEach((sublist) => {
    const elements = sublist.getElementsByClassName('listelement');
    for (let index = 0; index < elements.length; index += 1) {
      const element = elements[index];
      if (element.id === featureId) {
        setTimeout(() => {
          element.classList.add('highlighted');
        }, 100);
      } else {
        element.classList.remove('highlighted');
      }
    }
  });
}

function createExpandableContent(listElementContentContainer, content, elementId) {
  const items = content.querySelectorAll('ul > li');
  const foldedItems = [];

  if (items.length > 2) {
    const rightArrowSvg = createSvgElement('fa-chevron-right', 'expandlistelement-svg');

    rightArrowSvg.addEventListener('click', (e) => {
      e.stopPropagation();
      const isExpanded = listElementContentContainer.getAttribute('expanded');
      if (isExpanded === 'true') {
        rightArrowSvg.classList.remove('rotated');
        listElementContentContainer.setAttribute('expanded', 'false');
        foldedItems.forEach((item) => {
          item.classList.add('folded');
          item.classList.remove('unfolded');
        });
      } else {
        rightArrowSvg.classList.add('rotated');
        listElementContentContainer.setAttribute('expanded', 'true');
        foldedItems.forEach((item) => {
          item.classList.add('unfolded');
          item.classList.remove('folded');
        });
      }
    });
    listElementContentContainer.appendChild(rightArrowSvg);
    listElementContentContainer.setAttribute('expanded', 'false');

    for (let i = 2; i < items.length; i += 1) {
      const item = items[i];
      item.classList.add('folded');
      foldedItems.push(item);
    }

    listElementContentContainer.addEventListener('click', (e) => {
      if (e.target.tagName.toUpperCase() === 'A') return;

      selectionManager.highlightFeatureById(elementId);
      highlightListElement(elementId);
    });

    // eslint-disable-next-line no-param-reassign
    listElementContentContainer.expand = () => {
      const isExpanded = listElementContentContainer.getAttribute('expanded');
      if (isExpanded === 'false') {
        rightArrowSvg.classList.add('rotated');
        listElementContentContainer.setAttribute('expanded', 'true');
        foldedItems.forEach((item) => {
          item.classList.add('unfolded');
          item.classList.remove('folded');
        });
      }
    };

    expandableContents.set(elementId, listElementContentContainer);
  } else {
    listElementContentContainer.addEventListener('click', (e) => {
      if (e.target.tagName.toUpperCase() === 'A') return;
      selectionManager.highlightFeatureById(elementId);
      highlightListElement(elementId);
    });
  }
}

function showUrvalElement(selectionGroup) {
  const urvalCmp = urvalElements.get(selectionGroup);
  const urvalElement = document.getElementById(urvalCmp.getId());
  urvalElement.classList.remove('hidden');
}

function createListElement(item) {
  const listElement = document.createElement('div');
  listElement.classList.add('listelement');
  listElement.id = item.getId();
  const svg = createSvgElement('ic_remove_circle_outline_24px', 'removelistelement-svg');
  svg.addEventListener('click', () => {
    selectionManager.removeItem(item);
  });
  listElement.appendChild(svg);
  const listElementContentContainer = document.createElement('div');
  listElementContentContainer.classList.add('listelement-content-container');
  const content = (item.getContent());
  listElementContentContainer.appendChild(content);
  listElement.appendChild(listElementContentContainer);
  createExpandableContent(listElementContentContainer, content, item.getId());
  const sublist = sublists.get(item.getSelectionGroup());
  sublist.appendChild(listElement);
  showUrvalElement(item.getSelectionGroup());

  const urvalContent = urvalElementContents.get(item.getSelectionGroup());
  urvalContent.replaceChildren(sublist);

  const subexportToAppend = subexports.get(item.getSelectionGroup());
  urvalContent.appendChild(subexportToAppend);
}

function expandListElement(featureId) {
  // This method expands the element even if it is not in the active list.
  // We need to set the timeout otherwise our css transitions do not take effect because of browser batching the reflow.
  // see: https://stackoverflow.com/questions/24148403/trigger-css-transition-on-appended-element
  setTimeout(() => {
    const element = expandableContents.get(featureId);
    if (element) {
      element.expand();
    }
  }, 100);

  /*
  This method works as well, but it olny expands an element of an active list (elements that are appended and exist in the DOM)
  const element = document.getElementById(featureId);
  if (element) {
      const listElementContentContainer = element.getElementsByClassName('listelement-content-container')[0];
      if (listElementContentContainer.expand) {
          listElementContentContainer.expand();
      }
  }
  */
}

function scrollListElementToView() {
  // Do nothing
}

function removeListElement(item) {
  const sublist = sublists.get(item.getSelectionGroup());
  /*
  This loop is needed because when clear() is called it will try to remove ALL elements, but elements
  for not-selected list are already removed, thus the element found by id becomes null if document.getElementById was used.
  Also when removing an item by ctrl + click, the item might not be in the active list, but still needs to be removed.
  OBS! getElementById works only on document and not on the element.
  */
  let listElement;
  for (let i = 0; i < sublist.children.length; i += 1) {
    if (sublist.children[i].id === item.getId()) {
      listElement = sublist.children[i];
    }
  }
  if (listElement) {
    sublist.removeChild(listElement);
  }
}

function hideUrvalElement(selectionGroup) {
  const urvalCmp = urvalElements.get(selectionGroup);
  const urvalElement = document.getElementById(urvalCmp.getId());
  urvalElement.classList.add('hidden');
}

function updateUrvalElementText(selectionGroup, selectionGroupTitle, sum) {
  const urvalCmp = urvalElements.get(selectionGroup);
  const urvalElement = document.getElementById(urvalCmp.getId());
  const newNodeValue = `${selectionGroupTitle} (${sum})`;
  urvalElement.getElementsByTagName('span')[0].innerText = newNodeValue;
}

function init(options) {
  viewer = options.viewer;
  selectionManager = options.viewer.getSelectionManager();

  infowindowOptions = options.infowindowOptions ? options.infowindowOptions : {};
  exportOptions = infowindowOptions.export || {};

  sublists = new Map();
  subexports = new Map();
  urvalElements = new Map();
  urvalElementContents = new Map();
  expandableContents = new Map();

  render(options.viewer.getId());

  return {
    createListElement,
    removeListElement,
    expandListElement,
    highlightListElement,
    createUrvalElement,
    hideUrvalElement,
    updateUrvalElementText,
    showSelectedList,
    scrollListElementToView,
    hide: hideInfowindow,
    show: showInfowindow
  };
}

export default {
  init
};
