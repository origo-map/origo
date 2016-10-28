/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var $ = require('jquery');

module.exports = {
    createButton: function(options) {
        var tooltip ='';
        var text ='';
        var cls = options.cls || '';
        var iconCls = options.iconCls || '';
        var placement = options.tooltipPlacement || 'east';
        if(options.text) {
            text = '<span class="o-button-text">' + options.text + '</span>';
        }
        if(options.tooltipText) {
            tooltip = '<span data-tooltip="' + options.tooltipText + '" data-placement="' + placement + '"></span>';
        }
        var el = '<div id="' + options.id + '" class="o-button-container o-tooltip">' +
                 '<button class="o-button ' + cls + '">' + text +
                    '<svg class="' + iconCls + '">' +
                        '<use xlink:href="' + options.src + '"></use>' +
                    '</svg>' +
                 '</button>' +
                 tooltip +
                 '</div>';
        return el;
    },
    createListButton: function(options) {
        var el = '<li>' +
                    '<div id="' + options.id + '-button" class="o-menu-button"' + '>' +
                        '<div class="o-button-icon">' +
                          '<svg class="' + options.iconCls + '">' +
                              '<use xlink:href="' + options.src + '"></use>' +
                          '</svg>' +
                        '</div>' +
                            options.text +
                        // '</div>' +
                    '</div>' +
                  '</li>';
        return el;
    },
    createElement: function(el, val, attributes) {
        var prefix = '<' + el;
        var suffix = '</' + el  + '>';
        var attributeNames = attributes ? attributes.getOwnProperties() : [];
        var attributeList = attributeNames.map(function(name) {
            return name + '=' + attributes[name];
        });
        var element = prefix.concat(attributeList.join(' '), '>', val, suffix);
        return element;
    }
}
