/* eslint-disable no-unused-vars */
import { Component, Modal, Icon } from '../ui';

const Help = function Help(options = {}) {
  const { icon = '#ic_help_outline_24px', title = 'Hjälp', controlList } = options;
  const cls = 'o-help';
  let { buttonText, target } = options;
  let viewer;
  let mapMenu;
  let menuItem;
  let modal;
  const contentItems = [];
  const defaultOptions = {
    'About': {
      'text': 'Här finner du mer information',
      'icon': '#ic_info_outline_24px'
    },
    'ZoomIn': {
      'text': 'Zooma in i kartan',
      'icon': '#ic_add_24px'
    },
    'ZoomOut': {
      'text': 'Zooma ut i kartan',
      'icon': '#ic_remove_24px'
    },
    'Help': {
      'text': 'Hjälper dig att hitta hit',
      'icon': '#ic_help_outline_24px'
    },
    'Home': {
      'text': 'Tar kartan till startposition',
      'icon': '#ic_home_24px'
    },
    'Geoposition': {
      'text': 'Tar kartan till din position',
      'icon': '#ic_near_me_24px'
    },
    'Measure': {
      'text': 'Mät avtånd och ytor',
      'icon': '#ic_straighten_24px'
    },
    'Mapmenu': {
      'text': 'I menyn hittar du fler verktyg',
      'icon': '#ic_menu_24px'
    },
    'Sharemap': {
      'text': 'Dela din karta med en kompis!',
      'icon': '#ic_screen_share_outline_24px'
    },
    'Print': {
      'text': 'Skriv ut kartan till en pdf',
      'icon': '#ic_print_24px'
    },
    'Link': {
      'text': 'Tar dig någon annanstans...',
      'icon': '#ic_launch_24px'
    },
    'Draganddrop': {
      'text': 'Du har möjlighet att dra in lager från din dator till kartan. Möjliga format är: GPX, GeoJSON, IGC, KML och TopoJSON',
      'icon': ''
    },
    'Editor': {
      'text': 'Öppnar redigeringsverktyget',
      'icon': '#ic_edit_24px'
    },
    'Fullscreen': {
      'text': 'Öppnar kartan i helskärmsläge',
      'icon': '#ic_fullscreen_24px'
    },
    'Legend': {
      'text': 'Innehållsförteckning och teckenförklaring - visa eller dölj kartlager, klicka på rubriker och kartlager för information, ändra lagers genomskinlighet mm',
      'icon': '#ic_layers_24px'
    },
    'Position': {
      'text': 'Klicka på denna om du vill ha positionen från kartans centrum och kan definiera egna koordinater direkt i koordinattexten. Byt system genom att klicka på koordinatsystemet',
      'icon': '#ic_gps_not_fixed_24px'
    },
    'Progressbar': {
      'text': 'Den blå linjen i nedre delan av kartan visar på hämtning av information',
      'icon': ''
    },
    'Rotate': {
      'text': 'Rotera kartan med två fingrar på pekskärm, håll ned Shift+Alt på PC. Klicka på symbolen för att återgå',
      'icon': '#origo-compass'
    },
    'Scale': {
      'text': '',
      'icon': ''
    },
    'Scaleline': {
      'text': '',
      'icon': ''
    },
    'Search': {
      'text': 'Sök i kartan',
      'icon': '#ic_search_24px'
    },
    'Splash': {
      'text': '',
      'icon': ''
    },
    'Externalurl': {
      'text': 'Öppnar fler knappar där du kan välja att öppna din kartposition i annan applikation',
      'icon': '#ic_baseline_link_24px'
    },
    'Scalepicker': {
      'text': 'Visar kartans nuvarande skala. Klicka för att välja skala manuellt',
      'icon': ''
    }
  };

  const modalContent = () => {
    options.controlList.forEach((el) => {
      const text = el.text || defaultOptions[el.name].text;
      const icon = el.icon || defaultOptions[el.name].icon;
      const iconStyle = el.iconStyle || '';
      const controlIcons = Icon({
        icon: icon,
        style: iconStyle
      });
      const list = `<li class="flex ${cls}"><span class="flex icon icon-medium padding-x-large">${controlIcons.render()}</span>${text}</li>`;
      contentItems.push(list);
    });
  };

  return Component({
    name: 'help',
    onAdd(evt) {
      if (!buttonText) buttonText = title;
      viewer = evt.target;
      target = viewer.getId();
      mapMenu = viewer.getControlByName('mapmenu');
      modalContent();
      menuItem = mapMenu.MenuItem({
        click() {
          modal = Modal({
            title,
            content: contentItems.join(' '),
            target
          });
          this.addComponent(modal);
          mapMenu.close();
        },
        icon,
        title: buttonText
      });
      this.addComponent(menuItem);
      this.render();
    },
    render() {
      mapMenu.appendMenuItem(menuItem);
      this.dispatch('render');
    }
  });
};

export default Help;
