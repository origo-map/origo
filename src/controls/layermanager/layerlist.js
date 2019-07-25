//import 'Origo';
import LayerItem from './layeritem';
import { Component, Element as El, Button, dom } from '../../ui';

const LayerList = function LayerList(options = {}) {
  const {
    cls: clsSettings = '',
    sourceFields,
    sourceUrl,
    url,
    viewer
  } = options;

  let layerItems;
  console.log(sourceFields)
  const searchFields = Object.keys(sourceFields).reduce((prev, curr) => {
    if (sourceFields[curr].searchable) {
      return prev.concat(curr);
    }
    return prev;
  }, []);

  const renderListItems = components => components.reduce((acc, comp) => acc + comp.render(), '');

  const sortAscending = (list, key) => {
    if (key) {
      return list.sort((a,b) => (a[key] > b[key]) ? 1 : ((b[key] > a[key]) ? -1 : 0))
    }
    return list;
  };

  const createLayerItems = (list) => {
    const sorted = sortAscending(list, sourceFields.title.name);
    return sorted.map((layer) => {
      return LayerItem({ 
        data: layer,
        sourceFields,
        sourceUrl,
        url,
        viewer
      });
    });
  };

  const findMatch = (searchString, data) => {
    const isMatch = searchFields.reduce((result, field) => {
      const searchField = sourceFields[field].name;
      if (searchField) {
        let searchData = data[searchField];
        if (searchData) {
          searchData = searchData.toLowerCase();
          if (searchData.search(searchString) > -1) return true;
        }        }
      return result;
    }, false);
    return isMatch;
  };

  const searchByText = function searchByText(searchString) {
    const matches = layerItems.filter((layerItem) => {
      const data = layerItem.getData();
      const isMatch = findMatch(searchString, data);
      return isMatch;
    });
    return matches;
  };

  return Component({
    addLayers(list) {
      layerItems = createLayerItems(list);
      this.addComponents(layerItems);
      this.update();
    },
    render(cmps) {
      const components = cmps ? cmps : this.getComponents();
      return `<div id="${this.getId()}" class="o-list-container flex column overflow-auto-y padding-right-large">
                <ul class="divided list">${renderListItems(components)}</ul>
              </div>`
    },
    search(searchText) {
      const matches = searchByText(searchText);
      this.clearComponents();
      this.addComponents(matches);
      this.update(matches);
    },
    update(cmps) {
      const el = document.getElementById(this.getId());
      const htmlString = cmps ? this.render(cmps) : this.render();
      const newEl = dom.html(htmlString);
      el.parentNode.replaceChild(newEl, el);
      this.dispatch('render');      
    }
  });
};

export default LayerList;