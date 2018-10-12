import cu from 'ceeu';
import modal from '../modal';
import permalink from '../permalink/permalink';

const ShareMap = function ShareMap() {
  let viewer;
  let shareMapButton;
  let shareMapElement;

  const createContent = function createContent() {
    return '<div class="o-share-link"><input type="text"></div>' +
      '<i>Kopiera och klistra in länken för att dela kartan.</i>';
  };

  const createLink = function createLink() {
    const url = permalink.getPermalink(viewer);
    const inputElement = document.getElementsByClassName('o-share-link')[0].firstElementChild;
    inputElement.value = url;
    inputElement.select();
  };

  const openModal = function openModal() {
    modal.createModal(`#${viewer.getId()}`, {
      title: 'Länk till karta',
      content: createContent()
    });
    modal.showModal();
    createLink(); // Add link to input
    viewer.getControlByName('mapmenu').toggleMenu();
  };
  return cu.Component({
    onAdd(evt) {
      viewer = evt.target;
      this.addComponents([shareMapButton]);
      this.render();
    },
    onInit() {
      shareMapButton = cu.Button({
        cls: 'o-menu-button',
        click() {
          openModal();
        },
        text: 'Dela karta',
        icon: '#ic_screen_share_outline_24px',
        iconCls: 'o-button-icon'
      });

      const rendered = shareMapButton.render();

      shareMapElement = cu.Element({
        cls: '',
        tagName: 'li',
        innerHTML: `${rendered}`
      });
    },
    render() {
      const el = cu.dom.html(shareMapElement.render());
      document.getElementById('o-menutools').appendChild(el);
      this.dispatch('render');
    }
  });
};

export default ShareMap;
