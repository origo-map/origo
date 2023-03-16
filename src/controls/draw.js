import { Button, dom, Component, Element as El, Input, Modal } from '../ui';
import drawHandler from './draw/drawhandler';
import drawExtraTools from './draw/drawtools';
import exportToFile from '../utils/exporttofile';

const Draw = function Draw(options = {}) {
  const {
    buttonText = 'Rita',
    annotation,
    showAttributeButton = false,
    showDownloadButton = false,
    showSaveButton = false,
    multipleLayers = false
  } = options;

  const icon = '#fa-pencil';
  let map;
  let viewer;
  let drawTools;
  let mapMenu;
  let menuItem;
  let stylewindow;
  let saveButton;
  let thisComponent;

  function setActive(state) {
    if (state === true) {
      document.getElementById(thisComponent.getId()).classList.remove('o-hidden');
    } else {
      document.getElementById(thisComponent.getId()).classList.add('o-hidden');
      thisComponent.dispatch('toggleDraw', { tool: 'cancel' });
      stylewindow.dispatch('showStylewindow', false);
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

  const layerForm = Component({ // Handle draw layers
    name: 'layerForm',
    show() {
      const drawLayers = drawHandler.getDrawLayers();
      const activeLayer = drawHandler.getActiveLayer();
      const components = [];
      let modal;

      drawLayers.reverse().forEach(drawLayer => {
        const thisForm = this;
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
          icon: '#ic_check_24px',
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
              filename: 'export'
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
          await drawHandler.addLayer();
          modal.closeModal();
          layerForm.show();
        }
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
        components: [okButton, addLayerButton],
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
      thisComponent.dispatch('toggleDraw', { tool: 'Point' });
    },
    icon: '#ic_place_24px',
    tooltipText: 'Punkt',
    tooltipPlacement: 'south',
    tooltipStyle: 'bottom:-5px;'
  });

  toolbarButtons.push(pointButton);

  const lineButton = Button({
    cls: 'padding-small icon-smaller round light box-shadow relative',
    click() {
      thisComponent.dispatch('toggleDraw', { tool: 'LineString' });
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
      thisComponent.dispatch('toggleDraw', { tool: 'Polygon' });
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
      thisComponent.dispatch('toggleDraw', { tool: 'Text' });
    },
    icon: '#ic_title_24px',
    tooltipText: 'Text',
    tooltipPlacement: 'south',
    tooltipStyle: 'bottom:-5px;'
  });

  toolbarButtons.push(textButton);

  if (showAttributeButton) {
    const layerAttributeButton = Button({
      cls: 'padding-small icon-smaller round light box-shadow relative',
      click() {
        attributeForm.show();
      },
      icon: '#ic_menu_24px',
      tooltipText: 'Attribut',
      tooltipPlacement: 'south',
      tooltipStyle: 'bottom:-5px;'
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
      tooltipStyle: 'bottom:-5px;'
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
          filename: 'export'
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
    tooltipStyle: 'bottom:-5px;'
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
    drawHandler,
    saveButton,
    getSelection() {
      return drawHandler.getSelection();
    },
    getState() {
      return drawHandler.getState();
    },
    toggleDraw(e) {
      drawHandler.toggleDraw(e);
    },
    cancelDraw() {
      drawHandler.cancelDraw();
    },
    onInit() {
      thisComponent = this;
      this.on('render', this.onRender);
      this.on('cancelDraw', this.cancelDraw);
      this.on('toggleDraw', this.toggleDraw);
      this.on('changeDraw', changeDrawState);
    },
    onRender() {
      drawTools = {
        Point: pointButton,
        LineString: lineButton,
        Polygon: polygonButton,
        Text: textButton
      };
      const extraTools = options.drawTools || [];
      drawExtraTools(extraTools, viewer, drawTools);
    },
    onAdd(evt) {
      viewer = evt.target;
      map = viewer.getMap();
      mapMenu = viewer.getControlByName('mapmenu');
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

      menuItem = mapMenu.MenuItem({
        click() {
          if (!drawHandler.isActive()) {
            viewer.dispatch('toggleClickInteraction', { name: 'draw', active: true });
          }
          mapMenu.close();
        },
        icon,
        title: buttonText
      });

      this.addComponent(menuItem);
      this.addComponent(drawToolbarElement);
      if (showAttributeButton) { this.addComponent(attributeForm); }
      if (multipleLayers) { this.addComponent(layerForm); }
      drawHandler.init({
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
    },
    render() {
      mapMenu.appendMenuItem(menuItem);
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
