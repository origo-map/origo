import { Textarea, cuid, Component, Button, Dropdown, ToggleGroup } from '../../ui';

export default function DescriptionControl(options = {}) {
  const {
    description,
    descriptionPlaceholderText,
    descriptionAlignment,
    descriptionSizes
  } = options;

  let {
    descriptionSize,
    descriptionFormatIsVisible
  } = options;

  const cls = 'placeholder-text-smaller smaller';
  const style = { margin: 0 };
  const align = ['text-align-left', 'text-align-center', 'text-align-right'];
  const formatId = cuid();
  let formatEl;
  let textareaDescription;
  let formatButton;
  let alignLeftComponent;
  let alignCenterComponent;
  let alignRightComponent;
  let alignButtons;
  let alignControl;
  let selectSize;

  return Component({
    onInit() {
      textareaDescription = Textarea({
        cls,
        placeholderText: descriptionPlaceholderText,
        style,
        cols: 32,
        value: description
      });
      formatButton = Button({
        cls: 'grow light text-smaller',
        text: '...',
        state: 'initial',
        style: { }
      });
      alignLeftComponent = Button({
        cls: 'grow light text-smaller',
        text: 'Vänster',
        state: descriptionAlignment === 'left' ? 'active' : 'initial',
        style: { width: '34%' }
      });
      alignCenterComponent = Button({
        cls: 'grow light text-smaller',
        text: 'Mitten',
        state: descriptionAlignment === 'center' ? 'active' : 'initial',
        style: { width: '34%' }
      });
      alignRightComponent = Button({
        cls: 'grow light text-smaller',
        text: 'Höger',
        state: descriptionAlignment === 'right' ? 'active' : 'initial',
        style: { width: '33%' }
      });
      alignButtons = [alignLeftComponent, alignCenterComponent, alignRightComponent];
      alignControl = ToggleGroup({
        cls: 'flex button-group divider-horizontal rounded bg-inverted border',
        components: alignButtons,
        style: { height: '2rem', display: 'flex' }
      });
      selectSize = Dropdown({
        direction: 'down',
        cls: 'o-scalepicker text-black flex',
        contentCls: 'bg-grey-lighter text-smallest rounded',
        buttonCls: 'bg-white border text-black',
        buttonIconCls: 'black'
      });

      this.addComponents([textareaDescription, formatButton, alignControl, selectSize]);
      alignButtons.forEach((alignButton, index) => {
        alignButton.on('click', () => alignControl.dispatch('change:align', { class: align[index] }));
      });

      this.on('change:visible', this.onChangeVisible.bind(this));
      formatButton.on('click', this.onChangeVisible.bind(this));
      alignControl.on('change:align', this.onChangeAlign.bind(this));
      textareaDescription.on('change', this.onChangeDescription.bind(this));
    },
    onChangeAlign(evt) {
      this.dispatch('change:descriptionAlign', { class: evt.class });
    },
    onChangeSize(evt) {
      this.dispatch('change:descriptionSize', { class: evt });
      selectSize.setButtonText(evt);
      descriptionSize = evt;
    },
    onRender() {
      formatEl = document.getElementById(formatId);
      this.dispatch('render');
      selectSize.setButtonText(descriptionSize);
      selectSize.setItems(descriptionSizes);
      this.onChangeSize(descriptionSize);
      document.getElementById(selectSize.getId()).addEventListener('dropdown:select', (evt) => {
        this.onChangeSize(evt.target.textContent);
      });
    },
    onChangeVisible() {
      if (descriptionFormatIsVisible) {
        formatEl.classList.add('hidden');
      } else {
        formatEl.classList.remove('hidden');
      }
      descriptionFormatIsVisible = !descriptionFormatIsVisible;
    },
    onChangeDescription(evt) {
      this.dispatch('change:description', evt);
    },
    render() {
      return `
      <div class="padding-top-large"></div>
      <h6>Beskrivning</h6>
      <div class="padding-smaller o-tooltip active">
        <div class="float-left flex align-center">
          ${textareaDescription.render()}
        </div>
        <div class="float-right flex align-center">
          ${formatButton.render()}
        </div>
      </div>
      <div class="${descriptionFormatIsVisible ? '' : 'hidden'}" id="${formatId}">
      <div class="padding-smaller">
        <h6>Justering beskrivning</h6>
        ${alignControl.render()}
      </div>
      <div class="padding-smaller">
        <h6>Storlek beskrivning</h6>
        ${selectSize.render()}
      </div>
      <hr class="divider horizontal"/>
      </div>
      `;
    }
  });
}
