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
      this.addComponents([pngButton, pdfButton]);
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
      return `
      <div
        class="flex box fixed bottom-center button-group divider-horizontal box-shadow rounded-large bg-inverted z-index-ontop-high no-print"
        style="height: 2rem;"
      >
        ${pngButton.render()}
        ${pdfButton.render()}
      </div>`;
    },
    setDisabled(disabled) {
      if (disabled) {
        pngButton.setState('disabled');
        document.getElementById(pngButton.getId()).classList.add('print-button-disable');
        pdfButton.setState('disabled');
        document.getElementById(pdfButton.getId()).classList.add('print-button-disable');
      } else {
        pngButton.setState('initial');
        document.getElementById(pngButton.getId()).classList.remove('print-button-disable');
        pdfButton.setState('initial');
        document.getElementById(pdfButton.getId()).classList.remove('print-button-disable');
      }
    }
  });
};

export default PrintToolbar;
