import { Button, dom, Component, Element as El, Input, InputFile, Modal } from '../ui';
import DrawHandler from './draw/drawhandler';
import drawExtraTools from './draw/drawtools';
import exportToFile from '../utils/exporttofile';
import validate from '../utils/validate';

const Draw = function Draw(options = {}) {
  const {
    buttonText = 'Rita',
    placement = ['menu'],
    icon = '#fa-pencil',
    annotation,
    showAttributeButton = false,
    showDownloadButton = false,
    showSaveButton = false,
    multipleLayers = false
  } = options;

  let {
    isActive = false
  } = options;

  const drawDefaults = {
    layerTitle: 'Ritlager',
    groupName: 'none',
    groupTitle: 'Ritlager',
    visible: true,
    styleByAttribute: true,
    queryable: false,
    removable: true,
    exportable: true,
    drawlayer: true,
    draggable: true
  };

  let map;
  let viewer;
  let drawTools;
  let mapTools;
  let screenButtonContainer;
  let screenButton;
  let mapMenu;
  let menuItem;
  let stylewindow;
  let saveButton;
  let layerAttributeButton;
  let thisComponent;
  let drawHandler;

  const drawOptions = Object.assign({}, drawDefaults, options);

  function setActive(state) {
    if (state === true) {
      document.getElementById(thisComponent.getId()).classList.remove('o-hidden');
      if (screenButton) {
        screenButton.setState('active');
      }
      isActive = true;
    } else {
      document.getElementById(thisComponent.getId()).classList.add('o-hidden');
      thisComponent.dispatch('toggleDraw', { tool: 'cancel' });
      stylewindow.dispatch('showStylewindow', false);
      if (screenButton) {
        screenButton.setState('initial');
      }
      isActive = false;
    }
  }

  function onEnableInteraction(e) {
    if (e.detail.name === 'draw' && e.detail.active) {
      setActive(true);
    } else {
      setActive(false);
    }
  }

  function toggleState(tool, state) {
    if (state === false) {
      tool.setState('initial');
    } else {
      tool.setState('active');
    }
  }

  function changeDrawState(detail) {
    const tools = Object.getOwnPropertyNames(drawTools);
    tools.forEach((tool) => {
      if (tool === detail.tool) {
        toggleState(drawTools[tool], detail.active);
      } else {
        toggleState(drawTools[tool], false);
      }
    });
  }

  const attributeForm = Component({ // Add attribute to feature
    name: 'attributeForm',
    show() {
      if (drawHandler.getSelection().getArray().length > 0) {
        const feature = drawHandler.getSelection().getArray()[0];
        const val = feature.get('popuptext') || '';

        const formSaveButton = Button({
          cls: 'margin-small icon-smaller light box-shadow',
          style: 'border-radius: 3px',
          icon: '#ic_save_24px',
          text: 'Spara'
        });

        const cancelButton = Button({
          cls: 'margin-small icon-smaller light box-shadow',
          style: 'border-radius: 3px',
          icon: '#ic_close_24px',
          text: 'Avbryt'
        });

        const inputEl = Input({
          cls: 'no-margin',
          placeholderText: 'Ange popuptext',
          value: val
        });

        const modalContent = El({
          cls: 'padding-small flex row wrap align-start justify-space-evenly',
          components: [inputEl, formSaveButton, cancelButton]
        });

        const modal = Modal({
          title: 'Popuptext',
          contentCmp: modalContent,
          target: viewer.getId()
        });

        formSaveButton.on('click', () => {
          const inputVal = inputEl.getValue() || '';
          feature.set('popuptext', inputVal);
          modal.closeModal();
        });

        cancelButton.on('click', () => {
          modal.closeModal();
        });

        modal.show();
      }
    }
  });

  const onLayerDelete = function onLayerDelete(evt) {
    const activeLayer = drawHandler.getActiveLayer();
    const removedLayer = evt.element;
    if (activeLayer === removedLayer) {
      const drawLayers = drawHandler.getDrawLayers();
      if (drawLayers.length > 0) {
        drawHandler.setActiveLayer(drawLayers[drawLayers.length - 1]);
      } else {
        drawHandler.setActiveLayer(null);
      }
    }
  };

  const layerForm = Component({ // Handle draw layers
    name: 'layerForm',
    show() {
      const drawLayers = drawHandler.getDrawLayers();
      const activeLayer = drawHandler.getActiveLayer();
      const components = [];
      let modal;
      const thisForm = this;

      drawLayers.reverse().forEach(drawLayer => {
        const layerTitle = drawLayer.get('title');
        const layerName = drawLayer.get('name');

        const inputEl = Input({
          cls: 'margin-right',
          placeholderText: 'Ange lagernamn',
          value: layerTitle
        });

        inputEl.on('focusout', (e) => {
          drawLayer.set('title', e.value);
        });

        const activeButton = Button({
          cls: 'margin-right-small padding-small icon-smaller round light box-shadow relative o-tooltip',
          icon: '#ic_check_circle_24px',
          state: drawLayer === activeLayer ? 'active' : 'initial',
          click() {
            drawHandler.setActiveLayer(drawLayer);
            thisForm.dispatch('activeLayerChange', { layername: layerName });
          },
          tooltipText: 'Aktivera ritlager',
          tooltipPlacement: 'west'
        });

        this.on('activeLayerChange', (e) => {
          activeButton.setState(e.layername === layerName ? 'active' : 'initial');
        });

        const deleteButton = Button({
          cls: 'padding-small icon-smaller round light box-shadow relative o-tooltip',
          icon: '#ic_delete_24px',
          async click() {
            if (window.confirm('Vill du radera det här ritlagret?') === true) {
              await map.removeLayer(drawLayer);
              modal.closeModal();
              thisForm.show();
            }
          },
          tooltipText: 'Radera ritlager',
          tooltipPlacement: 'west'
        });

        const downloadLayerButton = Button({
          cls: 'margin-right-small padding-small icon-smaller round light box-shadow relative o-tooltip',
          icon: '#ic_download_24px',
          click() {
            const features = drawLayer.getSource().getFeatures();
            exportToFile(features, 'geojson', {
              featureProjection: viewer.getProjection().getCode(),
              filename: drawLayer.get('title') || 'export'
            });
          },
          tooltipText: 'Ladda ner ritlager',
          tooltipPlacement: 'west'
        });

        const layerRow = El({
          cls: 'flex row align-start justify-space-evenly',
          components: [inputEl, activeButton, downloadLayerButton, deleteButton],
          tagName: 'div'
        });

        components.push(layerRow);
      });

      const addLayerButton = Button({
        cls: 'icon-smaller light box-shadow',
        style: 'border-radius: 3px',
        icon: '#ic_add_24px',
        text: 'Nytt ritlager',
        async click() {
          let title = drawOptions.layerTitle;
          if (viewer.getLayersByProperty('title', title).length > 0) {
            let i = 1;
            while (i <= drawLayers.length) {
              if (viewer.getLayersByProperty('title', `${title} ${i}`).length === 0) {
                title = `${title} ${i}`;
                break;
              }
              i += 1;
            }
          }
          const addedLayer = await drawHandler.addLayer({ layerTitle: title });
          drawHandler.setActiveLayer(addedLayer);
          modal.closeModal();
          layerForm.show();
        }
      });

      const fileInput = InputFile({
        labelCls: 'hidden',
        inputCls: 'hidden',
        change(e) {
          const file = e.target.files[0];
          const fileName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
          const reader = new FileReader();
          reader.addEventListener(
            'loadend',
            async () => {
              if (validate.json(reader.result)) {
                const features = reader.result;
                const addedLayer = await drawHandler.addLayer({ features, layerTitle: fileName });
                drawHandler.setActiveLayer(addedLayer);
                modal.closeModal();
                thisForm.show();
              }
            },
            false
          );
          if (file) {
            reader.readAsText(file);
          }
        }
      });

      const openBtn = Button({
        cls: 'icon-smaller light box-shadow',
        style: 'border-radius: 3px',
        icon: '#ic_add_24px',
        click() {
          const inputEl = document.getElementById(fileInput.getId());
          inputEl.value = null;
          inputEl.click();
        },
        text: 'Importera ritlager',
        ariaLabel: 'Importera ritlager'
      });

      const okButton = Button({
        cls: 'icon-smaller light box-shadow',
        style: 'border-radius: 3px',
        icon: '#ic_check_24px',
        text: 'OK',
        click() {
          modal.closeModal();
        }
      });

      const buttonRow = El({
        cls: 'flex row align-start justify-space-evenly margin-top-large',
        components: [okButton, addLayerButton, fileInput, openBtn],
        tagName: 'div'
      });

      components.push(buttonRow);

      const modalContent = El({
        cls: 'padding-small align-start justify-space-evenly',
        components,
        tagName: 'div'
      });

      modal = Modal({
        title: 'Ritlager',
        contentCmp: modalContent,
        target: viewer.getId(),
        style: 'max-width:100%;width:400px;'
      });

      modal.show();
    }
  });

  const toolbarButtons = [];

  const pointButton = Button({
    cls: 'padding-small icon-smaller round light box-shadow relative',
    click() {
      if (this.getState() !== 'disabled') {
        thisComponent.dispatch('toggleDraw', { tool: 'Point' });
      }
    },
    icon: '#ic_place_24px',
    tooltipText: 'Punkt',
    tooltipPlacement: 'south',
    tooltipStyle: 'bottom:-5px;',
    state: 'inactive'
  });

  toolbarButtons.push(pointButton);

  const lineButton = Button({
    cls: 'padding-small icon-smaller round light box-shadow relative',
    click() {
      if (this.getState() !== 'disabled') {
        thisComponent.dispatch('toggleDraw', { tool: 'LineString' });
      }
    },
    icon: '#ic_timeline_24px',
    tooltipText: 'Linje',
    tooltipPlacement: 'south',
    tooltipStyle: 'bottom:-5px;'
  });

  toolbarButtons.push(lineButton);

  const polygonButton = Button({
    cls: 'padding-small icon-smaller round light box-shadow relative',
    click() {
      if (this.getState() !== 'disabled') {
        thisComponent.dispatch('toggleDraw', { tool: 'Polygon' });
      }
    },
    icon: '#o_polygon_24px',
    tooltipText: 'Polygon',
    tooltipPlacement: 'south',
    tooltipStyle: 'bottom:-5px;'
  });

  toolbarButtons.push(polygonButton);

  const textButton = Button({
    cls: 'padding-small icon-smaller round light box-shadow relative',
    click() {
      if (this.getState() !== 'disabled') {
        thisComponent.dispatch('toggleDraw', { tool: 'Text' });
      }
    },
    icon: '#ic_title_24px',
    tooltipText: 'Text',
    tooltipPlacement: 'south',
    tooltipStyle: 'bottom:-5px;'
  });

  toolbarButtons.push(textButton);

  if (showAttributeButton) {
    layerAttributeButton = Button({
      cls: 'padding-small icon-smaller round light box-shadow relative',
      click() {
        attributeForm.show();
      },
      icon: '#ic_textsms_24px',
      tooltipText: 'Attribut',
      tooltipPlacement: 'south',
      tooltipStyle: 'bottom:-5px;',
      state: 'disabled'
    });

    toolbarButtons.push(layerAttributeButton);
  }

  const stylewindowButton = Button({
    cls: 'padding-small icon-smaller round light box-shadow relative',
    click() {
      const stylewindowEl = document.getElementById(stylewindow.getId());
      stylewindowEl.classList.toggle('hidden');
      if (this.getState() === 'active') {
        this.setState('initial');
      } else { this.setState('active'); }
    },
    icon: '#ic_palette_24px',
    tooltipText: 'Stil',
    tooltipPlacement: 'south',
    tooltipStyle: 'bottom:-5px;'
  });

  toolbarButtons.push(stylewindowButton);

  if (multipleLayers) {
    const layerButton = Button({
      cls: 'padding-small icon-smaller round light box-shadow relative',
      click() {
        layerForm.show();
      },
      icon: '#ic_layers_24px',
      tooltipText: 'Lager',
      tooltipPlacement: 'south',
      tooltipStyle: 'bottom:-5px;'
    });

    toolbarButtons.push(layerButton);
  }

  if (showSaveButton) {
    saveButton = Button({
      cls: 'padding-small icon-smaller round light box-shadow relative',
      click() {
        thisComponent.dispatch('saveFeatures', true);
      },
      icon: '#ic_save_24px',
      tooltipText: 'Spara',
      tooltipPlacement: 'south',
      tooltipStyle: 'bottom:-5px;',
      state: 'disabled'
    });

    toolbarButtons.push(saveButton);
  }

  if (showDownloadButton) {
    const downloadButton = Button({
      cls: 'padding-small icon-smaller round light box-shadow relative',
      click() {
        const drawLayer = drawHandler.getActiveLayer();
        const features = drawLayer.getSource().getFeatures();
        exportToFile(features, 'geojson', {
          featureProjection: viewer.getProjection().getCode(),
          filename: drawLayer.get('title') || 'export'
        });
      },
      icon: '#ic_download_24px',
      tooltipText: 'Ladda ner',
      tooltipPlacement: 'south',
      tooltipStyle: 'bottom:-5px;'
    });
    toolbarButtons.push(downloadButton);
  }

  const deleteFeatureButton = Button({
    cls: 'padding-small icon-smaller round light box-shadow relative',
    click() {
      if (drawHandler.getSelection().getLength() > 0 && window.confirm('Vill du radera det här objektet?')) {
        thisComponent.dispatch('toggleDraw', { tool: 'delete' });
      }
    },
    icon: '#ic_delete_24px',
    tooltipText: 'Ta bort',
    tooltipPlacement: 'south',
    tooltipStyle: 'bottom:-5px;',
    state: 'disabled'
  });

  toolbarButtons.push(deleteFeatureButton);

  const closeToolbarButton = Button({
    cls: 'padding-small icon-smaller round light box-shadow relative',
    click() {
      const stylewindowEl = document.getElementById(stylewindow.getId());
      stylewindowEl.classList.add('hidden');
      stylewindowButton.setState('initial');
      viewer.dispatch('toggleClickInteraction', { name: 'draw', active: false });
    },
    icon: '#ic_close_24px',
    tooltipText: 'Stäng',
    tooltipPlacement: 'south',
    tooltipStyle: 'bottom:-5px;'
  });

  toolbarButtons.push(closeToolbarButton);

  const drawToolbarElement = El({
    cls: 'flex fixed bottom-center divider-horizontal bg-inverted z-index-ontop-high no-print small-gap',
    style: 'height: 2rem;',
    components: toolbarButtons
  });

  return Component({
    name: 'draw',
    attributeForm,
    getDrawHandler() {
      return drawHandler;
    },
    saveButton,
    getSelection() {
      return drawHandler.getSelection();
    },
    getDrawOptions() {
      return drawOptions;
    },
    getState() {
      return drawHandler.getState();
    },
    isActive() {
      return isActive;
    },
    onInit() {
      thisComponent = this;
      this.on('render', this.onRender);
    },
    onRender() {
      drawTools = {
        Point: pointButton,
        LineString: lineButton,
        Polygon: polygonButton,
        Text: textButton
      };
      const extraTools = drawOptions.drawTools || [];
      drawExtraTools(extraTools, viewer, drawTools);
    },
    onAdd(evt) {
      viewer = evt.target;
      map = viewer.getMap();
      stylewindow = viewer.getStylewindow();
      stylewindow.on('showStylewindow', function showStylewindow(e) {
        if (e) {
          stylewindowButton.setState('active');
          const stylewindowEl = document.getElementById(this.getId());
          stylewindowEl.classList.remove('hidden');
        } else {
          stylewindowButton.setState('initial');
          const stylewindowEl = document.getElementById(this.getId());
          stylewindowEl.classList.add('hidden');
        }
      });

      if (placement.indexOf('screen') > -1) {
        mapTools = `${viewer.getMain().getMapTools().getId()}`;
        screenButtonContainer = El({
          tagName: 'div',
          cls: 'flex column'
        });
        screenButton = Button({
          cls: 'o-print padding-small margin-bottom-smaller icon-smaller round light box-shadow',
          click() {
            if (!isActive) {
              viewer.dispatch('toggleClickInteraction', { name: 'draw', active: true });
            } else {
              viewer.dispatch('toggleClickInteraction', { name: 'draw', active: false });
            }
          },
          icon,
          tooltipText: buttonText,
          tooltipPlacement: 'east'
        });
        this.addComponent(screenButton);
      }
      if (placement.indexOf('menu') > -1) {
        mapMenu = viewer.getControlByName('mapmenu');
        menuItem = mapMenu.MenuItem({
          click() {
            if (!isActive) {
              viewer.dispatch('toggleClickInteraction', { name: 'draw', active: true });
            } else {
              viewer.dispatch('toggleClickInteraction', { name: 'draw', active: false });
            }
            mapMenu.close();
          },
          icon,
          title: buttonText
        });
        this.addComponent(menuItem);
      }

      this.addComponent(drawToolbarElement);
      if (showAttributeButton) { this.addComponent(attributeForm); }
      if (multipleLayers) { this.addComponent(layerForm); }
      drawHandler = DrawHandler({
        viewer,
        annotation,
        drawCmp: this,
        stylewindow
      });
      drawHandler.restoreState(viewer.getUrlParams());
      this.render();
      viewer.on('toggleClickInteraction', (detail) => {
        onEnableInteraction({ detail });
      });
      map.getLayers().on('remove', onLayerDelete.bind(this));
      drawHandler.on('changeDraw', changeDrawState);
      drawHandler.on('selectionChange', (detail) => {
        if (deleteFeatureButton) {
          const state = detail.features.getLength() > 0 ? 'initial' : 'disabled';
          deleteFeatureButton.setState(state);
        }
        if (showAttributeButton) {
          const state = detail.features.getLength() > 0 ? 'initial' : 'disabled';
          layerAttributeButton.setState(state);
        }
      });
      drawHandler.on('changeButtonState', (detail) => {
        const state = detail.state;
        textButton.setState(state);
        polygonButton.setState(state);
        pointButton.setState(state);
        lineButton.setState(state);
      });
      this.on('toggleDraw', drawHandler.toggleDraw);
      if (isActive) {
        viewer.dispatch('toggleClickInteraction', { name: 'draw', active: true });
      }
    },
    hide() {
      if (placement.some(place => place === 'screen')) {
        document.getElementById(screenButtonContainer.getId()).classList.add('hidden');
      }
    },
    unhide() {
      if (placement.some(place => place === 'screen')) {
        document.getElementById(screenButtonContainer.getId()).classList.remove('hidden');
      }
    },
    render() {
      if (placement.indexOf('screen') > -1) {
        let htmlString = `${screenButtonContainer.render()}`;
        let el = dom.html(htmlString);
        document.getElementById(mapTools).appendChild(el);
        htmlString = screenButton.render();
        el = dom.html(htmlString);
        document.getElementById(screenButtonContainer.getId()).appendChild(el);
      }
      if (placement.indexOf('menu') > -1) {
        mapMenu.appendMenuItem(menuItem);
      }
      const targetElement = document.getElementById(viewer.getMain().getId());
      const htmlString = `
      <div id="${this.getId()}" class="flex no-wrap fade-in no-margin bg-grey-lightest overflow-auto o-hidden">
      <div class="flex fixed bottom-center divider-horizontal box-shadow bg-inverted z-index-ontop-high no-print">

        ${drawToolbarElement.render()}
      </div>
      </div>
      `;

      targetElement.appendChild(dom.html(htmlString));
      this.dispatch('render');
    }
  });
};

export default Draw;
