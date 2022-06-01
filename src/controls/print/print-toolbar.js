import { Button, Component } from '../../ui';

const PrintToolbar = function PrintToolbar() {
  const pngButton = Button({
    cls: 'light text-smaller padding-left-large',
    text: 'Spara bild'
  });

  const pdfButton = Button({
    cls: 'light text-smaller padding-right-large',
    text: 'Skapa pdf'
  });

  return Component({
    onInit() {
      pngButton.on('click', this.dispatchExport.bind(this));
      pdfButton.on('click', this.dispatchPrint.bind(this));
    },
    dispatchExport() {
      this.dispatch('PNG');
    },
    dispatchPrint() {
      this.dispatch('PDF');
    },
    onRender() {
      this.dispatch('render');
    },
    render() {
      return this.html`
      <div
        class="flex box fixed bottom-center button-group divider-horizontal box-shadow rounded-large bg-inverted z-index-ontop-high no-print"
        style="height: 2rem;"
      >
        ${pngButton}
        ${pdfButton}
      </div>`;
    },
    setDisabled(disabled) {
      pngButton.setState(disabled ? 'disabled' : 'initial');
      pdfButton.setState(disabled ? 'disabled' : 'initial');
    }
  });
};

export default PrintToolbar;
