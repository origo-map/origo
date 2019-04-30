import { simpleExportHandler, layerSpecificExportHandler } from './infowindow_exporthandler';

let mainContainer;
let urvalContainer;
let listContainer;
let exportContainer;
let exportButtonsContainer;
let sublists;
let urvalElements;
let expandableContents;
let exportOptions;
let activeSelectionGroup;
let selectionManager;
let viewer;

function render(viewerId) {
    mainContainer = document.createElement('div');
    mainContainer.classList.add('sidebarcontainer');
    mainContainer.id = 'sidebarcontainer';
    urvalContainer = document.createElement('div');
    urvalContainer.classList.add('urvalcontainer');
    // We add this so that urvalcontainer can become draggable
    urvalContainer.id = 'sidebarcontainer-draggable';
    const urvalTextNodeContainer = document.createElement('div');
    urvalTextNodeContainer.classList.add('urval-textnode-container');
    const urvalTextNode = document.createTextNode('Urval');
    urvalTextNodeContainer.appendChild(urvalTextNode);
    urvalContainer.appendChild(urvalTextNodeContainer);
    const closeButtonSvg = createSvgElement('ic_close_24px', 'closebutton-svg');
    closeButtonSvg.addEventListener('click', (e) => {
        document.dispatchEvent(new CustomEvent('infowindowclosed', {
            bubbles: true
        }));
        document.dispatchEvent(new CustomEvent('toggleInteraction', {
            bubbles: true,
            detail: 'featureInfo'
        }));
    });
    urvalContainer.appendChild(closeButtonSvg);
    listContainer = document.createElement('div');
    listContainer.classList.add('listcontainer');

    exportContainer = document.createElement('div');
    exportContainer.classList.add('exportcontainer');
    const svg = createSvgElement('fa-caret-square-o-right', 'export-svg');
    exportContainer.appendChild(svg);
    const exportTextNodeContainer = document.createElement('div');
    exportTextNodeContainer.classList.add('export-textnode-container');
    const exportTextNode = document.createTextNode('Exportera urvalet');
    exportTextNodeContainer.appendChild(exportTextNode);
    exportContainer.appendChild(exportTextNodeContainer);

    exportButtonsContainer = document.createElement('div');
    exportButtonsContainer.classList.add('export-buttons-container');
    exportContainer.appendChild(exportButtonsContainer);

    mainContainer.appendChild(urvalContainer);
    mainContainer.appendChild(listContainer);
    mainContainer.appendChild(exportContainer);

    const parentElement = document.getElementById(viewerId);
    parentElement.appendChild(mainContainer);
    mainContainer.classList.add('hidden');

    //Make the DIV element draggagle:
    makeElementDraggable(mainContainer);
}

function makeElementDraggable(elmnt) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    if (document.getElementById(elmnt.id + "-draggable")) {
        /* if present, the header is where you move the DIV from:*/
        document.getElementById(elmnt.id + "-draggable").onmousedown = dragMouseDown;
    } else {
        /* otherwise, move the DIV from anywhere inside the DIV:*/
        elmnt.onmousedown = dragMouseDown;
    }

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        // get the mouse cursor position at startup:
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        // calculate the new cursor position:
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // set the element's new position:
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        /* stop moving when mouse button is released:*/
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

function createUrvalElement(selectionGroup, selectionGroupTitle) {

    const urvalElement = document.createElement('div');
    urvalElement.classList.add('urvalelement');
    const textNode = document.createTextNode(selectionGroupTitle);
    urvalElement.appendChild(textNode);
    urvalContainer.appendChild(urvalElement);
    urvalElements.set(selectionGroup, urvalElement);
    urvalElement.addEventListener('click', (e) => {
        showSelectedList(selectionGroup);
    });
    const sublistContainter = document.createElement('div');
    sublists.set(selectionGroup, sublistContainter);
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

    urvalElements.forEach((value, key, map) => {
        if (key === selectionGroup) {
            value.classList.add('selectedurvalelement');
        } else {
            value.classList.remove('selectedurvalelement');
        }
    });

    updateExportContainer();
}

function updateExportContainer() {
    // OBS! activeSelectionGroup corresponds to a layer with the same name in most cases, but in case of a group layer it can contain selected items from all the layers in that GroupLayer.

    let layerSpecificExportOptions;
    const simpleExport = exportOptions.enableSimpleExport ? exportOptions.enableSimpleExport : false;
    const simpleExportLayers = exportOptions.simpleExportLayers ? exportOptions.simpleExportLayers : [];
    const simpleExportUrl = exportOptions.simpleExportUrl;
    const simpleExportButtonText = exportOptions.simpleExportButtonText || 'Exporera alla features i urvalet';

    const activeLayer = viewer.getLayer(activeSelectionGroup);

    while (exportButtonsContainer.firstChild) {
        exportButtonsContainer.removeChild(exportButtonsContainer.firstChild);
    }

    if (activeLayer.get('type') === 'GROUP') {
        console.warn('The selected layer is a LayerGroup, be careful!');
    }

    if (exportOptions.layerSpecificExport) {
        layerSpecificExportOptions = exportOptions.layerSpecificExport.find(i => i.layer === activeSelectionGroup);
    }

    if (layerSpecificExportOptions) {
        const exportUrls = layerSpecificExportOptions.exportUrls || [];
        const attributesToSendToExport_per_layer = layerSpecificExportOptions.attributesToSendToExport;
        exportUrls.forEach(obj => {
            const buttonText = obj.buttonText || "External Call";
            const url = obj.url;
            const attributesToSendToExport = obj.attributesToSendToExport ? obj.attributesToSendToExport : attributesToSendToExport_per_layer;
            const btn = createExportButton(buttonText);
            btn.addEventListener('click', (e) => {
                if (!url) {
                    alert('No export url is specified.');
                    return;
                }
                const selectedItems = selectionManager.getSelectedItemsForASelectionGroup(activeSelectionGroup);
                layerSpecificExportHandler(url, activeLayer, selectedItems, attributesToSendToExport);
            });
            exportButtonsContainer.appendChild(btn);
        });

    } else if (simpleExport) {
        const exportAllowed = simpleExportLayers.find(l => l === activeSelectionGroup);
        if (exportAllowed) {
            const btn = createExportButton(simpleExportButtonText);
            btn.addEventListener('click', (e) => {
                if (!simpleExportUrl) {
                    alert('No export url is specified.');
                    return;
                }
                const selectedItems = selectionManager.getSelectedItemsForASelectionGroup(activeSelectionGroup);
                simpleExportHandler(simpleExportUrl, activeLayer, selectedItems);
            });
            exportButtonsContainer.appendChild(btn);
        } else {
            console.log('Export is not allowed for selection group: ' + activeSelectionGroup);
        }

    } else {
        console.log('Neither Specific Export is specified for selection group: ' + activeSelectionGroup + ' nor Simple Export is allowed!');
    }
}

function createExportButton(buttonText) {
    const button = document.createElement('button');
    button.classList.add('export-button');
    button.textContent = buttonText;
    return button;
}

function createListElement(item) {

    const listElement = document.createElement('div');
    listElement.classList.add('listelement');
    listElement.id = item.getId();
    const svg = createSvgElement('ic_remove_circle_outline_24px', 'removelistelement-svg');
    svg.addEventListener('click', (e) => {
        selectionManager.removeItem(item);
    });
    listElement.appendChild(svg);
    const listElementContentContainer = document.createElement('div');
    listElementContentContainer.classList.add('listelement-content-container');
    const content = createElementFromHTML(item.getContent()); // Content that is created in getattribute module is a template is supposed to be used with jQuery. without jQuery we cannot append it before it is converted to a proper html element.
    listElementContentContainer.appendChild(content);
    listElement.appendChild(listElementContentContainer);
    createExpandableContent(listElementContentContainer, content, item.getId());
    //const sublist = sublists.get(item.getLayer().get('name'));
    const sublist = sublists.get(item.getSelectionGroup());
    sublist.appendChild(listElement);
    //showUrvalElement(item.getLayer().get('name'));
    showUrvalElement(item.getSelectionGroup());
}

function createElementFromHTML(htmlString) {
    var div = document.createElement('div');
    div.innerHTML = htmlString.trim();
    // Change this to div.childNodes to support multiple top-level nodes
    return div.firstChild;
}

function createExpandableContent(listElementContentContainer, content, elementId) {

    const items = content.querySelectorAll('ul > li');

    if (items.length > 2) {
        const rightArrowSvg = createSvgElement('fa-chevron-right', 'expandlistelement-svg');

        listElementContentContainer.appendChild(rightArrowSvg);
        listElementContentContainer.setAttribute('expanded', 'false');

        const foldedItems = [];
        for (let i = 2; i < items.length; i++) {
            const item = items[i];
            item.classList.add('folded');
            foldedItems.push(item);
        }

        listElementContentContainer.addEventListener('click', (e) => {

            if (e.target.tagName.toUpperCase() === "A") return;

            const isExpanded = listElementContentContainer.getAttribute('expanded');
            if (isExpanded === 'true') {
                rightArrowSvg.classList.remove('rotated');
                listElementContentContainer.setAttribute('expanded', 'false');
                foldedItems.forEach(item => {
                    item.classList.add('folded');
                    item.classList.remove('unfolded');
                });
            } else {
                rightArrowSvg.classList.add('rotated');
                listElementContentContainer.setAttribute('expanded', 'true');
                foldedItems.forEach(item => {
                    item.classList.add('unfolded');
                    item.classList.remove('folded');
                });
                selectionManager.highlightFeatureById(elementId);
                highlightListElement(elementId);
            }
        });

        listElementContentContainer.expand = function () {
            const isExpanded = listElementContentContainer.getAttribute('expanded');
            if (isExpanded === 'false') {
                rightArrowSvg.classList.add('rotated');
                listElementContentContainer.setAttribute('expanded', 'true');
                foldedItems.forEach(item => {
                    item.classList.add('unfolded');
                    item.classList.remove('folded');
                });
            }
        };

        expandableContents.set(elementId, listElementContentContainer);

    } else {

        listElementContentContainer.addEventListener('click', (e) => {
            if (e.target.tagName.toUpperCase() === "A") return;
            selectionManager.highlightFeatureById(elementId);
            highlightListElement(elementId);
        });
    }
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

function highlightListElement(featureId) {
    sublists.forEach(sublist => {
        const elements = sublist.getElementsByClassName('listelement');
        for (let index = 0; index < elements.length; index++) {
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

function scrollListElementToView(featureId) {
    sublists.forEach(sublist => {
        const elements = sublist.getElementsByClassName('listelement');
        for (let index = 0; index < elements.length; index++) {
            const element = elements[index];
            if (element.id === featureId) {
                // time out is set so that element gets the time to expand first, otherwise it will be scrolled halfway to the view
                setTimeout(() => {
                    const elementBoundingBox = element.getBoundingClientRect();
                    const listContainer = document.getElementsByClassName('listcontainer')[0];
                    const listContainerBoundingBox = listContainer.getBoundingClientRect();
                    if (elementBoundingBox.top < listContainerBoundingBox.top) {
                        const scrollDownValue = listContainerBoundingBox.top - elementBoundingBox.top;
                        listContainer.scrollTop = listContainer.scrollTop - scrollDownValue;
                    } else if (elementBoundingBox.bottom > listContainerBoundingBox.bottom) {
                        const scrollUpValue = elementBoundingBox.bottom - listContainerBoundingBox.bottom;
                        listContainer.scrollTop = listContainer.scrollTop + scrollUpValue;
                    }
                }, 500);
            }
        }
    });
}

function showUrvalElement(selectionGroup) {
    const urvalElement = urvalElements.get(selectionGroup);
    urvalElement.classList.remove('hidden');
}

function removeListElement(item) {
    //const sublist = sublists.get(item.getLayer().get('name'));
    const sublist = sublists.get(item.getSelectionGroup());
    /*  
    This loop is needed because when clear() is called it will try to remove ALL elements, but elements 
    for not-selected list are already removed, thus the element found by id becomes null if document.getElementById was used.
    Also when removing an item by ctrl + click, the item might not be in the active list, but still nerds to be removed.
    OBS! getElementById works only on document and not on the element.
    */
    let listElement;
    for (let i = 0; i < sublist.children.length; i++) {
        if (sublist.children[i].id === item.getId()) {
            listElement = sublist.children[i];
        }
    }
    if (listElement)
        sublist.removeChild(listElement);
}

function createSvgElement(id, className) {
    const svgContainer = document.createElement('div');
    const svgElem = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const useElem = document.createElementNS('http://www.w3.org/2000/svg', 'use');

    svgElem.setAttribute('class', className); // this instead of above line to support ie!
    useElem.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#' + id);
    svgElem.appendChild(useElem);
    svgContainer.appendChild(svgElem);
    svgContainer.classList.add(className + '-container');

    return svgContainer;
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

function hideInfowindow() {
    mainContainer.classList.add('hidden');
}

function showInfowindow() {
    mainContainer.classList.remove('hidden');
}

function init(options) {

    viewer = options.viewer;
    selectionManager = options.viewer.getSelectionManager();

    const infowindowOptions = options.infowindowOptions ? options.infowindowOptions : {};
    exportOptions = infowindowOptions.export || {};

    sublists = new Map();
    urvalElements = new Map();
    expandableContents = new Map();

    render(options.viewer.getId());

    return {
        createListElement: createListElement,
        removeListElement: removeListElement,
        expandListElement: expandListElement,
        highlightListElement: highlightListElement,
        createUrvalElement: createUrvalElement,
        hideUrvalElement: hideUrvalElement,
        updateUrvalElementText: updateUrvalElementText,
        showSelectedList: showSelectedList,
        scrollListElementToView: scrollListElementToView,
        hide: hideInfowindow,
        show: showInfowindow,
    };
}

export default {
    init
}