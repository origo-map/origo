import createElement from '../../ui/dom/createelement';
import attachmentclient from '../../utils/attachmentclient';

/**
 * Creates complete HTML for the attachment edit form including eventhandlers and what not. Asynchronously populates its container when result is received from the server
 * @param {any} layer The layer to create form for
 * @param {any} feature The feature to create form for
 * @param {any} el DOM element that this function will set the innerHTML to.
 * @returns A Promise when resolved returns nothing at all really.
 */
const attachmentsform = function attachmentsform(layer, feature, el) {
  // Create the repo. No network traffic yet it just reads config
  const ac = attachmentclient(layer);
  const groups = ac.getGroups();

  // Shortest code to clear a node
  // eslint-disable-next-line no-param-reassign
  el.innerHTML = '';
  el.appendChild(createElement('label', `${layer.get('attachments').formTitle || 'Bilagor'}`));
  el.appendChild(document.createElement('br'));
  el.appendChild(createElement('p', 'Hämtar ...'));

  // Get from repo
  ac.getAttachments(feature).then(data => {
    el.removeChild(el.lastChild);
    groups.forEach(group => {
      if (group.title) {
        el.appendChild(createElement('b', `${group.title}`));
      }

      if (data.has(group.name)) {
        const value = data.get(group.name);
        value.forEach(link => {
          // Display the link and add a delete button
          const rowEl = createElement('div', `<a class="grow" href="${link.url}" target="_blank">${link.filename}</a>`, { cls: 'flex row padding-x padding-y-smaller' });
          const deleteButtonEl = createElement('button', '<span class="icon"><svg class="o-icon-24"><use xlink:href="#ic_delete_24px"></use></svg></span><span data-tooltip="Ta bort"></span>', { cls: 'compact o-tooltip hover', 'aria-label': 'Ta bort' });
          deleteButtonEl.addEventListener('click', () => {
            if (window.confirm(`Är du säker att du vill ta bort filen ${link.filename}`)) {
              ac.deleteAttachment(feature, link.id)
                .then(() => {
                  // Kinda looks like it is recursive, but it's not. It just schedules a promise to re-read attachements
                  attachmentsform(layer, feature, el);
                })
                .catch(err => {
                  const errorMessageEl = createElement('p', `Misslyckades med att ta bort: ${err}`);
                  el.appendChild(errorMessageEl);
                });
            }
          });
          rowEl.appendChild(deleteButtonEl);
          el.appendChild(rowEl);
        });
      }
      // Add an add button.

      // Set up file browsing filter
      let acceptstring = '*';
      if (group.allowedFiles) {
        acceptstring = group.allowedFiles;
      }
      const rowEl = createElement('div', '', { cls: 'flex row padding-x padding-y-smaller row-reverse' });
      const labelEl = createElement('label', '<span data-tooltip="Lägg till"></span>', { style: 'cursor: pointer;', cls: 'hover o-tooltip' });
      const addButtonEl = createElement('button', '<span class="icon"><svg class="o-icon-24"><use xlink:href="#ic_add_24px"></use></svg></span>', { cls: 'compact', 'aria-label': 'Lägg till', style:'pointer-events:none;' });
      // Do some silly css stuff to hide the actual file input as it is very ugly and use the label instead
      const inputEl = createElement('input', '', { type: 'file', accept: `${acceptstring}`, style: 'opacity: 0; width: 1px; height:1px; padding: 0; border:0;' });
      labelEl.appendChild(inputEl);
      labelEl.appendChild(addButtonEl);
      rowEl.appendChild(labelEl);

      inputEl.addEventListener('change', ev => {
        ac.addAttachment(feature, ev.target.files[0], group.name)
          .then(() => {
            // Kinda looks like it is recursive, but it's not. It just schedules a promise to refresh the form content
            attachmentsform(layer, feature, el);
          })
          .catch(err => {
            const errorMessageEl = createElement('p', `Misslyckades med att ta spara: ${err}`);
            el.appendChild(errorMessageEl);
          });
      });
      el.appendChild(rowEl);
    });
  })
    .catch(err => {
      const errorMessageEl = createElement('p', `Misslyckades med att hämta bilagor: ${err}`);
      el.appendChild(errorMessageEl);
    });
};

export default attachmentsform;
