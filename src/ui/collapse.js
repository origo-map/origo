import Component from './component';
import cuid from './utils/cuid';
import { createStyle } from './dom/dom';

export default function Collapse(options = {}) {
  let {
    expanded = false
  } = options;
  const {
    legendCollapse = false,
    bubble = false,
    cls = '',
    collapseX = true,
    collapseY = true,
    contentComponent,
    headerComponent,
    footerComponent,
    contentCls = '',
    contentStyle: contentStyleOptions = {},
    data = {},
    style: styleSettings,
    tagName = 'div'
  } = options;

  const style = createStyle(styleSettings);
  const contentStyle = createStyle(contentStyleOptions);
  const toggleEvent = 'collapse:toggle';
  const collapseEvent = 'collapse:collapse';
  let containerId = cuid();
  let collapseEl;
  let containerEl;
  let contentEl;

  // Restore auto size after transition
  const onTransitionEnd = function onTransitionEnd() {
    containerEl.removeEventListener('transitionend', onTransitionEnd);
    if (collapseY) containerEl.style.height = null;
    if (collapseX) containerEl.style.width = null;
  };

  const expand = function expand() {
    if (!expanded) {
      collapseEl.classList.add('expanded');
      const newHeight = contentEl.offsetHeight;
      const newWidth = contentEl.scrollWidth;
      if (collapseY) containerEl.style.height = `${newHeight}px`;
      if (collapseX) containerEl.style.width = `${newWidth}px`;
      containerEl.addEventListener('transitionend', onTransitionEnd);
    }
    expanded = true;
  };

  const collapse = function collapse() {
    if (expanded) {
      const collapseSize = 0;
      collapseEl.classList.remove('expanded');
      const currentHeight = contentEl.offsetHeight;
      const currentWidth = contentEl.scrollWidth;
      const elementTransition = containerEl.style.transition;
      containerEl.style.transition = '';

      requestAnimationFrame(() => {
        if (collapseY) containerEl.style.height = `${currentHeight}px`;
        if (collapseX) containerEl.style.width = `${currentWidth}px`;
        containerEl.style.transition = elementTransition;

        requestAnimationFrame(() => {
          if (collapseY) containerEl.style.height = `${collapseSize}px`;
          if (collapseX) containerEl.style.width = `${collapseSize}px`;
        });
      });
    }
    expanded = false;
  };

  const toggle = function toggle(evt) {
    evt.preventDefault();
    if (!bubble) evt.stopPropagation();
    if (expanded) {
      this.collapse();
    } else {
      this.expand();
    }
    this.dispatch(toggleEvent);
  };

  return Component({
    collapse,
    data,
    expand,
    onInit() {
      if ((headerComponent || footerComponent) && contentComponent) {
        if (headerComponent) { this.addComponent(headerComponent); }
        if (footerComponent) { this.addComponent(footerComponent); }
        this.addComponent(contentComponent);
      } else {
        throw new Error('Header or content component is missing in collapse');
      }
    },
    onRender() {
      collapseEl = document.getElementById(this.getId());
      collapseEl.addEventListener(toggleEvent, this.toggle.bind(this));
      collapseEl.addEventListener(collapseEvent, this.collapse.bind(this));
      containerEl = document.getElementById(containerId);
      contentEl = document.getElementById(contentComponent.getId());
      this.dispatch('render');
    },
    render: function render() {
      const height = !expanded && collapseY ? 'height: 0;' : '';
      const width = !expanded && collapseX ? 'width: 0;' : '';
      const isExpanded = expanded ? 'expanded' : '';
      const header = headerComponent ? headerComponent.render() : '';
      const footer = footerComponent ? footerComponent.render() : '';
      if (legendCollapse) {
        containerId = 'legendCollapse';
      }
      return `<${tagName} id="${this.getId()}" class="collapse ${cls} ${isExpanded}" style="${style}">
                ${header}
                <div id="${containerId}" class="collapse-container ${contentCls}" style="${height} ${width} ${contentStyle}">
                  ${contentComponent.render()}
                </div>
                ${footer}
              </${tagName}>`;
    },
    toggle
  });
}
