import Point from 'ol/geom/Point';
import { Component, Button, Element as El, dom } from '../ui';
import utils from '../utils';

const Bookmarks = function Bookmarks(options = {}) {
  const {
    maxZoom = 15,
    duration = 300,
    closeIcon = '#ic_close_24px',
    bookmarksIcon = '#ic_bookmark_24px',
    title = 'Bokmärken'
  } = options;
  let {
    isActive = false
  } = options;
  let headerComponent;
  let titleComponent;
  let listComponent;
  let contentComponent;
  let bookmarksButton;
  let bookmarksButtonEl;
  let bookmarks;
  let bookmarksEl;
  let closeButton;
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
    bookmarkTitle = ''
  } = {}) {
    const titleCmp = El({ cls: 'grow padding-left', innerHTML: bookmarkTitle });
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
        return `<li class="flex row text-smaller align-center padding-x padding-y-smaller hover pointer">
                  ${button.render()}
                  ${titleCmp.render()}
                </li>`;
      }
    });
  };

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

      bookmarksButton = Button({
        icon: bookmarksIcon,
        cls: `control icon-smaller medium round light${bookmarksButtonCls}`,
        tooltipText: title,
        tooltipPlacement: 'east',
        click() {
          toggle();
        }
      });

      closeButton = Button({
        cls: 'small round margin-top-smaller margin-bottom-auto margin-right-small icon-smallest grey-lightest',
        ariaLabel: 'Stäng',
        icon: closeIcon,
        click() {
          toggle();
        }
      });

      titleComponent = El({
        cls: 'justify-start margin-y-smaller margin-left text-weight-bold',
        style: { width: '100%' },
        innerHTML: title
      });

      headerComponent = El({
        cls: 'flex row justify-end',
        style: { width: '100%' },
        components: [titleComponent, closeButton]
      });

      options.items.forEach((item) => {
        const bm = this.Bookmark({
          bookmarkTitle: item.name,
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
        cls: `absolute flex column control bg-white text-small overflow-hidden z-index-top no-select grab${bookmarksElCls}`,
        style: 'top: 1rem; left: 4rem;',
        collapseX: true,
        components: [headerComponent, contentComponent]
      });
    },
    render() {
      const bmEl = dom.html(bookmarks.render());
      document.getElementById(viewer.getMain().getId()).appendChild(bmEl);
      bookmarksEl = document.getElementById(bookmarks.getId());
      const el = dom.html(bookmarksButton.render());
      target.appendChild(el);
      bookmarksButtonEl = document.getElementById(bookmarksButton.getId());
      this.dispatch('render');

      utils.makeElementDraggable(bookmarksEl);
    }
  });
};

export default Bookmarks;
