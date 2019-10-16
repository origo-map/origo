import { Component, Button, Element as El, dom } from '../ui';
import wfs from '../helpers/alert/wfs';

const createItem = (type) => {
  const item = document.createElement('li');
  item.classList.add(`o-console-prompt-${type}`);
  const time = document.createElement('code');
  time.classList.add(`o-console-prompt-${type}-time`);
  item.appendChild(time);
  const msg = document.createElement('code');
  msg.classList.add(`o-console-prompt-${type}-message`);
  item.appendChild(msg);
  return item;
};

const createList = () => {
  const ul = document.createElement('ul');
  const header = document.createElement('li');
  header.classList.add('o-console-prompt-header');
  header.innerText = 'Kommandoprompt';
  const closeBtn = document.createElement('button');
  closeBtn.id = 'o-console-prompt-close';
  closeBtn.setAttribute('aria-label', 'Stäng kommandotolken');
  closeBtn.innerHTML = '&times;';
  header.appendChild(closeBtn);
  ul.appendChild(header);
  ul.appendChild(createItem('warning'));
  ul.appendChild(createItem('error'));
  return ul;
};

const Prompt = function Prompt(options = {}) {
  const {
    name = 'Prompt'
  } = options;
  const { mode } = options;
  const defaultList = createList();
  let target;
  let promptButton;
  let promptButtonEL;
  let promptPanel;
  let promptPanelEL;
  let viewer;
  const buttonWarningMode = function buttonWarningMode(type) {
    if (type === 'warning') {
      promptButtonEL.classList.add('lightWarning');
    }
  };

  const buttonErrorMode = function buttonErrorMode(type) {
    if (type === 'error') {
      promptButtonEL.classList.add('warning');
    }
  };

  const buttonVerboseMode = function buttonVerboseMode(type) {
    if (type === 'error') {
      promptButtonEL.classList.add('warning');
      promptButtonEL.classList.remove('lightWarning');
    } else if (type === 'warning') {
      promptButtonEL.classList.add('lightWarning');
      promptButtonEL.classList.remove('warning');
    }
  };

  const addAlert = function addAlert(type) {
    const m = mode.toLowerCase();
    switch (m) {
      case 'error':
        buttonErrorMode(type);
        break;
      case 'verbose':
        buttonVerboseMode(type);
        break;
      case 'warning':
        buttonWarningMode(type);
        break;
      default:
        break;
    }
  };

  const showBtn = function showBtn() {
    promptButtonEL.classList.remove('o-prompt-console-hide');
  }

  const removeAlert = function removeAlert(type) {
    if (type === 'error') {
      promptButtonEL.classList.remove('warning');
    } else if (type === 'warning') {
      promptButtonEL.classList.remove('lightWarning');
    }
  };

  const getTime = () => {
    const date = new Date();
    const hh = new Date(date).getHours();
    const mm = new Date(date).getMinutes();
    const ss = new Date(date).getSeconds();
    return `${hh}:${mm}:${ss}`;
  };

  const updateItem = function update(type, message) {
    const li = document.querySelectorAll(`.o-console-prompt-${type}`)[0];
    const time = li.children.item(0);
    time.innerHTML = `${getTime()}, ${type.charAt(0).toUpperCase() + type.slice(1)} ! <br>`;
    const msg = li.children.item(1);
    msg.innerHTML = message;
  };

  const removeItem = function remove(type) {
    const error = document.getElementsByClassName(`o-console-prompt-${type}`)[0];
    error.classList.add('o-prompt-console-hide');
  };

  const openPrompt = function openPrompt() {
    promptButtonEL.classList.remove('o-prompt-console-show');
    promptButtonEL.classList.add('o-prompt-console-hide');
    promptButtonEL.classList.add('fade-out');
    promptPanelEL.classList.add('o-prompt-console-show');
    promptPanelEL.classList.remove('o-prompt-console-hide');
    promptButtonEL.classList.add('fade-in');
    removeAlert('error');
    removeAlert('warning');
  };

  const closePrompt = function closePrompt() {
    promptButtonEL.classList.add('o-prompt-console-show');
    promptButtonEL.classList.remove('o-prompt-console-hide');
    promptButtonEL.classList.remove('fade-out');
    promptPanelEL.classList.remove('o-prompt-console-show');
    promptPanelEL.classList.add('o-prompt-console-hide');
    promptButtonEL.classList.remove('fade-in');
  };

  const panelErrorMode = function panelErrorMode(type) {
    if (type === 'error') {
      const warning = document.querySelector('.o-console-prompt-warning');
      warning.classList.add('o-prompt-console-hide');
    }
  };

  const panelWarningMode = function panelWarningMode(type) {
    if (type === 'warning') {
      const warning = document.querySelector('.o-console-prompt-error');
      warning.classList.add('o-prompt-console-hide');
    }
  };

  const messageVisibility = function messageVisibility(type) {
    const m = mode.toLowerCase();
    switch (m) {
      case 'error':
        panelErrorMode(type);
        break;
      case 'warning':
        panelWarningMode(type);
        break;
      default:
        break;
    }
  };

  const PromptComponent = Component({
    name,
    onInit() {
      this.on('render', this.onRender);
    },
    onAdd(evt) {
      viewer = evt.target;
      this.render();
      this.dispatch('render');
      const closeBtn = document.getElementById('o-console-prompt-close');
      closeBtn.addEventListener('click', () => {
        closePrompt();
      });
    },
    onRender() {
      promptButtonEL = document.getElementById(promptButton.getId());
      promptPanelEL = document.getElementById(promptPanel.getId());
      wfs.setPanel({
        promptButtonEL,
        updateItem,
        removeItem,
        messageVisibility
      });
      wfs.setBtn({
        promptButtonEL,
        addAlert,
        removeAlert,
        showBtn
      });
    },
    render() {
      target = document.getElementById(viewer.getMain().getId());
      promptButton = Button({
        icon: '#ic_warning_24px',
        cls: 'control icon-small medium round absolute bottom-center o-console-prompt-btn o-prompt-console-hide',
        click() {
          openPrompt();
        }
      });

      promptPanel = El({
        cls: 'control absolute bottom-center o-console-prompt o-prompt-console-hide',
        innerHTML: defaultList
      });

      this.addComponent(promptButton);
      const el = dom.html(promptButton.render());
      target.appendChild(el);

      this.addComponent(promptPanel);
      const el2 = dom.html(promptPanel.render());
      target.appendChild(el2);
    }
  });

  return PromptComponent;
};

export default Prompt;
