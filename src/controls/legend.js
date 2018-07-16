import $ from 'jquery';
import viewer from '../viewer';
import modal from '../modal';
import validateUrl from '../utils/validateurl';

const symbolSize = 20;
let styleSettings;
let baseUrl;
let hasMapLegend;

function createFill(fillProperties) {
  const f = fillProperties;
  let stroke;
  let strokeWidth = 0;

  if (Object.prototype.hasOwnProperty.call(f, 'stroke')) {
    strokeWidth = f.stroke.width >= 3 ? 3 : f.stroke.width;
    stroke = `stroke:${f.stroke.color};` || 'stroke:none;';
    stroke += `stroke-width:${strokeWidth};` || '';
    stroke += `stroke-dasharray:${f.stroke.lineDash};` || '';
  }

  const fillSize = symbolSize - 4; // -2-2
  let fill = `<rect x="2" y="2" rx="2" ry="2" width="${fillSize}" height="${fillSize}" `;
  fill += Object.prototype.hasOwnProperty.call(f, 'fill') ? `style="fill:${f.fill.color};` : 'style="fill:none;';
  fill += stroke;
  fill += '"></rect>';

  return fill;
}

function createCircle(circleProperties) {
  const c = circleProperties.circle;
  let stroke;
  let strokeWidth = 0;

  if (Object.prototype.hasOwnProperty.call(c, 'stroke')) {
    strokeWidth = c.stroke.width >= 3 ? 3 : c.stroke.width;
    stroke = `stroke:${c.stroke.color};` || 'stroke:none;';
    stroke += `stroke-width:${strokeWidth};` || '';
  }

  const size = symbolSize / 2;
  let fill = `<circle cx="${size}" cy="${size}" r="${c.radius}" `;
  fill += Object.prototype.hasOwnProperty.call(c, 'fill') ? `style="fill:${c.fill.color};` : 'style="fill:none;';
  fill += stroke;
  fill += '"></circle>';

  return fill;
}

function createStroke(strokeProperties) {
  const s = strokeProperties;
  let strokeWidth = s.stroke.width > 4 ? 4 : s.stroke.width;
  strokeWidth = s.stroke.width < 2 ? 2 : strokeWidth;
  let stroke = `<line x1 = "2" y1= "${(symbolSize - 4).toString()}" x2="${(symbolSize - 4).toString()}" y2="2" `;
  stroke += 'style="';
  stroke += `stroke:${s.stroke.color};` || 'stroke:none;';
  stroke += `stroke-width:${strokeWidth};` || '';
  stroke += `stroke-dasharray:${s.stroke.lineDash};` || '';
  stroke += '"/>';

  return stroke;
}

function getAll(arr, name) {
  return arr.filter(o => ({}).hasOwnProperty.call(o, name));
}

function getSymbol(style) {
  let symbol = '';
  const s = style[0];
  const circles = getAll(s, 'circle');
  
  if (Object.prototype.hasOwnProperty.call(s[0], 'icon')) {
    const src = validateUrl(s[0].icon.src, baseUrl);
    // var scale = style.icon.scale || undefined;
    const format = s[0].format || 'png';
    if (format === 'png') {
      symbol = `<div class="o-legend-item-img"><img style="width: auto; height: 20px;" src="${src}"></div>`;
    } else if (format === 'svg') {
      const o = `<object type="image/svg+xml" data="${src}" style="width: 20px;"></object>`;
      // var inlineStyle = `background: url(${src}) no-repeat;width: 20px; height: 20px;background-size: 20px;`;
      symbol = `<div class="o-legend-item-img">${o}</div>`;
    }
  } else if (Object.prototype.hasOwnProperty.call(s[0], 'fill')) {
    let fill = '';
    for (let i = 0; i < s.length; i += 1) {
      fill += createFill(s[i]);
    }
    symbol += `<div class="o-legend-item-img"><svg height="${symbolSize}" width="${symbolSize}">`;
    symbol += fill;
    symbol += '</svg></div>';
  } else if (Object.prototype.hasOwnProperty.call(s[0], 'stroke')) {
    let stroke = '';
    for (let i = 0; i < s.length; i += 1) {
      stroke += createStroke(s[i]);
    }
    symbol += `<div class="o-legend-item-img"><svg height="${symbolSize}" width="${symbolSize}">
    ${stroke}
    </svg></div>`;
  } else if (circles.length > 0) {
    let circle = '';
    for (let i = 0; i < circles.length; i += 1) {
      circle += createCircle(circles[i]);
    }
    symbol += `<div class="o-legend-item-img"><svg height="${symbolSize}" width="${symbolSize}">
    ${circle}
    </svg></div>`;
  } else if (Object.prototype.hasOwnProperty.call(s[0], 'image')) {
    const src = validateUrl(s[0].image.src, baseUrl);
    const inlineStyle = `background: url(${src}) no-repeat;width: 30px; height: 30px;background-size: 30px;`;
    symbol = `<div class="o-legend-item-img" style="${inlineStyle}"></div>`;
  }

  return symbol;
}

function addAbstractButton(item) {
  const infoTextButton = `<div class="o-legend-item-info o-abstract" id="o-legend-item-info-${item}">
                          <svg class="o-icon-fa-info-circle"><use xlink:href="#fa-info-circle"></use></svg>
                        </div>`;
  return infoTextButton;
}

function addRemoveButton(item) {
  const removeButton = `<div class="o-legend-item-remove o-remove" id="o-legend-item-remove${item}">
                        <svg class="o-icon-24"> <use xlink:href="#ic_remove_circle_outline_24px"></use></svg>
                        </div>`;
  return removeButton;
}

function removeButtonClickHandler() {
  $('.o-remove').on('click', (evt) => {
    const name = $(this).attr('id').split('o-legend-item-remove-').pop();
    viewer.removeLayer(name);
    evt.stopPropagation();
    evt.preventDefault();
  });
}

function createLegendItem(layerid, insertAfter, layerStyle, inSubgroup) {
  const layername = layerid.split('o-legend-').pop();
  const layer = viewer.getLayer(layername);
  const subClass = inSubgroup ? ' o-legend-subitem' : '';
  let legendItem = '';

  if (layerStyle && Object.prototype.hasOwnProperty.call(layerStyle[0][0], 'filter')) {
    if (Object.prototype.hasOwnProperty.call(layerStyle[0][0], 'legend')) {
      legendItem += `<li class="o-legend ${layername}">`;
      legendItem += `<ul id="o-group-${layername}" class="o-legend-group o-ul-expand-false"><li class="${layername}" id="${layerid}">`;
    } else {
      legendItem += `<li class="o-legend ${layername}" id="${layerid}">`;
    }

    legendItem += `<div class ="o-legend-item${subClass}"><div class="o-checkbox">
                    <svg class="o-icon-fa-square-o"><use xlink:href="#fa-square-o"></use></svg>
                    <svg class="o-icon-fa-check-square-o"><use xlink:href="#fa-check-square-o"></use></svg>
                  </div>
                  <div class="o-legend-item-title o-truncate">${layer.get('title')}</div>`;

    if (layer.get('abstract')) {
      legendItem += addAbstractButton(layername);
    }

    if (Object.prototype.hasOwnProperty.call(layerStyle[0][0], 'legend')) {
      legendItem += `<div class="o-icon-expand o-icon-expand-false">
                      <svg class="o-icon-fa-chevron-right">
                        <use xlink:href="#fa-angle-double-right"></use>
                      </svg>
                      <svg class="o-icon-fa-chevron-down">
                        <use xlink:href="#fa-angle-double-down"></use>
                      </svg>
                    </div>
                  </div></li>`;

      layerStyle.forEach((styleArray) => {
        legendItem += `<li class="o-legend ${layername}" id="${layername}"><div class ="o-legend-subitem"><div class="o-checkbox o-checkbox-false"></div>`;
        legendItem += layer.get('styleName') ? getSymbol([styleArray]) : '';
        legendItem += `<div class="o-legend-subitem-title">${styleArray[0].legend}</div></div></li>`;
      });

      legendItem += '</ul></li>';
    }
  } else {
    legendItem += `<li class="o-legend ${layername}" id="${layerid}"><div class ="o-legend-item${subClass}"><div class="o-checkbox">
                    <svg class="o-icon-fa-square-o"><use xlink:href="#fa-square-o"></use></svg>
                    <svg class="o-icon-fa-check-square-o"><use xlink:href="#fa-check-square-o"></use></svg>
                  </div>`;
    legendItem += layer.get('styleName') ? getSymbol(styleSettings[layer.get('styleName')]) : '';
    legendItem += `<div class="o-legend-item-title o-truncate">${layer.get('title')}</div>`;

    if (layer.get('abstract')) {
      legendItem += addAbstractButton(layername);
    }

    if (layer.get('removable') === true) {
      legendItem += addRemoveButton(layername);
    }
    legendItem += '</div></li>';
  }

  // FIXME:Needs to be re-worked to minimize redundancy (see other FIXME)
  if (insertAfter === true) {
    if ($(`#o-group-${layer.get('group')}`).find('li.o-top-item:last').length) {
      $(`#o-group-${layer.get('group')}`).find('li.o-top-item:last').after(legendItem);
    } else {
      $(`#o-group-${layer.get('group')} .o-legend-header`).after(legendItem);
      removeButtonClickHandler();
    }
  } else {
    return legendItem;
  }
}

function toggleOverlay() {
  if ($('#o-legend-overlay .o-toggle-button').hasClass('o-toggle-button-max')) {
    $('#o-legend-overlay .o-toggle-button').removeClass('o-toggle-button-max');
    $('#o-legend-overlay .o-toggle-button').addClass('o-toggle-button-min');
    $('#o-overlay-list').addClass('o-hidden');
  } else {
    $('#o-legend-overlay .o-toggle-button').removeClass('o-toggle-button-min');
    $('#o-legend-overlay .o-toggle-button').addClass('o-toggle-button-max');
    $('#o-overlay-list').removeClass('o-hidden');
  }
}

function checkToggleOverlay() {
  if ($('#o-overlay-list li').length > 1 && $('#o-legend-overlay >li:first-child').hasClass('o-hidden')) {
    $('#o-legend-overlay > li:first-child').removeClass('o-hidden');
  } else if ($('#o-overlay-list li').length < 2) {
    $('#o-legend-overlay > li:first-child').addClass('o-hidden');

    if ($('#o-overlay-list').length === 1 && $('#o-overlay-list').hasClass('o-hidden')) {
      $('#o-overlay-list').removeClass('o-hidden');
      toggleOverlay();
    }
  }
}

function onToggleCheck(layername) {
  // Event listener for tick layer
  $(`#${layername}`).on('click', function func(evt) {
    $(this).each(function f() {
      const that = this;
      toggleCheck($(that).attr('id'));
    });
    evt.preventDefault();
  });
}

function offToggleCheck(layername) {
  // Event listener for tick layer
  $(`#${layername}`).off('click', function func(evt) {
    $(this).each(function f() {
      const that = this;
      toggleCheck($(that).attr('id'));
    });

    evt.preventDefault();
  });
}

// Expand and minimize group
function toggleGroup(groupheader) {
  const group = groupheader.parent('.o-legend-group');
  const groupicon = $(`#${group.attr('id')} .o-icon-expand:first`);

  if (groupicon.hasClass('o-icon-expand-false')) {
    groupicon.removeClass('o-icon-expand-false');
    groupicon.addClass('o-icon-expand-true');
    group.removeClass('o-ul-expand-false');
  } else {
    groupicon.removeClass('o-icon-expand-true');
    groupicon.addClass('o-icon-expand-false');
    group.addClass('o-ul-expand-false');
  }
}

// Toggle subgroups
function toggleSubGroupCheck(subgroup, toggleAll) {
  const subGroup = $(subgroup);
  const subLayers = subGroup.find('.o-legend-item.o-legend-subitem');
  const groupList = $('.o-legend-subgroup');

  if (toggleAll) {
    subLayers.each(function func() {
      const layername = $(this).parent().attr('id');
      const layer = viewer.getLayer(layername);
      const layerid = $(this).parent().attr('class');
      const inMapLegend = layerid.split('o-legend-').length > 1;

      if (subGroup.children().first().find('.o-checkbox').hasClass('o-checkbox-true')) {
        $(`.${layername} .o-checkbox`).removeClass('o-checkbox-true');
        $(`.${layername} .o-checkbox`).addClass('o-checkbox-false');

        if (inMapLegend === false) {
          offToggleCheck(`o-legend-${layername}`);
          $(`#o-legend-${layername}`).remove();
          layer.set('legend', false);
          checkToggleOverlay();
        }

        layer.setVisible(false);
      } else {
        if (inMapLegend === false && $(`#o-legend-${layername}`).length === 0) {
          $('#o-overlay-list').prepend(createLegendItem(`o-legend-${layername}`));
          onToggleCheck(`o-legend-${layername}`);
          checkToggleOverlay();
        }

        $(`.${layername} .o-checkbox`).removeClass('o-checkbox-false');
        $(`.${layername} .o-checkbox`).addClass('o-checkbox-true');
        layer.setVisible(true);
        layer.set('legend', true);
      }
    });
  }

  groupList.each(function func() {
    const subList = $(this).find('.o-legend-item.o-legend-subitem').has('.o-checkbox');
    const subListChecked = $(this).find('.o-legend-item.o-legend-subitem').has('.o-checkbox.o-checkbox-true');

    if (subListChecked.length) {
      $(this).children().first().find('.o-checkbox')
        .removeClass('o-checkbox-false');
      $(this).children().first().find('.o-checkbox')
        .addClass('o-checkbox-true');

      if (subList.length !== subListChecked.length) {
        $(this).children().first().find('.o-checkbox')
          .addClass('o-checkbox-semi');
      } else {
        $(this).children().first().find('.o-checkbox')
          .removeClass('o-checkbox-semi');
      }
    } else {
      $(this).children().first().find('.o-checkbox')
        .removeClass('o-checkbox-true');
      $(this).children().first().find('.o-checkbox')
        .removeClass('o-checkbox-semi');
      $(this).children().first().find('.o-checkbox')
        .addClass('o-checkbox-false');
    }
  });
}

// Toggle layers
function toggleCheck(layerid) {
  const layername = layerid.split('o-legend-').pop();
  const inMapLegend = layerid.split('o-legend-').length > 1;
  const layer = viewer.getLayer(layername);

  // Radio toggle for background
  if (layer.get('group') === 'background') {
    const groups = viewer.getGroup('background');

    groups.forEach((group) => {
      group.setVisible(false);
      $(`#${group.get('name')} .o-checkbox`).removeClass('o-check-true');
      $(`#${group.get('name')} .o-checkbox`).addClass('o-check-false');
      // map legend
      $(`#o-legend-${group.get('name')}`).removeClass('o-check-true-img');
      $(`#o-legend-${group.get('name')}`).addClass('o-check-false-img');
    });

    layer.setVisible(true);
    $(`#${layername} .o-checkbox`).removeClass('o-check-false');
    $(`#${layername} .o-checkbox`).addClass('o-check-true');
    // map legend
    $(`#o-legend-${layername}`).removeClass('o-check-false-img');
    $(`#o-legend-${layername}`).addClass('o-check-true-img');
  } else { // Toggle check for all groups except background
    if ($(`.${layername} .o-checkbox`).hasClass('o-checkbox-true')) {
      $(`.${layername} .o-checkbox`).removeClass('o-checkbox-true');
      $(`.${layername} .o-checkbox`).addClass('o-checkbox-false');

      if (inMapLegend === false) {
        offToggleCheck(`o-legend-${layername}`);
        $(`#o-legend-${layername}`).remove();
        layer.set('legend', false);
        checkToggleOverlay();
      }

      layer.setVisible(false);
    } else {
      if (inMapLegend === false && $(`#o-legend-${layername}`).length === 0) {
        $('#o-overlay-list').prepend(createLegendItem(`o-legend-${layername}`));
        onToggleCheck(`o-legend-${layername}`);
        checkToggleOverlay();
      }

      $(`.${layername} .o-checkbox`).removeClass('o-checkbox-false');
      $(`.${layername} .o-checkbox`).addClass('o-checkbox-true');
      layer.setVisible(true);
      layer.set('legend', true);
    }

    if ($(`#${layername}`).find('.o-legend-subitem').length > 0) {
      toggleSubGroupCheck($(`#${layername}`).parents('ul').has('.o-legend-header').first(), false);
    }
  }
}

function addTickListener(layer) {
  $(`#${layer.get('name')}`).on('click', function func(evt) {
    if ($(evt.target).closest('div').hasClass('o-icon-expand')) {
      toggleGroup($(this));
    } else {
      $(this).each(function f() {
        const that = this;
        toggleCheck($(that).attr('id'));
      });
      evt.preventDefault();
    }
  });
}

function addMapLegendListener(layer) {
  $(`#o-legend-${layer.get('name')}`).on('click', function func(evt) {
    $(this).each(function f() {
      const that = this;
      toggleCheck($(that).attr('id'));
    });

    evt.preventDefault();
  });
}

function addMapLegendItem(layer, name, itemtitle) {
  let item = '';
  const title = itemtitle || name;

  item = `<li class="o-legend ${name}" id="o-legend-${name}"><div class ="o-legend-item"><div class="o-checkbox">
            <svg class="o-icon-fa-square-o"><use xlink:href="#fa-square-o"></use></svg>
            <svg class="o-icon-fa-check-square-o"><use xlink:href="#fa-check-square-o"></use></svg>
          </div>`;
  item += layer.get('styleName') ? getSymbol(styleSettings[layer.get('styleName')]) + title : `<div class="o-legend-item-title o-truncate">${title}</div>`;
  $('#o-overlay-list').prepend(item);
}

function addCheckbox(layer, name, inSubgroup) {
  if (layer.get('group') === 'background') {
    if (layer.getVisible() === true) {
      $(`#${name} .o-checkbox`).addClass('o-check-true');
      $(`#o-legend-${name}`).addClass('o-check-true-img');
    } else {
      $(`#${name} .o-checkbox`).addClass('o-check-false');
      $(`#o-legend-${name}`).addClass('o-check-false-img');
    }
  } else if (layer.getVisible() === true) {
    $(`.${name} .o-checkbox`).addClass('o-checkbox-true');
    if (inSubgroup) {
      const parentGroups = $(`#${name}`).parents('ul [id^=o-group-]');
      [].forEach.call(parentGroups, (el) => {
        toggleGroup($(el).find('li:first'));
      });

      toggleSubGroupCheck($(`#${name}`).parents('ul').has('.o-legend-header').first(), false);
    } else {
      $(`#o-group-${layer.get('group')} .o-icon-expand`).removeClass('o-icon-expand-false');
      $(`#o-group-${layer.get('group')} .o-icon-expand`).addClass('o-icon-expand-true');
      $(`#o-group-${layer.get('group')}`).removeClass('o-ul-expand-false');
    }
  } else {
    $(`.${name} .o-checkbox`).addClass('o-checkbox-false');
  }
}

function createGroup(group, parentGroup, prepend) {
  let legendGroup;
  let abstract = '';

  if (group.abstract) {
    abstract += addAbstractButton(group.name);
  }

  if (parentGroup) {
    const indent = $(parentGroup).parent().closest('ul').hasClass('o-legend-group') ? 'o-legend-indent' : '';

    legendGroup = `<li class="o-legend ${group.name} o-top-item" id="${group.name}">
                    <ul id="o-group-${group.name}" class="o-legend-group o-legend-subgroup ${indent}">
                      <li class="o-legend-header o-legend-subheader ${group.name}" id="${group.name}"><div class="o-legend-item">
                        <div class="o-checkbox">
                          <svg class="o-icon-fa-square-o"><use xlink:href="#fa-square-o"></use></svg>
                          <svg class="o-icon-fa-check-square-o"><use xlink:href="#fa-check-square-o"></use></svg>
                        </div>
                        <div class="o-legend-subgroup-title o-truncate">
                          ${group.title}
                        </div>
                        <div class="o-icon-expand">
                          <svg class="o-icon-fa-chevron-right"><use xlink:href="#fa-angle-double-right"></use></svg>
                          <svg class="o-icon-fa-chevron-down"><use xlink:href="#fa-angle-double-down"></use></svg>
                        </div>
                        ${abstract}
                      </div></li>
                    </ul>
                  </li>`;
    parentGroup.append(legendGroup);
  } else {
    legendGroup = `<li>
                    <ul id="o-group-${group.name}" class="o-legend-group">
                      <li class="o-legend-header"><div class="o-legend-item">
                        ${group.title}
                      <div class="o-icon-expand">
                          <svg class="o-icon-fa-chevron-right"><use xlink:href="#fa-chevron-right"></use></svg>
                          <svg class="o-icon-fa-chevron-down"><use xlink:href="#fa-chevron-down"></use></svg>
                        </div>
                        ${abstract}
                      </div></li>
                    </ul>
                  </li>`;
    if (prepend === true) {
      $('#o-legendlist .o-legendlist').prepend(legendGroup);
    } else {
      $('#o-legendlist .o-legendlist').append(legendGroup);
    }
  }

  if (group.expanded === true) {
    $(`#o-group-${group.name} .o-icon-expand`).addClass('o-icon-expand-true');
    $(`#o-group-${group.name} .o-checkbox`).addClass('o-checkbox-false');
  } else {
    $(`#o-group-${group.name} .o-icon-expand`).addClass('o-icon-expand-false');
    $(`#o-group-${group.name} .o-checkbox`).addClass('o-checkbox-false');
    $(`#o-group-${group.name}`).addClass('o-ul-expand-false');
  }

  $(`#o-group-${group.name} .o-legend-header`).on('click', function func(evt) {
    if ($(evt.target).closest('div').hasClass('o-checkbox')) {
      toggleSubGroupCheck($(this).parent(), true);
    } else if ($(evt.target).closest('div').hasClass('o-abstract')) {
      // Do nothing
    } else {
      toggleGroup($(this));
    }
    evt.preventDefault();
  });

  if (Object.prototype.hasOwnProperty.call(group, 'groups')) {
    group.groups.forEach((subgroup) => {
      createGroup(subgroup, $(`#o-group-${group.name}`));
    });
  }
}

// Set content for info button popup
function showAbstract($abstractButton) {
  const $item = $abstractButton.closest('li');
  const layername = $abstractButton.attr('id').split('o-legend-item-info-').pop();
  const abstract = {
    title: '',
    content: ''
  };

  // If info button is connected group
  if ($item.hasClass('o-legend-header')) {
    const groups = viewer.getGroups();

    const group = $.grep(groups, obj => obj.name === layername);

    abstract.title = group[0].title;
    abstract.content = group[0].abstract;
  } else { // If info button is connected to layer
    const layer = viewer.getLayer(layername);
    abstract.title = layer.get('title');
    abstract.content = layer.get('abstract');
  }

  modal.createModal('#o-map', { title: abstract.title, content: abstract.content });
  modal.showModal();
}

function addLegend(groups) {
  const layers = viewer.getMap().getLayers().getArray();
  let overlayGroup;
  let item = '';

  // Add legend groups
  const legend = '<div id="o-legendlist"><ul class="o-legendlist"></ul></div>';
  $('#o-mapmenu').append(legend);

  groups.forEach((group) => {
    createGroup(group);
  });

  // Add map legend unless set to false
  if (hasMapLegend) {
    const mapLegend = `<div id="o-map-legend"><ul id="o-legend-overlay"><li class="o-legend o-hidden"><div class ="o-toggle-button o-toggle-button-max">
                        <svg class="o-icon-fa-angle-double-down"><use xlink:href="#fa-angle-double-down"></use></svg>
                        <svg class="o-icon-fa-angle-double-up"><use xlink:href="#fa-angle-double-up"></use></svg>
                    </div></li><li><ul id="o-overlay-list"></li></ul></ul><ul id="o-map-legend-background"></ul></div>`;
    $('#o-map').append(mapLegend);

    // Add divider to map legend if not only background
    if (overlayGroup) {
      $('#o-map-legend-background').prepend('<div class="o-legend-item-divider"></div>');
    }
  }

  // Add layers to legend
  layers.forEach((layer) => {
    const name = (layer.get('name'));
    const layerStyle = styleSettings[layer.get('styleName')];
    // Check if layer belongs to subgroup
    const inSubgroup = $(`#o-group-${layer.get('group')}`).closest('ul').parent().closest('ul')
      .hasClass('o-legend-group');
    let title = `<div class="o-legend-item-title o-truncate">${layer.get('title')}</div>`;

    // Add abstract button
    if (layer.get('abstract')) {
      title += addAbstractButton(name);
    }
    title += '</div></li>';

    // Append layer to group in legend. Add to default group if not defined.
    if (layer.get('group') === 'background') {
      // Append background layers to menu
      item = `<li class="o-legend ${name}" id="${name}"><div class ="o-legend-item"><div class="o-checkbox"><svg class="o-icon-fa-check"><use xlink:href="#fa-check"></use></svg></div>${title}`;
      $('#o-group-background .o-legend-header').after(item);

      // Append background layers to map legend
      item = `<li class="o-legend ${name}" id="o-legend-${name}"><div class ="o-legend-item">`;
      item += layer.get('styleName') ? getSymbol(styleSettings[layer.get('styleName')]) : '';
      item += '</div>';
      $('#o-map-legend-background').prepend(item);
    } else if (layer.get('group') && ((layer.get('group') !== 'none'))) {
      // Append layer to group
      // FIXME:Needs to be re-worked to minimize redundancy (see other FIXME)
      item = createLegendItem(name, true, layerStyle, inSubgroup);
      if ($(`#o-group-${layer.get('group')}`).children('li.o-top-item:last').length) {
        $(`#o-group-${layer.get('group')}`).children('li.o-top-item:last').after(item);
      } else {
        $(`#o-group-${layer.get('group')} .o-legend-header`).after(item);
      }

      if (layer.get('legend') === true || layer.getVisible(true)) {
        addMapLegendItem(layer, name, title);
      }
    }

    // Check map legend to make sure minimize button appears
    checkToggleOverlay();

    // Append class according to visiblity and if group is background
    addCheckbox(layer, name, inSubgroup);

    // Event listener for tick layer
    addTickListener(layer);

    // Event listener for map legend layer
    addMapLegendListener(layer);
  });

  $('.o-abstract').on('click', function func(evt) {
    $(this).each(function f() {
      const that = this;
      showAbstract($(that));
    });
    evt.stopPropagation();
    evt.preventDefault();
  });

  // Toggle map legend
  $('#o-legend-overlay .o-toggle-button').on('click', (evt) => {
    toggleOverlay();
    evt.preventDefault();
  });

  $('#o-map-legend-background li').on('mouseover', function func(evt) {
    const legendId = $(evt.target).closest('li').attr('id');
    const layer = viewer.getLayer(legendId.split('o-legend-')[1]);
    $(this).attr('title', layer.get('title'));
  });
}

function render() {
  $('#o-menutools').append('<li class="o-menu-item"><div class="o-menu-item-divider"></div><li>');
}

function init(opt) {
  const options = opt || {};

  baseUrl = viewer.getBaseUrl();
  hasMapLegend = Object.prototype.hasOwnProperty.call(options, 'hasMapLegend') ? options.hasMapLegend : true;
  styleSettings = viewer.getStyleSettings();

  render();
  addLegend(viewer.getGroups('top'));
}

export default {
  init,
  createGroup,
  createLegendItem,
  addTickListener,
  addMapLegendListener,
  addMapLegendItem,
  addCheckbox
};
