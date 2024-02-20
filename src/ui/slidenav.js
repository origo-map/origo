import Component from './component';
import Button from './button';
import Element from './element';
import { createStyle, html } from './dom/dom';

/**
 * Component for horizontal navigation, by sliding between
 * a main and secondary component.
 * The height is animated by temporarily setting a height during transition.
 * Sliding direction can be controlled by setting the slidenav
 * to css class right or left.
 */
export default function Slidenav(options = {}) {
  const {
    backIcon = '#ic_chevron_left_24px',
    cls: clsOption = 'right',
    mainComponent,
    secondaryComponent,
    style: styleSettings,
    legendSlideNav = false,
    viewer
  } = options;

  const style = createStyle(styleSettings);
  const cls = `${clsOption} slidenav`;
  const slideEvent = 'slide';

  let main;
  let secondary;
  let slidenavEl;
  let mainEl;
  let secondaryEl;
  let secondaryTitle = '';
  let state = 'initial';

  let mainContainer;
  let backButton;
  let header;
  let secondaryContainer;
  let secondaryLabelCls = '';
  let posMem = 0;

  /**
   * Toggle position between absolute and relative,
   * to get proper auto height for the container.
   * Reset height to auto when transition is finished.
   */
  const onTransitionEnd = function onTransitionEnd() {
    slidenavEl.removeEventListener('transitionend', onTransitionEnd);
    slidenavEl.style.height = null;
    mainEl.classList.toggle('absolute');
    secondaryEl.classList.toggle('absolute');
    if (legendSlideNav) {
      const containerId = viewer.getControlByName('legend').getOverlaysCollapse().containerId;
      document.getElementById(containerId).scrollTop = posMem;
    }
    state = 'initial';
  };

  const animateHeight = function animateHeight(currentSlide, newSlide) {
    const newHeight = newSlide.scrollHeight;
    const currentHeight = currentSlide.scrollHeight;
    const elementTransition = slidenavEl.style.transition;
    slidenavEl.style.transition = '';

    requestAnimationFrame(() => {
      slidenavEl.style.height = `${currentHeight}px`;
      slidenavEl.style.transition = elementTransition;

      requestAnimationFrame(() => {
        slidenavEl.style.height = `${newHeight}px`;
      });
    });
  };

  const setMain = function setMain(component) {
    if (main) {
      mainContainer.removeComponent(main);
    }
    const el = document.getElementById(main.getId());
    main = component;
    mainContainer.addComponent(main);
    const newEl = html(main.render());
    el.parentNode.replaceChild(newEl, el);
    mainContainer.dispatch('render');
    return main;
  };

  const setSecondary = function setSecondary(component) {
    if (secondary) {
      secondaryContainer.removeComponent(secondary);
      secondaryLabelCls = component.labelCls ? component.labelCls : '';
      secondaryTitle = component.title ? component.title : '';
      secondary = component;
      secondaryContainer.addComponent(secondary);
      secondaryEl.innerHTML = secondaryContainer.renderSecondary();
      secondaryContainer.dispatch('render');
      return secondary;
    }
    secondaryTitle = component.title ? component.title : '';
    secondary = component;
    secondaryContainer.addComponent(secondary);
    return secondary;
  };

  const slideToSecondary = function slideToSecondary() {
    state = 'transition';
    if (legendSlideNav) {
      const containerId = viewer.getControlByName('legend').getOverlaysCollapse().containerId;
      posMem = document.getElementById(containerId).scrollTop;
    }
    slidenavEl.classList.add('slide-secondary');
    animateHeight(mainEl, secondaryEl);
    slidenavEl.addEventListener('transitionend', onTransitionEnd);
    this.dispatch(slideEvent);
  };

  const slideToMain = function slideToMain() {
    state = 'transition';
    slidenavEl.classList.remove('slide-secondary');
    animateHeight(secondaryEl, mainEl);
    slidenavEl.addEventListener('transitionend', onTransitionEnd);
    this.dispatch(slideEvent);
  };

  const getState = function getState() {
    return state;
  };

  return Component({
    slideToMain,
    getState,
    onInit() {
      mainContainer = Element({
        cls: 'main overflow-unset'
      });
      backButton = Button({
        cls: 'icon-small padding-small',
        icon: backIcon,
        iconCls: 'grey',
        click: () => {
          this.slideToMain();
        },
        tabIndex: -99
      });
      header = Component({
        onRender() {
          const labelEl = document.getElementById(this.getId());
          labelEl.addEventListener('click', (e) => {
            backButton.dispatch('click');
            e.preventDefault();
          });
        },
        render() {
          const labelCls = 'grow pointer no-select';
          return `<div id="${this.getId()}" class="${secondaryLabelCls} ${labelCls}">${secondaryTitle}</div>`;
        }
      });
      secondaryContainer = Component({
        onInit() {
          this.addComponent(backButton);
          this.addComponent(header);
        },
        onRender() {
          this.dispatch('render');
        },
        renderSecondary() {
          return `<div class="flex column">
                    <div class="flex row padding-y-small align-center no-grow">${backButton.render()}${header.render()}</div>
                    <div class="divider horizontal"></div>
                    ${secondary.render()}
                  </div>`;
        },
        render() {
          return `<div id="${this.getId()}" class="secondary absolute">
                    ${this.renderSecondary()}
                  </div>`;
        }
      });

      this.addComponent(mainContainer);
      this.addComponent(secondaryContainer);

      if (mainComponent && secondaryComponent) {
        mainContainer.addComponent(mainComponent);
        this.setSecondary(secondaryComponent);
      }
    },
    onRender() {
      mainEl = document.getElementById(mainContainer.getId());
      secondaryEl = document.getElementById(secondaryContainer.getId());
      slidenavEl = document.getElementById(this.getId());
      this.dispatch('render');
    },
    slideToSecondary,
    render() {
      return `<div id="${this.getId()}" class="${cls}" style="${style}">
                ${mainContainer.render()}
                ${secondaryContainer.render()}
              </div>`;
    },
    setMain,
    setSecondary
  });
}
