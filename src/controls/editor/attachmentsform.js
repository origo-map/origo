import attachmentclient from '../../utils/attachmentclient';

/**
 * Creates complete HTML for the attachment edit form including eventhandlers and what not. Asynchronously populates its container when result is received from the server
 * @param {any} layer The layer to create form for
 * @param {any} feature The feature to create form for
 * @param {any} containerId DOM id for a tag that this function will set the innerHTML to.
 * @returns A Promise when resolved returns nothing at all really.
 */
const attachmentsform = function attachmentsform(layer, feature, containerId) {
  let str = '<h4>Bilagor</h4><br/>';

  // Create the repo. No network traffic yet
  const ac = attachmentclient(layer);
  const groups = ac.getGroups();

  // Get from repo
  return ac.getAttachments(feature).then(data => {
    groups.forEach(group => {
      if (group.title) {
        str += `<b>${group.title}</b>`;
      }
      if (data.has(group.name)) {
        const value = data.get(group.name);
        value.forEach(link => {
          // Display the link and add a delete button
          str += `<div style="display: flex;align-items: center;">
                    <a style="flex-grow: 1;" href="${link.url}" target="_blank">${link.filename}</a>
                    <button class="o-button-lg" id="o-attachid-${link.id}"><svg class="o-icon-24"><use xlink:href="#ic_delete_24px"></use></svg></button>
                  </div>`;
        });
      }
      // Add an add button. Do some silly css stuff to hide the actual file input as it is very ugly and use the label instead
      // and even stupidier css stuff to make the button inside the label not act like a button. But it's there to steal the button style
      let acceptstring = '';
      if (group.allowedFiles) {
        acceptstring = `accept="${group.allowedFiles}"`;
      }
      str += `<div>
                <label  for="o-attach-${group.name}" style= "cursor: pointer;display: block;">
                  <button class="o-button-lg" style="pointer-events: none;">
                    <svg class="o-icon-24"><use xlink:href="#ic_add_24px"></use></svg>
                  </button>
                </label>
                <input type="file" id="o-attach-${group.name}" ${acceptstring} style="opacity: 0; width: 0; height:0; padding: 0; border:0;"/>
              </div>`;
    });

    // Set the content on our container. It just happens to acually create the DOM objects as well
    document.getElementById(containerId).innerHTML = str;
    // Elements exist now, add handlers.
    // Maybe build content using Element instead to make it easier to attach handlers
    groups.forEach(currGroup => {
      const key = currGroup.name;

      // Add an add event listener for each group
      const elm = document.getElementById(`o-attach-${key}`);
      elm.addEventListener('change', ev => {
        ac.addAttachment(feature, ev.target.files[0], key)
          .then(() => {
            // Kinda looks like it is recursive, but it's not. It just schedules a promise to refresh the from content
            attachmentsform(layer, feature, containerId);
          })
          .catch(err => {
            const errorMessage = `<p>Misslyckades med att spara: ${err}</p>`;
            document.getElementById(containerId).innerHTML = errorMessage;
          });
      });
      // Only look for remove buttons in groups that actually have attachments
      if (data.has(key)) {
        const links = data.get(key);
        // Add a delete eventhandler for each attachment
        links.forEach(link => {
          const deleteButtonElm = document.getElementById(`o-attachid-${link.id}`);
          deleteButtonElm.addEventListener('click', () => {
            // TODO:: Add confirm
            ac.deleteAttachment(feature, link.id)
              .then(() => {
                // Kinda looks like it is recursive, but it's not. It just schedules a promise to re-read attachements
                attachmentsform(layer, feature, containerId);
              })
              .catch(err => {
                const errorMessage = `<p>Misslyckades med att ta bort: ${err}</p>`;
                document.getElementById(containerId).innerHTML = errorMessage;
              });
          });
        });
      }
    });
  });
  // .catch(err => {
  //  const errorMessage = `<p>Misslyckades med att hämta attachments: ${err}</p>`;
  //  document.getElementById(containerId).innerHTML = errorMessage;
  // });
};

export default attachmentsform;
