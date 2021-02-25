import Point from 'ol/geom/Point';
import { Component, Button, Element as El, dom } from '../ui';

const Bookmarks = function Bookmarks(options = {}) {
  const {
    maxZoom = 15,
    duration = 300,
    closeIcon = '#ic_close_24px',
    bookmarksIcon = '#ic_bookmark_24px'
  } = options;
  let {
    isActive = false
  } = options;
  let containerElement;
  let headerComponent;
  let listComponent;
  let contentComponent;
  let bookmarksButton;
  let closeButton;
  let bookmarksEl;
  let bookmarksButtonEl;
  let bookmarks;
  let viewer;
  let target;

  const toggle = function toggle() {
    bookmarksEl.classList.toggle('faded');
    bookmarksButtonEl.classList.toggle('active');
    isActive = !isActive;
    bookmarksEl.style.cssText = 'top: 1rem; left: 4rem;';
  };

  const close = function close() {
    if (isActive) {
      toggle();
    }
  };

  const goToBookmark = function goToBookmark(item) {
    viewer.getMap().getView().fit(new Point(item.coordinates), {
      maxZoom: item.zoomLevel || maxZoom,
      duration
    });
  };

  const Bookmark = function Bookmark({
    icon = '#ic_play_arrow_24px',
    click,
    title = ''
  } = {}) {
    const titleCmp = El({ cls: 'grow padding-left', innerHTML: title });
    const button = Button({
      cls: 'icon-smallest compact no-grow',
      click,
      icon
    });

    return Component({
      close,
      onInit() {
        this.addComponent(button);
      },
      onRender() {
        this.dispatch('render');
        document.getElementById(titleCmp.getId()).addEventListener('click', () => {
          button.dispatch('click');
        });
      },
      render() {
        return `<li class="flex row align-center padding-x padding-y-smaller hover pointer">
                  ${button.render()}
                  ${titleCmp.render()}
                </li>`;
      }
    });
  };

  function makeElementDraggable(elm) {
    const touchMode = 'ontouchstart' in document.documentElement;
    const elmnt = elm;
    let pos1 = 0;
    let pos2 = 0;
    let pos3 = 0;
    let pos4 = 0;

    function elementDrag(evt) {
      const e = evt || window.event;
      e.preventDefault();

      const clientX = e.clientX === undefined ? e.touches[0].clientX : e.clientX;
      const clientY = e.clientY === undefined ? e.touches[0].clientY : e.clientY;
      pos1 = pos3 - clientX;
      pos2 = pos4 - clientY;
      pos3 = clientX;
      pos4 = clientY;

      elmnt.style.top = `${elmnt.offsetTop - pos2}px`;
      elmnt.style.left = `${elmnt.offsetLeft - pos1}px`;
    }

    function closeDragElement() {
      elmnt.classList.toggle('grabbing');

      if (touchMode) {
        elmnt.ontouchend = null;
        elmnt.ontouchmove = null;
      } else {
        document.onmouseup = null;
        document.onmousemove = null;
      }
    }

    function dragMouseDown(evt) {
      const e = evt || window.event;
      elmnt.classList.toggle('grabbing');
      pos3 = e.clientX;
      pos4 = e.clientY;

      if (touchMode) {
        elmnt.ontouchend = closeDragElement;
        elmnt.ontouchmove = elementDrag;
      } else {
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
      }
    }

    if (touchMode) {
      elmnt.ontouchstart = dragMouseDown;
    } else {
      elmnt.onmousedown = dragMouseDown;
    }
  }

  return Component({
    name: 'bookmarks',
    close,
    Bookmark,
    onAdd(evt) {
      viewer = evt.target;
      target = document.getElementById(viewer.getMain().getMapTools().getId());
      this.on('render', this.onRender);
      this.addComponents([bookmarks, bookmarksButton]);
      this.render();
    },
    onInit() {
      const bookmarksButtonCls = isActive ? ' active' : '';
      const bookmarksElCls = isActive ? '' : ' faded';
      const items = [];

      containerElement = El({
        tagName: 'div',
        cls: 'flex column'
      });

      bookmarksButton = Button({
        icon: bookmarksIcon,
        cls: `control icon-smaller medium round absolute light${bookmarksButtonCls}`,
        tooltipText: 'Bokmärken',
        tooltipPlacement: 'east',
        click() {
          toggle();
        }
      });

      closeButton = Button({
        cls: 'small round margin-top-small margin-right-small margin-left-small icon-smallest grey-lightest',
        ariaLabel: 'Stäng',
        icon: closeIcon,
        click() {
          toggle();
        }
      });

      headerComponent = El({
        cls: 'flex row justify-start',
        style: { width: '100%' },
        components: [closeButton]
      });

      options.items.forEach((item) => {
        const bm = this.Bookmark({
          title: item.name,
          click() {
            goToBookmark(item);
          }
        });
        items.push(bm);
      });

      listComponent = El({
        tagName: 'ul',
        cls: 'padding-y-small',
        components: items
      });

      contentComponent = El({
        cls: 'relative width-12',
        components: [listComponent]
      });

      bookmarks = El({
        cls: `absolute flex column control bg-white text-smaller overflow-hidden z-index-top no-select grab${bookmarksElCls}`,
        style: 'top: 1rem; left: 4rem;',
        collapseX: true,
        components: [headerComponent, contentComponent]
      });
    },
    render() {
      const containerEl = dom.html(containerElement.render());
      target.appendChild(containerEl);
      const bmEl = dom.html(bookmarks.render());
      document.getElementById(viewer.getMain().getId()).appendChild(bmEl);
      bookmarksEl = document.getElementById(bookmarks.getId());
      const el = dom.html(bookmarksButton.render());
      document.getElementById(containerElement.getId()).appendChild(el);
      bookmarksButtonEl = document.getElementById(bookmarksButton.getId());
      this.dispatch('render');

      makeElementDraggable(bookmarksEl);
    }
  });
};

export default Bookmarks;
