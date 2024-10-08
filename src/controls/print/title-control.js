import { Input, cuid, Component, Button, Dropdown, ToggleGroup } from '../../ui';

export default function TitleControl(options = {}) {
  const {
    title,
    titlePlaceholderText,
    titleAlignment,
    titleSizes,
    localize
  } = options;

  let {
    titleSize,
    titleFormatIsVisible
  } = options;

  const cls = 'placeholder-text-smaller smaller';
  const style = { height: '2rem', margin: 0, width: '16rem' };
  const align = ['text-align-left', 'text-align-center', 'text-align-right'];
  const formatId = cuid();
  let formatEl;
  let inputTitle;
  let formatButton;
  let alignLeftComponent;
  let alignCenterComponent;
  let alignRightComponent;
  let alignButtons;
  let alignControl;
  let selectSize;

  return Component({
    onInit() {
      inputTitle = Input({
        cls,
        style,
        placeholderText: titlePlaceholderText,
        value: title
      });
      formatButton = Button({
        cls: 'grow light text-smaller',
        text: '...',
        state: 'initial',
        style: { width: '8%' }
      });
      alignLeftComponent = Button({
        cls: 'grow light text-smaller',
        text: localize('titleAlignLeft'),
        state: titleAlignment === 'left' ? 'active' : 'initial',
        style: { width: '34%' },
        ariaLabel: localize('titleAlignLeftAriaLabel')
      });
      alignCenterComponent = Button({
        cls: 'grow light text-smaller',
        text: localize('titleAlignCenter'),
        state: titleAlignment === 'center' ? 'active' : 'initial',
        style: { width: '34%' },
        ariaLabel: localize('titleAlignCenterAriaLabel')
      });
      alignRightComponent = Button({
        cls: 'grow light text-smaller',
        text: localize('titleAlignRight'),
        state: titleAlignment === 'right' ? 'active' : 'initial',
        style: { width: '33%' },
        ariaLabel: localize('titleAlignRightAriaLabel')
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
        buttonIconCls: 'black',
        ariaLabel: localize('titleSizeAriaLabel')
      });

      this.addComponents([inputTitle, formatButton, alignControl, selectSize]);
      alignButtons.forEach((alignButton, index) => {
        alignButton.on('click', () => alignControl.dispatch('change:align', { class: align[index] }));
      });

      this.on('change:visible', this.onChangeVisible.bind(this));
      formatButton.on('click', this.onChangeVisible.bind(this));
      alignControl.on('change:align', this.onChangeAlign.bind(this));
      inputTitle.on('change', this.onChangeTitle.bind(this));
    },
    onChangeAlign(evt) {
      this.dispatch('change:titleAlign', { class: evt.class });
    },
    onChangeSize(evt) {
      this.dispatch('change:titleSize', { class: evt });
      selectSize.setButtonText(evt);
      titleSize = evt;
    },
    onRender() {
      formatEl = document.getElementById(formatId);
      this.dispatch('render');
      selectSize.setButtonText(titleSize);
      selectSize.setItems(titleSizes);
      this.onChangeSize(titleSize);
      document.getElementById(selectSize.getId()).addEventListener('dropdown:select', (evt) => {
        this.onChangeSize(evt.target.textContent);
      });
    },
    onChangeVisible() {
      if (titleFormatIsVisible) {
        formatEl.classList.add('hidden');
      } else {
        formatEl.classList.remove('hidden');
      }
      titleFormatIsVisible = !titleFormatIsVisible;
    },
    onChangeTitle(evt) {
      this.dispatch('change:title', evt);
    },
    render() {
      return `
      <div class="padding-top-large"></div>
      <h6>${localize('titleTitle')}</h6>
      <div class="padding-smaller o-tooltip active">
        <div class="float-left flex align-center">
          ${inputTitle.render()}
        </div>
        <div class="float-right flex align-center">
          ${formatButton.render()}
        </div>
      </div>
      <div class="${titleFormatIsVisible ? '' : 'hidden'}" id="${formatId}">
        <div class="padding-smaller">
          <h6>${localize('titleAdjustment')}</h6>
          ${alignControl.render()}
        </div>
        <div class="padding-smaller">
          <h6>${localize('titleSize')}</h6>
          ${selectSize.render()}
        </div>
        <hr class="divider horizontal"/>
      </div>
      `;
    }
  });
}
