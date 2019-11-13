import { Component, Collapse, Element as El, Slidenav, Button, dom } from '../../ui';
import ThemeGroups from './themegroups';
import Group from './group';
import GroupList from './grouplist';
import LayerProperties from './overlayproperties';
import Overlay from './overlay';

/**
 * The Overlays component works as a container for
 * all group components, besides the background group.
 * The component is divivded in two main cointainers,
 * one for theme groups and one root container for layers
 * and grouplayers that don't belong to a theme.
 */
const Overlays = function Overlays(options) {
  const {
    cls: clsSettings = '',
    expanded = true,
    style: styleSettings = {},
    viewer
  } = options;

  const cls = `${clsSettings} o-layerswitcher-overlays flex row overflow-hidden`.trim();
  const style = dom.createStyle(Object.assign({}, { width: '266px', height: '100%', 'min-width': '220px' }, styleSettings));
  const nonGroupNames = ['background', 'none'];
  const rootGroupNames = ['root', '', null, undefined];
  let overlays;

  //drag and drop
  var draggedElement;
  var zIndexCounter = 500;
  var addedOverlays = new Array;
  var waitingLMlayers = new Array;

  const themeGroups = ThemeGroups();
  const rootGroup = GroupList({ viewer });

  const groupCmps = viewer.getGroups().reduce((acc, group) => {
    if (nonGroupNames.includes(group.name)) return acc;
    return acc.concat(Group(group, viewer));
  }, []);

  groupCmps.forEach((groupCmp) => {
    if (groupCmp.type === 'group') {
      themeGroups.addComponent(groupCmp);
    } else if (groupCmp.parent) {
      const parent = groupCmps.find(cmp => cmp.name === groupCmp.parent);
      parent.addGroup(groupCmp, viewer);
    } else {
      rootGroup.addGroup(groupCmp);
    }
  });

  const groupContainer = El({
    components: [themeGroups, rootGroup]
  });

  const layerProps = El({
    cls: 'border-bottom overflow-hidden',
    innerHTML: 'Layerproperties'
  });

  const slidenav = Slidenav({
    mainComponent: groupContainer,
    secondaryComponent: layerProps,
    cls: 'right flex width-100'
  });

  const navContainer = Component({
    onInit() {
      this.addComponent(slidenav);
    },
    onRender() {
      this.dispatch('render');
    },
    render() {
      return `<div id="${this.getId()}"><div class="flex row no-shrink">${slidenav.render()}</div></div>`;
    }
  });

  const initialState = expanded ? 'expanded' : 'collapsed';
  const collapseButton = Button({
    icon: '#o_expand_more_24px',
    iconCls: 'rotate-180 grey',
    cls: 'icon-smaller compact round',
    state: initialState,
    validStates: ['expanded', 'collapsed'],
    click() {
      if (this.getState() === 'expanded') {
        this.setState('collapsed');
      } else {
        this.setState('expanded');
      }
    }
  });

  const collapseHeader = Component({
    onInit() {
      this.addComponent(collapseButton);
    },
    onRender() {
      this.dispatch('render');
      const el = document.getElementById(this.getId());
      el.addEventListener('click', () => {
        const customEvt = new CustomEvent('collapse:toggle', {
          bubbles: true
        });
        collapseButton.dispatch('click');
        el.dispatchEvent(customEvt);
      });
    },
    render() {
      const headerCls = 'flex row grow no-shrink justify-center align-center pointer collapse-header';
      return `<div id="${this.getId()}" class="${headerCls}" style="height: 1.5rem;">
                ${collapseButton.render()}
              </div>`;
    }
  });

  const overlaysCollapse = Collapse({
    bubble: true,
    collapseX: false,
    cls: 'flex column overflow-hidden width-100',
    contentCls: 'flex column',
    contentStyle: { height: '100%', 'overflow-y': 'auto' },
    expanded,
    contentComponent: navContainer,
    headerComponent: collapseHeader
  });

  const hasOverlays = () => overlays.length;

  const readOverlays = () => {
    overlays = viewer.getLayers().filter(layer => layer.get('group') !== 'background' && layer.get('group') !== 'none');
    return overlays.reverse();
  };

  // Hide overlays container when empty
  const onChangeLayer = function onChangeLayer() {
    const oldNrOverlays = overlays.length;
    const nrOverlays = readOverlays().length;
    if (oldNrOverlays !== nrOverlays && nrOverlays < 2 && oldNrOverlays < 2) {
      document.getElementById(this.getId()).classList.toggle('hidden');
    }
  };

  const addDragSupport = function addDragSupport(el) {
    el.addEventListener("drag", function (event) { }, false);
    el.addEventListener("dragstart", function (event) { 
      
      draggedElement = event.target; 
      event.target.style.opacity = .3; 

      var menuDropSlot = document.getElementById("menuDropSlot");
      if (menuDropSlot != null) {
        addDropSupport(menuDropSlot);
      }
    }, false);

    el.addEventListener("dragend", function (event) { event.target.style.opacity = ""; }, false);
  };

  const addDropSupport = function addDropSupport(el) {
    el.addEventListener("dragover", function (event) { event.preventDefault(); }, false);
    el.addEventListener("dragenter", function (event) { if (event.target.title === 'drop') { event.target.style.background = "#008FF5"; } }, false);
    el.addEventListener("dragleave", function (event) { if (event.target.title === 'drop') { event.target.style.background = ""; } }, false);
    el.addEventListener("drop", function (event) {
      event.preventDefault();
      var targetNeighbourTitle = '';
      event.target.style.background = "";

      if (event.target.title === 'drop') {
        var otherLayers = new Array;
        var parent = draggedElement.parentNode;
        var moveLayer = true;
        var dropIndex = Array.prototype.indexOf.call(parent.childNodes, event.target);
        var layerDragged;
        var layerTarget;
        var layerDraggedZIndex;
        var layerTargetZIndex;
        var dropBelow = false;

        if (dropIndex === 0) {

          targetNeighbourTitle = event.target.nextSibling.title;
          if (targetNeighbourTitle === draggedElement.getAttribute("title")) {
            moveLayer = false;
          }
          else {
            addedOverlays.forEach(function (element) {
              var l = element.getLayer();
              if (l.getProperties().title === draggedElement.getAttribute("title")) {
                layerDragged = l;
              }
              else if (l.getProperties().title === targetNeighbourTitle) {
                layerTarget = l;
                dropBelow = false;
              }
              else {
                otherLayers.push(l);
              }
            })
          }
        }
        else {
          var nextSiblingTitle = ''

          if (dropIndex !== -1) {
            targetNeighbourTitle = event.target.previousSibling.title;
            nextSiblingTitle = event.target.nextSibling.title;
          }
          else {
            dropIndex = Array.prototype.indexOf.call(parent.childNodes, parent.lastElementChild) - 1
            targetNeighbourTitle = parent.childNodes[dropIndex].previousSibling.title;
            nextSiblingTitle = parent.childNodes[dropIndex].nextSibling.title;
          }
          if (targetNeighbourTitle === draggedElement.getAttribute("title") || nextSiblingTitle === draggedElement.getAttribute("title")) {
            moveLayer = false;
          }
          else {
            addedOverlays.forEach(function (element) {
              var l = element.getLayer();
              if (l.getProperties().title === draggedElement.getAttribute("title")) {
                layerDragged = l;
              }
              else if (l.getProperties().title === targetNeighbourTitle) {
                layerTarget = l;
                dropBelow = true;
              }
              else {
                otherLayers.push(l);
              }
            })
          }
        }

        if (moveLayer) {

          var zIndexList = new Array;

          if (dropBelow) {
            layerDragged.setZIndex(layerTarget.getZIndex() - 1);
          }
          else {
            layerDragged.setZIndex(layerTarget.getZIndex() + 1);
          }

          zIndexList.push(layerDragged.getZIndex());
          zIndexList.push(layerTarget.getZIndex());
          layerTargetZIndex = layerTarget.getZIndex();
          layerDraggedZIndex = layerDragged.getZIndex();

          otherLayers.forEach(function (element) {

            if (element.getZIndex() === layerTargetZIndex) {
              element.setZIndex(element.getZIndex() - 1);
              zIndexList.push(element.getZIndex());
            }
            else if (element.getZIndex() < layerTargetZIndex && !zIndexList.includes(element.getZIndex())) {
              element.setZIndex(element.getZIndex() - 1);
              zIndexList.push(element.getZIndex());
            }
            else if (element.getZIndex() < layerTargetZIndex && zIndexList.includes(element.getZIndex())) {
              var z = element.getZIndex() - 1;
              while (zIndexList.includes(z)) {
                z--;
              }
              element.setZIndex(z);
              zIndexList.push(element.getZIndex());
            }
            else if (element.getZIndex() > layerDraggedZIndex && !zIndexList.includes(element.getZIndex())) {
              element.setZIndex(element.getZIndex() + 1);
              zIndexList.push(element.getZIndex());
            }
            else if (element.getZIndex() > layerDraggedZIndex && zIndexList.includes(element.getZIndex())) {
              var z = element.getZIndex() + 1;
              while (zIndexList.includes(z)) {
                z++;
              }
              element.setZIndex(z);
              zIndexList.push(element.getZIndex());
            }
            else {
              console.log("Failed to sort z Index on layer: " + element.getProperties().title);
            }
          });

          addedOverlays.sort((a, b) => (a.getLayer().getZIndex() < b.getLayer().getZIndex()) ? 1 : ((b.getLayer().getZIndex() < a.getLayer().getZIndex()) ? -1 : 0));

          var childnodes = parent.childNodes;
          var menu = parent.lastElementChild;
          parent.removeChild(menu);
          var menuDropChild = parent.lastElementChild;
          var dropSlot = parent.firstElementChild;
          parent.removeChild(menuDropChild);

          var childSorted = new Array;
          zIndexCounter = 500 + addedOverlays.length;

          addedOverlays.forEach(function (l) {
            var sortedOverlay = l.getLayer();
            sortedOverlay.setZIndex(zIndexCounter);
            zIndexCounter--;
            
            //for IE support
            if (window.NodeList && !NodeList.prototype.forEach) {
              NodeList.prototype.forEach = Array.prototype.forEach;
            }
            //
            childnodes.forEach(function (child) {

              if (child.getAttribute("title") === sortedOverlay.getProperties().title) {

                var dropSlotClone = dropSlot.cloneNode(true);
                addDropSupport(dropSlotClone);
                childSorted.push(dropSlotClone);
                childSorted.push(child);

                parent.removeChild(child);
              }
              if (child.getAttribute("id") === 'dropSlot') {
                parent.removeChild(child);
              }
              if (child.getAttribute("title") === 'menuDropChild') {
                parent.removeChild(child);
              }
            });
          });
          var dropSlotClone = dropSlot.cloneNode(true);
          addDropSupport(dropSlotClone);
          childSorted.push(dropSlotClone);

          childSorted.forEach(function (child) {
            parent.appendChild(child);
          });
          parent.appendChild(menu);
          var dropSlotClone = dropSlot.cloneNode(true);
          addDropSupport(dropSlotClone);
          parent.insertBefore(dropSlotClone, parent.childNodes[0]);

          zIndexCounter = 500 + addedOverlays.length;
        }
      }
    }, false);
  };

  const addLayer = function addLayer(layer, { position } = {}) {
    const styleName = layer.get('styleName') || null;
    const layerStyle = styleName ? viewer.getStyle(styleName) : undefined;
    const overlay = Overlay({
      layer, style: layerStyle, position, viewer
    });
    const groupName = layer.get('group');
    if (rootGroupNames.includes(groupName)) {
      rootGroup.addOverlay(overlay);
    } else if (!(nonGroupNames.includes(groupName))) {
      const groupCmp = groupCmps.find(cmp => cmp.name === groupName);
      if (groupCmp) {
     
        groupCmp.addOverlay(overlay);

        if (layer.get('group') === 'mylayers') {
          zIndexCounter++;
          overlay.getLayer().setZIndex(zIndexCounter);
          addedOverlays.push(overlay);
          var el = document.getElementById(overlay.getId());
          el.style.paddingTop = "0";
          el.style.paddingBottom = "0";
          var dropSlot = document.getElementById("dropSlot");
          var menuDropSlot = document.getElementById("menuDropSlot");
          if (menuDropSlot != null) {
            addDropSupport(menuDropSlot);
          }
          addDropSupport(dropSlot);
          addDragSupport(el);
        }
      }
      else if (layer.get('group') === 'mylayers') {
        waitingLMlayers.push(layer);
      }
    }
  };

  const onAddLayer = function onAddLayer(evt) {
    this.onChangeLayer();
    const layer = evt.element;
    addLayer(layer);
  };

  const addGroup = function addGroup(groupOptions) {
    const groupCmp = Group(groupOptions, viewer);
    groupCmps.push(groupCmp);
    if (groupCmp.type === 'grouplayer') {
      const parent = groupCmps.find(cmp => cmp.name === groupCmp.parent);
      if (parent) {
        parent.addGroup(groupCmp, viewer);
      } else {
        rootGroup.addGroup(groupCmp, viewer);
      }
    } else {
      themeGroups.addComponent(groupCmp);
    }
  };

  const onAddGroup = function onAddGroup(evt) {
    const group = evt.group;
    addGroup(group);
    if(waitingLMlayers){
      waitingLMlayers.sort((a, b) => (a.getZIndex() < b.getZIndex()) ? 1 : ((b.getZIndex() < a.getZIndex()) ? -1 : 0));
      waitingLMlayers.reverse().forEach(function (layer) {
        addLayer(layer, "bottom");
      });
      waitingLMlayers = new Array;
    } 
  };

  const onRemoveLayer = function onRemoveLayer(evt) {
    this.onChangeLayer();
    const layer = evt.element;
    const layerName = layer.get('name');
    const groupName = layer.get('group');
    if (groupName) {
      const groupCmp = groupCmps.find(cmp => cmp.name === groupName);
      if (groupCmp) {
        var removeIndex;
        addedOverlays.forEach(function (element) {
          if (element.getLayer().getProperties().title === layer.get('title')) {
            removeIndex = addedOverlays.indexOf(element);
          }
        })
        addedOverlays.splice(removeIndex, 1);
        groupCmp.removeOverlay(layerName);
      }
    } else {
      rootGroup.removeOverlay(layerName);
    }
  };

  const onRemoveGroup = function onRemoveGroup(evt) {
    const groupName = evt.group.name;
    const groupCmp = groupCmps.find(cmp => cmp.name === groupName);
    if (groupCmp) {
      const index = groupCmps.indexOf(groupCmp);
      groupCmps.splice(index, 1);
      if (groupCmp.parent) {
        const parentCmp = groupCmps.find(cmp => cmp.name === groupCmp.parent);
        if (groupCmp.parent === 'root') {
          rootGroup.removeGroup(groupCmp);
        } else if (parentCmp) {
          parentCmp.removeGroup(groupCmp);
        }
      } else {
        rootGroup.removeGroup(groupCmp);
      }
    }
  };


  return Component({
    onAddGroup,
    onChangeLayer,
    getGroups(){
      return groupCmps;
    },
    onInit() {
      this.addComponent(overlaysCollapse);
      readOverlays();
      viewer.getMap().getLayers().on('add', onAddLayer.bind(this));
      viewer.getMap().getLayers().on('remove', onRemoveLayer.bind(this));
      viewer.on('add:group', onAddGroup.bind(this));
      viewer.on('remove:group', onRemoveGroup.bind(this));
      this.on('expand', () => {
        overlaysCollapse.expand();
      });
    },
    onRender() {
      overlays.forEach((layer) => {
        addLayer(layer, { position: 'bottom' });
      });
      const el = document.getElementById(this.getId());
      el.addEventListener('overlayproperties', (evt) => {
        if (evt.detail.layer) {
          const layer = evt.detail.layer;
          const parent = this;
          const layerProperties = LayerProperties({ layer, viewer, parent });
          slidenav.setSecondary(layerProperties);
          slidenav.slideToSecondary();
          slidenav.on('slide', () => {
            el.classList.remove('width-100');
          });
        }
        evt.stopPropagation();
      });
      this.dispatch('render');
    },
    render() {
      const emptyCls = hasOverlays() ? '' : 'hidden';
      return `<div id="${this.getId()}" class="${cls} ${emptyCls}" style="${style}">
                ${overlaysCollapse.render()}
              </div>`;
    }
  });
};

export default Overlays;
