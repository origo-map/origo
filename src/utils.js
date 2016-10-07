 /* ========================================================================
 * Copyright 2016 Mälardalskartan
 * Licensed under BSD 2-Clause (https://github.com/malardalskartan/mdk/blob/master/LICENSE.txt)
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
            text = '<span class="mdk-button-text">' + options.text + '</span>';
        }
        if(options.tooltipText) {
            tooltip = '<span data-tooltip="' + options.tooltipText + '" data-placement="' + placement + '"></span>';
        }
        var el = '<div id="' + options.id + '" class="mdk-button-container mdk-tooltip">' +
                 '<button class="mdk-button ' + cls + '">' + text +
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
                    '<div id="' + options.id + '-button" class="menu-button"' + '>' +
                        '<div class="button-icon">' +
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
        var attributeNames = attributes ? Object.getOwnPropertyNames(attributes) : [];
        var attributeList = attributeNames.map(function(name) {
            var res = '';
            if (name === "cls") {
                res = ' ' + 'class'.concat('=', '"', attributes[name], '"');
            } else {
                res = ' ' + name.concat('=', '"', attributes[name],'"');
            }
            return res;
        });
        var element = prefix.concat(attributeList.join(' '), '>', val, suffix);
        return element;
    },
    createSvg: function(props) {
        var use = this.createElement('use', '', {
            'xlink:href': props.href
        });
        return this.createElement('svg', use, {
            cls: props.cls
        });
    }
}
