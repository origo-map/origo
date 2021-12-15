import {
  Component
} from '../../ui';

const LayerRow = function LayerRow(options) {
  const {
    layer
  } = options;

  const getLegendUrl = (aLayer, type) => {
    const url = aLayer.getSource().getUrls()[0];
    const layerName = aLayer.get('name');
    return `${url}?layer=${layerName}&format=${type}&version=1.1.1&request=getLegendGraphic&scale=401&legend_options=dpi:300`;
  };

  const getLegendGraphicJSON = async (url) => {
    try {
      const response = await fetch(url);
      const json = await response.json();
      return json;
    } catch (e) {
      console.log(e);
      return null;
    }
  };

  return Component({
    async render() {
      const title = layer.get('title') || 'Titel saknas';
      const getLegendGraphicUrl = getLegendUrl(layer, 'image/png');

      let isTheme = false;
      let icon = '';
      const json = await getLegendGraphicJSON(getLegendUrl(layer, 'application/json'));
      if (!json) {
        isTheme = false;
      } else {
        isTheme = json.Legend[0].rules.length > 1;
        icon = `<img class="cover" src="${getLegendGraphicUrl}">`;
      }
      console.log(json, isTheme);

      let content = '';
      if (!isTheme) {
        content = `
          <div class="flex row">
            <div class="grey-lightest round compact icon-small light relative no-shrink" style="height: 1.5rem; width: 1.5rem;">
              <span class="icon">
                ${icon}
              </span>
            </div>
            <div class="padding-x-small grow no-select overflow-hidden">${title}</div>
          </div>`;
      } else {
        let rules = '';
        json.Legend[0].rules.forEach((rule, index) => {
          const ruleImageUrl = `${getLegendGraphicUrl}&rule=${rule.name}`;
          const rowTitle = rule.title ? rule.title : index + 1;
          rules += `
            <li class="flex row align-center padding-left padding-right item">
              <div class="flex column">
                <div class="flex row">
                  <div class="grey-lightest round compact icon-small light relative no-shrink" style="height: 1.5rem; width: 1.5rem;">
                    <span class="icon">
                      <img class="cover" src="${ruleImageUrl}" style="" title="">
                    </span>
                  </div>
                  <div class="padding-x-small grow no-select overflow-hidden">${rowTitle}</div>
                </div>
              </div>
            </li>`;
        });
        content = `
          <div class="flex row">
            <div class="padding-x-small grow no-select overflow-hidden">${title}</div>
          </div>
          <div class="padding-left">
            <ul>${rules}</ul>
          </div>`;
      }

      return `
        <li id="${this.getId()}" class="flex row align-center padding-left padding-right item">
          <div class="flex column">
            ${content}
          </div>
        </li>`;
    }
  });
};

const LayerRows = function LayerRows(options) {
  const {
    viewer
  } = options;

  return Component({
    async render() {
      const overlays = viewer.getLayers().filter((layer) => layer.get('group') !== 'background' && layer.get('group') !== 'none' && layer.get('visible'));
      const overlayEls = [];

      overlays.forEach((layer) => {
        overlayEls.push(LayerRow({ layer }));
      });
      const layerListCmp = Component({
        async render() {
          const content = await overlayEls.reduce(async (acc, item) => await acc + await item.render(), '');
          return `<ul id="${this.getId()}" class="list">${content}</ul>`;
        }
      });
      return `
        <div id="${this.getId()}" class="overflow-hidden" style="height: 100%; min-width: 220px;">
          <div class="flex column overflow-hidden width-100" style="width: 100%">
            ${await layerListCmp.render()}
          </div>
        </div>`;
    }
  });
};

export default function PrintLegend(options = {}) {
  const {
    viewer
  } = options;

  const setVisible = (display) => {
    document.getElementById('legendContainer').hidden = !display.showPrintLegend;
  };

  return Component({
    setVisible(display) {
      setVisible(display);
    },
    async render() {
      const overlaysCmp = LayerRows({
        viewer
      });

      return `
        <div id="legendContainer">
          <div class="control overflow-hidden flex row o-legend">
            <div class="flex column overflow-hidden relative">
              ${await overlaysCmp.render()}
            </div>
          </div>
        </div>`;
    }
  });
}
