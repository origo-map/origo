import { Component, Modal, Icon, Element as El, Button, dom } from '../ui';

const Help = function Help(options = {}) {
  const {
    icon = '#ic_help_outline_24px',
    title = 'Hjälp',
    description,
    descriptionStyle = 'display:block; padding-left:15px; padding-right:15px; padding-bottom:10px;',
    controlList,
    placement = ['menu']
  } = options;
  const cls = 'o-help';
  const contentItems = [];
  const defaultOptions = {
    ZoomIn: {
      text: 'Zooma in i kartan',
      icon: '#ic_add_24px'
    },
    ZoomOut: {
      text: 'Zooma ut i kartan',
      icon: '#ic_remove_24px'
    },
    Home: {
      text: 'Tar kartan till startposition',
      icon: '#ic_home_24px'
    },
    Fullscreen: {
      text: 'Öppnar kartan i helskärmsläge',
      icon: '#ic_fullscreen_24px'
    },
    Geoposition: {
      text: 'Tar kartan till din position',
      icon: '#ic_near_me_24px'
    },
    Measure: {
      text: 'Mät avtånd och ytor',
      icon: '#ic_straighten_24px'
    },
    Externalurl: {
      text: 'Öppnar fler knappar där du kan välja att öppna din kartposition i annan applikation',
      icon: '#ic_baseline_link_24px'
    },
    Editor: {
      text: 'Öppnar redigeringsverktyget',
      icon: '#ic_edit_24px'
    },
    Rotate: {
      text: 'Rotera kartan med två fingrar på pekskärm, håll ned Shift+Alt på PC. Klicka på symbolen för att återgå',
      icon: '#origo-compass'
    },
    Search: {
      text: 'Sök i kartan',
      icon: '#ic_search_24px'
    },
    Mapmenu: {
      text: 'I menyn hittar du fler verktyg',
      icon: '#ic_menu_24px'
    },
    About: {
      text: 'Här finner du mer information',
      icon: '#ic_info_outline_24px'
    },
    Help: {
      text: 'Hjälper dig att hitta hit',
      icon: '#ic_help_outline_24px'
    },
    Sharemap: {
      text: 'Dela din karta med en kompis!',
      icon: '#ic_screen_share_outline_24px'
    },
    Print: {
      text: 'Skriv ut kartan till en pdf',
      icon: '#ic_print_24px'
    },
    Link: {
      text: 'Tar dig någon annanstans...',
      icon: '#ic_launch_24px'
    },
    Legend: {
      text: 'Innehållsförteckning och teckenförklaring - visa eller dölj kartlager, klicka på rubriker och kartlager för information, ändra lagers genomskinlighet mm',
      icon: '#ic_layers_24px'
    },
    Position: {
      text: 'Klicka på denna om du vill ha positionen från kartans centrum och kan definiera egna koordinater direkt i koordinattexten. Byt system genom att klicka på koordinatsystemet',
      icon: '#ic_gps_not_fixed_24px'
    },
    Progressbar: {
      text: 'Den blå linjen i nedre delan av kartan visar på hämtning av information',
      icon: ''
    },
    Scale: {
      text: '',
      icon: ''
    },
    Scaleline: {
      text: '',
      icon: ''
    },
    Scalepicker: {
      text: 'Visar kartans nuvarande skala. Klicka för att välja skala manuellt',
      icon: ''
    },
    Splash: {
      text: '',
      icon: ''
    },
    Draganddrop: {
      text: 'Du har möjlighet att dra in lager från din dator till kartan. Möjliga format är: GPX, GeoJSON, IGC, KML och TopoJSON',
      icon: ''
    }
  };

  const modalContent = () => {
    if (description) {
      const descriptionEl = `<li class="flex ${cls}"${descriptionStyle ? ` style="${descriptionStyle}"` : ''}>${description}</li>`;
      contentItems.push(descriptionEl);
    }
    controlList.forEach((el) => {
      const textEl = el.text || defaultOptions[el.name].text;
      const iconEl = el.icon || defaultOptions[el.name].icon;
      const iconStyle = el.iconStyle || '';
      const controlIcons = Icon({
        icon: iconEl,
        style: iconStyle
      });
      const list = `<li class="flex ${cls}"${el.style ? ` style="${el.style}"` : ''}><span class="flex icon icon-medium padding-x-large">${controlIcons.render()}</span>${textEl}</li>`;
      contentItems.push(list);
    });
  };

  let { buttonText, target } = options;
  let viewer;
  let mapMenu;
  let menuItem;
  let mapTools;
  let screenButtonContainer;
  let screenButton;
  let modal;

  return Component({
    name: 'help',
    onAdd(evt) {
      if (!buttonText) buttonText = title;
      viewer = evt.target;
      target = viewer.getId();
      modalContent();

      if (placement.indexOf('screen') > -1) {
        mapTools = `${viewer.getMain().getMapTools().getId()}`;
        screenButtonContainer = El({
          tagName: 'div',
          cls: 'flex column'
        });
        screenButton = Button({
          cls: 'o-print padding-small margin-bottom-smaller icon-smaller round light box-shadow',
          click() {
            modal = Modal({
              title,
              content: contentItems.join(' '),
              target
            });
            this.addComponent(modal);
          },
          icon,
          tooltipText: title,
          tooltipPlacement: 'east'
        });
        this.addComponent(screenButton);
      }
      if (placement.indexOf('menu') > -1) {
        mapMenu = viewer.getControlByName('mapmenu');
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
      }
      this.render();
    },
    render() {
      if (placement.indexOf('screen') > -1) {
        let htmlString = `${screenButtonContainer.render()}`;
        let el = dom.html(htmlString);
        document.getElementById(mapTools).appendChild(el);
        htmlString = screenButton.render();
        el = dom.html(htmlString);
        document.getElementById(screenButtonContainer.getId()).appendChild(el);
      }
      if (placement.indexOf('menu') > -1) {
        mapMenu.appendMenuItem(menuItem);
      }
      this.dispatch('render');
    }
  });
};

export default Help;
