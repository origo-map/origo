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

  const AboutText = 'Här finner du mer information';
  const ZoomInText = 'Zooma in i kartan';
  const ZoomOutText = 'Zooma ut i kartan';
  const HelpText = 'Hjälper dig att hitta hit';
  const HomeText = 'Tar kartan till startposition';
  const GeopositionText = 'Tar kartan till din position';
  const MeasureText = 'Mät avtånd och ytor';
  const MapmenuText = 'I menyn hittar du fler verktyg';
  const SharemapText = 'Dela din karta med en kompis!';
  const PrintText = 'Skriv ut kartan till en pdf';
  const LinkText = 'Tar dig någon annanstans...';
  const DraganddropText = 'Du har möjlighet att dra in lager från din dator till kartan. Möjliga format är: GPX, GeoJSON, IGC, KML och TopoJSON';
  const EditorText = 'Öppnar redigeringsverktyget';
  const FullscreenText = 'Öppnar kartan i helskärmsläge';
  const LegendText = 'Kartlegenden. Här tänder/släcker, ändrar transparensen och finner information om kartlagret';
  const PositionText = 'Klicka på denna om du vill ha positionen från kartans centrum och kan definiera egna koordinater direkt i koordinattexten. Byt system genom att klicka på koordinatsystemet';
  const ProgressbarText = 'Den blå linjen i nedre delan av kartan visar på hämtning av information';
  const RotateText = 'Rotera kartan med två fingrar på pekskärm, håll ned shift+alt på pc. Klicka på symbolen för att återgå';
  const ScaleText = '';
  const ScalelineText = '';
  const SearchText = 'Sök i kartan';
  const SplashText = '';
  const ExternalurlText = 'Öppnar fler knappar där du kan välja att öppna din kartposition i annan applikation';
  const ScalepickerText = '';

  const AboutIcon = '#ic_info_outline_24px';
  const ZoomInIcon = '#ic_add_24px';
  const ZoomOutIcon = '#ic_remove_24px';
  const HelpIcon = '#ic_help_outline_24px';
  const HomeIcon = '#ic_home_24px';
  const GeopositionIcon = '#ic_near_me_24px';
  const MeasureIcon = '#ic_straighten_24px';
  const MapmenuIcon = '#ic_menu_24px';
  const SharemapIcon = '#ic_screen_share_outline_24px';
  const PrintIcon = '#ic_print_24px';
  const LinkIcon = '#ic_launch_24px';
  const DraganddropIcon = '';
  const EditorIcon = '#ic_edit_24px';
  const FullscreenIcon = '#ic_fullscreen_24px';
  const LegendIcon = '#ic_layers_24px';
  const PositionIcon = '#ic_gps_not_fixed_24px';
  const ProgressbarIcon = '';
  const RotateIcon = '#origo-compass';
  const ScaleIcon = '';
  const ScalelineIcon = '';
  const SearchIcon = '#ic_search_24px';
  const SplashIcon = '';
  const ExternalurlIcon = '#ic_baseline_link_24px';
  const ScalepickerIcon = '';

  const modalContent = () => {
    options.controlList.forEach((el) => {
      const text = el.text || eval(`${el}Text`) || '';
      const icon = el.icon || eval(`${el}Icon`) || '';
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
