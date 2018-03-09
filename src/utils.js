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
    /**
     * One-liner for creation of <option> elements for the dropdown lists in the print panel.
     * Returns: option elements for each of the incoming array cells as a string.
     * 
     * options: string-array containing the names of option elements to be created
     */
    createDdOptions: function(options) {
        return options.map(function (option) { 
            return '<option>' + option + '</option>'; }).toString().replace(new RegExp(',', 'g'), '');
    },
    /**
     * Creates radiobuttons for every cell of the incoming array of names.
     * Returns: input elements type radio and corresponding label as string
     *
     * options: string-array containing the names of radiobuttons to be created
     * group: group number for the input attribute 'name'
     */
    createRadioButtons: function(options, group) {
        return options.map(function (rBtn, i) {
            return '<input type="radio" name="group'+ group + '" id="o-r' + i +'" value="'+ i + '" />' +
            '<label for="o-r' + i + '"> ' + rBtn + '</label><br />';
        }).toString().replace(new RegExp(',', 'g'), '');
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
