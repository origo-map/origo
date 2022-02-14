import Button from '../../ui/button';

export default function PrintLegendControl(options = {}) {
  let {
    showPrintLegend
  } = options;

  const checkIcon = '#ic_check_circle_24px';
  const uncheckIcon = '#ic_radio_button_unchecked_24px';

  const getCheckIcon = (visible) => (visible ? checkIcon : uncheckIcon);

  return Button({
    cls: 'round small icon-smaller no-shrink',
    click() {
      showPrintLegend = !showPrintLegend;
      this.setIcon(getCheckIcon(showPrintLegend));
      this.dispatch('change:check', { showPrintLegend });
    },
    style: {
      'align-self': 'center'
    },
    icon: getCheckIcon(showPrintLegend)
  });
}
