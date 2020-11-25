import Awesomplete from 'awesomplete';
import $ from 'jquery';

import fetchImg from './utils/fetchImg';
import awesomeImage from './utils/awesomeImage';
import awesomeParser from './utils/awesomeParser';
import makeEmptyList from './utils/makeEmptyList';
import attachBtnEvent from './utils/attachBtnEvent';
import attachInputEvent from './utils/attachInputEvent';
import moveBtn from './utils/moveBtn';

const list = [];
let searchLists;
let awesome;
let options = {};

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

function openMenu(btn, awe, list) {
  const hasList = list.map(a => btn.classList.contains(a.input.id));
  const index = hasList.indexOf(true);
  const { ul: { childNodes: { length: childNodesLength } } } = awe;
  const awesome = list[index];

  if (childNodesLength === 0) {
    awesome.minChars = 0;
    awesome.evaluate();
  } else if (awesome.ul.hasAttribute('hidden')) {
    awesome.open();
  } else {
    awesome.close();
  }

  list.map((a) => {
    if (!btn.classList.contains(a.input.id)) {
      a.close();
    }
    return a;
  });
}

function render() {
  searchLists.forEach((sList, index) => {
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
        config.item = function (text, input) {
          if (text.value.includes(input) && input !== "") {
            const test = text.label;
            const lastIndex = test.lastIndexOf(text.value)
            const firstPart = text.label.substring(0, lastIndex);
            const lastPart = text.label.substring(lastIndex, text.label.length);
            const arr = text.value.split(input);
            let mark = `<mark>${input}</mark>`;
            if (arr[0].length > arr[1].length) {
              mark = arr[0] + mark;
            } else {
              mark = mark + arr[1];
            }
            const marked = lastPart.replace(text.value, mark);
            text.label = firstPart + marked;

          } else {
            text.label = text.label.replace(text.value, text.value);
          }
          const item = Awesomplete.$.create('li', {
            innerHTML: text,
            'area-selected': true
          });
          return item;
        }
      }
      config = origoConfigOptions ? $.extend({}, config, origoConfigOptions) : config;
      awesome = new Awesomplete(input, config);
      list[index] = awesome;
      awesome.currentIndex = -1;
      const currentIndex = new Array(list.length);
      const btn = sList.querySelector('button');
      attachBtnEvent(btn, awesome, list);
      attachInputEvent(input);
      moveBtn(btn);


      input.addEventListener('awesomplete-select', function (e) {
        const { target: { nextSibling: { childNodes } } } = e;
        childNodes.forEach(function (child) {
          if (child.classList.contains('highlight')) {
            child.classList.toggle('highlight');
          }
        });
        currentIndex.forEach(function (item) {
          item = -1;
        });
      });

      input.addEventListener('awesomplete-selectcomplete', function (e) {
        currentIndex[index] = -1;
        input.blur();
      });

      input.addEventListener('input', function (e) {
        const { target: { nextSibling } } = e;
        if (nextSibling.getElementsByTagName('li').length === 0) {
          nextSibling.hidden = "";
        }
      });

      input.addEventListener('click', function (e) {
        currentIndex[index] = -1;
      });

      btn.addEventListener('click', function (e) {
        const awe = list[index];
        const { ul: { childNodes } } = awe;
        childNodes.forEach(function (child) {
          if (child.classList.contains('highlight')) {
            child.classList.toggle('highlight');
          }
        });
        currentIndex[index] = -1;
      });
      input.addEventListener('keyup', function (e) {
        const { keyCode } = e;
        const arrowUp = 38;
        const arrowDown = 40;
        const enter = 13;
        if (![arrowUp, arrowDown, enter].includes(keyCode)) {
          return;
        }
        try {
          const hasList = list.map(a => btn.classList.contains(a.input.id));
          const index = hasList.indexOf(true);
          const awe = list[index];
          const { ul: { childNodes } } = awe;
          if (keyCode === arrowUp) {
            if (currentIndex[index] === -1) {
              currentIndex[index] = childNodes.length - 1;
              childNodes[currentIndex[index]].classList.toggle('highlight');
            } else if (currentIndex[index] > 0) {
              currentIndex[index] = currentIndex[index] - 1;
              childNodes[currentIndex[index] + 1].classList.toggle('highlight');
              childNodes[currentIndex[index]].classList.toggle('highlight');
            } else if (currentIndex[index] === 0) {
              childNodes[currentIndex[index]].classList.toggle('highlight');
              currentIndex[index] = -1;
            }
          } else if (keyCode === arrowDown) {
            if (currentIndex[index] === -1) {
              currentIndex[index] = 0;
              childNodes[currentIndex[index]].classList.toggle('highlight');
            } else if (currentIndex[index] >= 0 && currentIndex[index] < childNodes.length - 1) {
              currentIndex[index] = currentIndex[index] + 1;
              childNodes[currentIndex[index] - 1].classList.toggle('highlight');
              childNodes[currentIndex[index]].classList.toggle('highlight');
            } else if (currentIndex[index] === childNodes.length - 1) {
              childNodes[currentIndex[index]].classList.toggle('highlight');
              currentIndex[index] = -1;
            }

          } else if (keyCode === enter) {
            currentIndex[index] = -1;
            openMenu(btn, awesome, list);
          }
        } catch (error) {
          console.log('error: ', error)
        }
      });
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
  init();
  return {
    getSearchLists,
    getAwesome
  };
}
