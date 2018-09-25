import $ from 'jquery';
import utils from '../utils';
import viewer from '../viewer';

let $closeButton;
let $mapMenu;
let $menuButton;

let options;
let isActive;

function toggleMenu() {
  if ($mapMenu.hasClass('o-mapmenu-show')) {
    $mapMenu.removeClass('o-mapmenu-show');
  } else {
    $mapMenu.addClass('o-mapmenu-show');
  }
}

function getTarget() {
  return $mapMenu;
}

function bindUIActions() {
  $menuButton.on('click', (e) => {
    toggleMenu();
    $menuButton.blur();
    e.preventDefault();
  });
  $closeButton.on('click', (e) => {
    toggleMenu();
    $closeButton.blur();
    e.preventDefault();
  });
}

function init(opt) {
  options = opt || {};
  isActive = options.isActive || false;
  const breakPointSize = options.breakPointSize || 'l';
  const breakPoint = viewer.getBreakPoints(breakPointSize);

  const el = utils.createButton({
    text: 'Meny',
    id: 'o-mapmenu-button',
    cls: 'o-mapmenu-button-true',
    iconCls: 'o-icon-fa-bars',
    src: '#fa-bars',
    tooltipText: 'Meny',
    tooltipPlacement: 'west'
  });
  $('#o-map').append(el);
  $menuButton = $('#o-mapmenu-button button');

  const menuEl = `<div id="o-mapmenu" class="o-mapmenu">
  <div class="o-block">
    <ul id="o-menutools">
      <li></li>
    </ul>
  </div>
</div>`;
  $('#o-map').append(menuEl);
  $mapMenu = $('#o-mapmenu');

  const closeButton = utils.createButton({
    id: 'o-mapmenu-button-close',
    cls: 'o-no-boxshadow',
    iconCls: 'o-icon-menu-fa-times',
    src: '#fa-times',
    tooltipText: 'Stäng meny',
    tooltipPlacement: 'west'
  });
  $('#o-menutools').append(closeButton);
  $closeButton = $('#o-mapmenu-button-close');

  bindUIActions();

  if (isActive && $('#o-map').width() >= breakPoint[0]) {
    toggleMenu();
  }
}

export default {
  init,
  toggleMenu,
  getTarget
};
