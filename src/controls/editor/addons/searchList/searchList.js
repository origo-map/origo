import Awesomplete from 'awesomplete';
import $ from 'jquery';

import fetchImg from './utils/fetchImg';
import awesomeImage from './utils/awesomeImage';
import awesomeParser from './utils/awesomeParser';
import makeEmptyList from './utils/makeEmptyList';
import attachBtnEvent from './utils/attachBtnEvent';
import attachInputEvent from './utils/attachInputEvent';

let options = {};
const list = [];
let searchLists;
let awesome;

function createEmptyLists() {
  list.forEach((a, i) => {
    const container = a.container;
    makeEmptyList(container);
  });
}

function addOptions(opt) {
  options = Object.assign(options, opt);
}

function getSearchLists() {
  return searchLists;
}

function getAwesome() {
  return awesome;
}

function loadSearchLists() {
  searchLists = document.querySelectorAll('#searchList');
}

function render() {
  searchLists.forEach((sList) => {
    if (sList.querySelectorAll('div').length === 0) {
      const input = sList.querySelector('input');
      let olist = JSON.parse(input.getAttribute('o-list'));
      const hasLocation = olist.reduce(o => Object.keys(o).includes('location'));
      let hasImages = olist.filter(o => Object.keys(o).includes('src')).length > 0;
      if (hasLocation) {
        olist.forEach((oItem) => {
          fetchImg((images) => {
            images.map((item) => {
              olist.push({
                label: awesomeImage(item.src, item.value).outerHTML,
                value: item.value
              });
              return true;
            });
          }, oItem);
        });
        olist = olist.filter(obj => obj.src);
        hasImages = true;
      } else {
        olist = awesomeParser(olist);
      }
      const origoConfigOptions = JSON.parse(input.getAttribute('o-config'));
      let config = {
        list: olist
      };
      if (hasImages) {
        config.item = text =>
          Awesomplete.$.create('li', {
            innerHTML: text,
            'area-selected': false
          });
      }
      config = origoConfigOptions ? $.extend({}, config, origoConfigOptions) : config;

      awesome = new Awesomplete(input, config);
      list.push(awesome);
      const btn = sList.querySelector('button');
      attachBtnEvent(btn, awesome, list);
      attachInputEvent(input);
    }
  });
  createEmptyLists();
}

function init() {
  loadSearchLists();
  render();
}

export default function searchList(opt) {
  addOptions(opt);
  return {
    getSearchLists,
    getAwesome,
    init
  };
}
