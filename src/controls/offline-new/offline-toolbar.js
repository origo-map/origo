import { Element } from '../../ui';

/**
 * Creates an offline toolbar element with customizable buttons.
 *
 * @param {Object} options - The options for configuring the offline toolbar.
 * @param {Array} options.buttons - An array of buttons to be included in the toolbar.
 * @returns {Element} The offline toolbar element.
 */
const offlineToolbar = function offlineToolbar(options = {}) {
  const {
    buttons = []
  } = options;

  // Create a separator element for buttons.
  const buttonSeparatorElement = Element({
    cls: 'padding-smaller',
    tagName: 'div'
  });

  // Prepare an array to hold buttons and separators.
  const toolbarButtons = [];

  // Iterate through provided buttons and add them to the toolbar.
  if (buttons.length) {
    buttons.forEach((button, index) => {
      toolbarButtons.push(button);
      // Add a separator unless it's the last button.
      if (index < buttons.length) {
        toolbarButtons.push(buttonSeparatorElement);
      }
    });
  }

  // Create the main toolbar element.
  const toolbarElement = Element({
    cls: 'flex fixed bottom-center divider-horizontal box-shadow bg-inverted z-index-ontop-high no-print',
    style: 'height: 2rem;',
    components: toolbarButtons
  });

  // Wrap the toolbar element in a wrapper element.
  const toolbarWrapperElement = Element({
    cls: 'o-go-offline-toolbar o-toolbar o-toolbar-horizontal o-padding-horizontal-8 o-rounded-top o-hidden',
    tagName: 'div',
    components: [toolbarElement]
  });

  return toolbarWrapperElement;
};

export default offlineToolbar;
