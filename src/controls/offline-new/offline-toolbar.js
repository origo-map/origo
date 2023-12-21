import { Element } from '../../ui';

/**
 *
 * @param {*} options
 * @returns Element
 */
const offlineToolbar = function offlineToolbar(options = {}) {
  const {
    buttons = []
  } = options;

  const buttonSeparatorElement = Element({
    cls: 'padding-smaller',
    tagName: 'div'
  });

  const toolbarButtons = [];

  /**
   * Place separator element between buttons.
   */
  if (buttons.length) {
    buttons.forEach((button, index) => {
      toolbarButtons.push(button);
      if (index < buttons.length) {
        toolbarButtons.push(buttonSeparatorElement);
      }
    });
  }

  /**
   * Create toolbar element.
   */
  const toolbarElement = Element({
    cls: 'flex fixed bottom-center divider-horizontal box-shadow bg-inverted z-index-ontop-high no-print',
    style: 'height: 2rem;',
    components: toolbarButtons
  });

  /**
   * Wrap toolbar in a toolbar wrapper element.
   */
  const toolbarWrapperElement = Element({
    cls: 'o-go-offline-toolbar o-toolbar o-toolbar-horizontal o-padding-horizontal-8 o-rounded-top o-hidden',
    tagName: 'div',
    components: [toolbarElement]
  });

  return toolbarWrapperElement;
};

export default offlineToolbar;
