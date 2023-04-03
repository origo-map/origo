import { simpleExportHandler, layerSpecificExportHandler } from './infowindow_exporthandler';
import exportToFile from './utils/exporttofile';
import { dom, Button } from './ui';
import getSpinner from './utils/spinner';
import Icon from './ui/icon';

let parentElement;
let mainContainer;
let urvalContainer;
let listContainer;
let exportContainer;
let groupFooterContainer;
let sublists;
let subexports;
let urvalElements;
let footerContainers;
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

function hideInfowindow() {
  mainContainer.classList.add('hidden');
}

function showInfowindow() {
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
  mainContainer.classList.add('sidebarcontainer');
  mainContainer.id = 'sidebarcontainer';
  urvalContainer = document.createElement('div');
  urvalContainer.classList.add('urvalcontainer');
  // We add this so that urvalcontainer can become draggable
  urvalContainer.id = 'sidebarcontainer-draggable';
  const urvalTextNodeContainer = document.createElement('div');
  urvalTextNodeContainer.classList.add('urval-textnode-container');
  const urvalTextNode = document.createTextNode(infowindowOptions.title || 'Träffar');
  urvalTextNodeContainer.appendChild(urvalTextNode);
  urvalContainer.appendChild(urvalTextNodeContainer);
  const closeButton = createCloseButton();
  urvalContainer.appendChild(dom.html(closeButton.render()));
  listContainer = document.createElement('div');
  listContainer.classList.add('listcontainer');

  exportContainer = document.createElement('div');
  exportContainer.classList.add('exportcontainer');

  groupFooterContainer = document.createElement('div');
  groupFooterContainer.classList.add('groupfootercontainer');

  // Add some divs to populate later. It works by replacing the contents of these containers with the
  // information for the selected selectionGroup. Each selectionGroup is rendered in memory only
  // and is put into DOM when it should be visible
  mainContainer.appendChild(urvalContainer);
  mainContainer.appendChild(listContainer);
  mainContainer.appendChild(groupFooterContainer);
  mainContainer.appendChild(exportContainer);

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
  while (listContainer.firstChild) {
    listContainer.removeChild(listContainer.firstChild);
  }
  const sublistToAppend = sublists.get(selectionGroup);
  listContainer.appendChild(sublistToAppend);

  // Replace the container with this group's content
  while (groupFooterContainer.firstChild) {
    groupFooterContainer.removeChild(groupFooterContainer.firstChild);
  }
  const footerToAppend = footerContainers.get(selectionGroup);
  groupFooterContainer.appendChild(footerToAppend);

  while (exportContainer.firstChild) {
    exportContainer.removeChild(exportContainer.firstChild);
  }
  const subexportToAppend = subexports.get(selectionGroup);
  exportContainer.appendChild(subexportToAppend);

  urvalElements.forEach((value, key) => {
    if (key === selectionGroup) {
      value.classList.add('selectedurvalelement');
    } else {
      value.classList.remove('selectedurvalelement');
    }
  });
}

function createExportButton(buttonText) {
  const container = document.createElement('div');

  const spinner = getSpinner();
  spinner.style.visibility = 'hidden';

  const button = document.createElement('button');
  button.classList.add('export-button');
  button.textContent = buttonText;

  container.appendChild(button);
  container.appendChild(spinner);

  button.loadStart = () => {
    button.disabled = true;
    button.classList.add('disabled');
    spinner.style.visibility = 'visible';
  };

  button.loadStop = () => {
    button.disabled = false;
    button.classList.remove('disabled');
    spinner.style.visibility = 'hidden';
  };

  return container;
}

function createCustomExportButton(roundButtonIcon, roundButtonTooltipText) {
  const container = document.createElement('div');
  container.classList.add('inline-block', 'padding-smallest');

  const iconComponent = Icon({
    icon: roundButtonIcon,
    title: ''
  });
  const button = document.createElement('button');
  button.classList.add(
    'padding-small',
    'margin-bottom-smaller',
    'icon-smaller',
    'round',
    'light',
    'box-shadow',
    'o-tooltip',
    'margin-right-small'
  );
  button.style = 'position: relative';

  button.innerHTML = `<span class="icon" style="z-index: 10000">${iconComponent.render()}</span><span data-tooltip="${roundButtonTooltipText}" data-placement="south"></span>`;

  container.appendChild(button);
  const spinner = getSpinner();
  spinner.classList.add('spinner-large');

  button.loadStart = () => {
    button.disabled = true;
    button.classList.add('disabled');
    button.replaceWith(spinner);
  };

  button.loadStop = () => {
    button.disabled = false;
    button.classList.remove('disabled');
    spinner.replaceWith(button);
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

function createExportButtons(
  obj,
  attributesToSendToExportPerLayer,
  selectionGroup,
  activeLayer
) {
  const roundButton = obj.button.roundButton || false;
  const buttonText = obj.button.buttonText || 'Export';
  const url = obj.url;
  const layerSpecificExportedFileName = obj.exportedFileName;
  const attributesToSendToExport = obj.attributesToSendToExport
    ? obj.attributesToSendToExport
    : attributesToSendToExportPerLayer;
  const exportBtn = roundButton
    ? createCustomExportButton(
      obj.button.roundButtonIcon,
      obj.button.roundButtonTooltipText
    )
    : createExportButton(buttonText);
  const btn = exportBtn.querySelector('button');
  btn.addEventListener('click', () => {
    if (!url) {
      createToaster('fail');
      return;
    }
    btn.loadStart();
    const selectedItems = selectionManager.getSelectedItemsForASelectionGroup(selectionGroup);
    layerSpecificExportHandler(
      url,
      activeLayer,
      selectedItems,
      attributesToSendToExport,
      layerSpecificExportedFileName
    )
      .then((data) => {
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
        btn.loadStop();
      })
      .catch((err) => {
        console.error(err);
        createToaster('fail');
        btn.loadStop();
      });
  });
  return exportBtn;
}

function createSubexportComponent(selectionGroup) {
  // OBS! selectionGroup corresponds to a layer with the same name in most cases, but in case of a group layer it can contain selected items from all the layers in that GroupLayer.
  let layerSpecificExportOptions;
  const activeLayer = viewer.getLayer(selectionGroup);

  const subexportContainer = document.createElement('div');
  subexportContainer.classList.add('export-buttons-container');

  if (exportOptions.layerSpecificExport) {
    layerSpecificExportOptions = exportOptions.layerSpecificExport.find(
      (i) => i.layer === selectionGroup
    );
  }
  if (layerSpecificExportOptions) {
    const exportUrls = layerSpecificExportOptions.exportUrls || [];
    const attributesToSendToExportPerLayer = layerSpecificExportOptions.attributesToSendToExport;
    const customButtonExportUrls = exportUrls.filter(
      (e) => e.button.roundButton
    );
    const standardButtonExportUrls = exportUrls.filter(
      (e) => !e.button.roundButton
    );

    customButtonExportUrls.forEach((obj) => {
      const button = createExportButtons(
        obj,
        attributesToSendToExportPerLayer,
        selectionGroup,
        activeLayer
      );
      subexportContainer.appendChild(button);
    });
    standardButtonExportUrls.forEach((obj) => {
      const button = createExportButtons(
        obj,
        attributesToSendToExportPerLayer,
        selectionGroup,
        activeLayer
      );
      subexportContainer.appendChild(button);
    });
  } else if (exportOptions.simpleExport) {
    const simpleExportLayers = exportOptions.simpleExport.layers ? exportOptions.simpleExport.layers : [];
    const simpleExportUrl = exportOptions.simpleExport.url || false;
    const simpleExportButtonText = exportOptions.simpleExport.button.buttonText || 'Export';
    const exportAllowed = simpleExportLayers.find((l) => l === selectionGroup);
    if (exportAllowed) {
      const exportedFileName = `${exportAllowed}.xlsx`;
      const roundButton = exportOptions.simpleExport.button.roundButton || false;
      const exportBtn = roundButton
        ? createCustomExportButton(
          exportOptions.simpleExport.button.roundButtonIcon,
          exportOptions.simpleExport.button.roundButtonTooltipText
        )
        : createExportButton(simpleExportButtonText);
      const btn = exportBtn.querySelector('button');
      btn.addEventListener('click', () => {
        if (!simpleExportUrl) {
          createToaster('fail');
          return;
        }
        btn.loadStart();
        const selectedItems = selectionManager.getSelectedItemsForASelectionGroup(selectionGroup);
        simpleExportHandler(
          simpleExportUrl,
          activeLayer,
          selectedItems,
          exportedFileName
        )
          .then(() => {
            btn.loadStop();
          })
          .catch((err) => {
            console.error(err);
            createToaster('fail');
            btn.loadStop();
          });
      });
      subexportContainer.appendChild(exportBtn);
    }
  } else if (exportOptions.clientExport) {
    const conf = exportOptions.clientExport;
    const exportAllowed = !conf.layers || conf.layers.find((l) => l === selectionGroup);
    if (exportAllowed) {
      const roundButton = conf.button.roundButton || false;
      const buttonText = conf.button.buttonText || 'Exportera';
      const exportBtn = roundButton
        ? createCustomExportButton(
          conf.button.roundButtonIcon,
          conf.button.roundButtonTooltipText
        )
        : createExportButton(buttonText);

      const btn = exportBtn.querySelector('button');
      btn.addEventListener('click', () => {
        btn.loadStart();
        const selectedItems = selectionManager.getSelectedItemsForASelectionGroup(selectionGroup);
        const features = selectedItems.map(i => i.getFeature());
        exportToFile(features, conf.format, {
          featureProjection: viewer.getProjection().getCode(),
          filename: selectionGroup
        });
        btn.loadStop();
      });
      subexportContainer.appendChild(exportBtn);
    }
  }

  return subexportContainer;
}

/**
 * Creates everything that is needed internally before adding items to a selectionGroup.
 * Creates some elements, but does not add them to the DOM. That is done when a selectiongroup is displayed.
 * @param {any} selectionGroup
 * @param {any} selectionGroupTitle
 */
function createUrvalElement(selectionGroup, selectionGroupTitle) {
  const urvalElement = document.createElement('div');
  urvalElement.classList.add('urvalelement');
  const textNode = document.createTextNode(selectionGroupTitle);
  urvalElement.appendChild(textNode);
  urvalContainer.appendChild(urvalElement);
  urvalElements.set(selectionGroup, urvalElement);
  urvalElement.addEventListener('click', () => {
    showSelectedList(selectionGroup);
  });

  const sublistContainter = document.createElement('div');
  sublists.set(selectionGroup, sublistContainter);

  const footerContainer = document.createElement('div');
  footerContainers.set(selectionGroup, footerContainer);

  const subexportComponent = createSubexportComponent(selectionGroup);
  subexports.set(selectionGroup, subexportComponent);
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
  const urvalElement = urvalElements.get(selectionGroup);
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

function scrollListElementToView(featureId) {
  sublists.forEach((sublist) => {
    const elements = sublist.getElementsByClassName('listelement');
    for (let index = 0; index < elements.length; index += 1) {
      const element = elements[index];
      if (element.id === featureId) {
        // time out is set so that element gets the time to expand first, otherwise it will be scrolled halfway to the view
        setTimeout(() => {
          const elementBoundingBox = element.getBoundingClientRect();
          const listContainer2 = document.getElementsByClassName('listcontainer')[0];
          const listContainerBoundingBox = listContainer2.getBoundingClientRect();
          if (elementBoundingBox.top < listContainerBoundingBox.top) {
            const scrollDownValue = listContainerBoundingBox.top - elementBoundingBox.top;
            listContainer2.scrollTop -= scrollDownValue;
          } else if (elementBoundingBox.bottom > listContainerBoundingBox.bottom) {
            const scrollUpValue = elementBoundingBox.bottom - listContainerBoundingBox.bottom;
            listContainer2.scrollTop += scrollUpValue;
          }
        }, 500);
      }
    }
  });
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
  const urvalElement = urvalElements.get(selectionGroup);
  urvalElement.classList.add('hidden');
}

function updateUrvalElementText(selectionGroup, selectionGroupTitle, sum) {
  const urvalElement = urvalElements.get(selectionGroup);
  const newNodeValue = `${selectionGroupTitle} (${sum})`;
  urvalElement.childNodes[0].nodeValue = newNodeValue;
}

/**
 * Updates the footer text for the given selectionGroup.
 * @param {any} selectionGroup
 * @param {any} text Some html to display in the footer
 */
function updateSelectionGroupFooter(selectionGroup, text) {
  const footerContainer = footerContainers.get(selectionGroup);
  footerContainer.innerHTML = text;
}

function init(options) {
  viewer = options.viewer;
  selectionManager = options.viewer.getSelectionManager();

  infowindowOptions = options.infowindowOptions ? options.infowindowOptions : {};
  exportOptions = infowindowOptions.export || {};
  sublists = new Map();
  subexports = new Map();
  urvalElements = new Map();
  expandableContents = new Map();
  footerContainers = new Map();

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
    show: showInfowindow,
    updateSelectionGroupFooter
  };
}

export default {
  init
};
