import createStyle from './createstyle';
import addKeyPrefix from './addkeyprefix';

const createElement = function createElement(type, content, options) {
  const settings = options || {};
  const el = document.createElement(type);
  const props = Object.keys(settings);
  props.forEach((prop) => {
    if (settings[prop]) {
      if (prop === 'style') {
        const style = createStyle(settings.style);
        el.setAttribute('style', style);
      } else if (prop === 'cls') {
        const clsList = settings.cls.split(' ');
        clsList.forEach(cls => el.classList.add(cls));
      } else if (prop === 'data') {
        const dataProps = addKeyPrefix('data-', settings.data);
        Object.keys(dataProps).forEach(dataProp => el.setAttribute(dataProp, dataProps[dataProp]));
      } else {
        el.setAttribute(prop, settings[prop]);
      }
    }
  });
  if (typeof content === 'string') {
    el.innerHTML = content;
  } else {
    el.appendChild(content);
  }
  return el;
}

export default createElement;
