import createElement from '../../ui/dom/createelement';
import editdispatcher from './editdispatcher';
import relatedtables from '../../utils/relatedtables';

/**
 * Creates a complete form with related items for a feature from all related layers. It adds its content to the el parameter
 * @param {any} viewer The good old viewer
 * @param {any} layer The layer in which the parent feature resides
 * @param {any} feature The parent feature that related items should be displayed for
 * @param {any} el The DOM element where the form is to be dispalyed. It must exist and content is overwritten.
 */
function relatedTablesForm(viewer, layer, feature, el) {
  // Shortest way to clear out contents. Must be allowed.
  // eslint-disable-next-line no-param-reassign
  el.innerHTML = '';
  const relatedLayersConf = relatedtables.getConfig(layer);

  relatedLayersConf.forEach(relatedLayerConf => {
    const childLayer = viewer.getLayer(relatedLayerConf.layerName);
    const tableEl = createElement('div', '');
    // Get only children related to the feature
    relatedtables.getChildFeatures(layer, feature, childLayer).then((childFeatures) => {
      tableEl.appendChild(createElement('p', `<b>${relatedLayerConf.childTitle || childLayer.get('title') || relatedLayerConf.layerName}</b>`));

      childFeatures.forEach(currChild => {
        const currId = currChild.getId();
        let itemTitle = currId;
        if (relatedLayerConf.featureTitle) {
          itemTitle = currChild.get(relatedLayerConf.featureTitle);
        }

        // Display the item as list element
        const rowEl = createElement('div', `<span class="grow">${itemTitle}</span>`, { cls: 'flex row padding-x padding-y-smaller' });

        // Add the deletebutton to the row
        if (!relatedLayerConf.disableDelete) {
          const deleteButtonEl = createElement('button', '<span class="icon"><svg class="o-icon-24"><use xlink:href="#ic_delete_24px"></use></svg></span><span data-tooltip="Ta bort"></span>', { cls: 'compact o-tooltip hover', 'aria-label': 'Ta bort' });
          deleteButtonEl.addEventListener('click', () => {
            if (window.confirm(`Är du säker att du vill ta bort objektet ${itemTitle}?`)) {
              editdispatcher.emitDeleteChild(childLayer, feature, currChild);
            }
          });
          rowEl.appendChild(deleteButtonEl);
        }

        // Add the edit button to the row
        if (!relatedLayerConf.disableEdit) {
          const editButtonEl = createElement('button', '<span class="icon"><svg class="o-icon-24"><use xlink:href="#ic_edit_24px"></use></svg></span><span data-tooltip="Redigera"></span>', { cls: 'compact o-tooltip hover', 'aria-label': 'Redigera' });
          editButtonEl.addEventListener('click', () => {
            editdispatcher.emitEditChild(childLayer, feature, currChild);
          });
          rowEl.appendChild(editButtonEl);
        }
        // Add the row to the form
        tableEl.appendChild(rowEl);
      });

      // Add an add button
      if (!relatedLayerConf.disableAdd && (!relatedLayerConf.maxChildren || childFeatures.length < relatedLayerConf.maxChildren)) {
        const rowEl = createElement('div', '', { cls: 'flex row padding-x padding-y-smaller row-reverse' });
        const addButtonEl = createElement('button', '<span class="icon"><svg class="o-icon-24"><use xlink:href="#ic_add_24px"></use></svg></span><span data-tooltip="Lägg till ny"></span>', { cls: 'compact o-tooltip hover', 'aria-label': 'Lägg till' });
        addButtonEl.addEventListener('click', () => {
          editdispatcher.emitAddChild(layer, feature, childLayer);
        });
        rowEl.appendChild(addButtonEl);
        tableEl.appendChild(rowEl);
      }
      el.appendChild(tableEl);
    });
  });
}

export default relatedTablesForm;
