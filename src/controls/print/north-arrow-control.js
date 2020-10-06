import Button from '../../ui/button';

export default function NorthArrowControl(options = {}) {
  let {
    showNorthArrow
  } = options;

  const checkIcon = '#ic_check_circle_24px';
  const uncheckIcon = '#ic_radio_button_unchecked_24px';

  const getCheckIcon = (visible) => {
    const isVisible = visible ? checkIcon : uncheckIcon;
    return isVisible;
  };

  return Button({
    cls: 'round small icon-smaller no-shrink',
    click() {
      showNorthArrow = !showNorthArrow;
      this.setIcon(getCheckIcon(showNorthArrow));
      this.dispatch('change:check', { showNorthArrow });
    },
    style: {
      'align-self': 'center'
    },
    icon: getCheckIcon(showNorthArrow)
  });
}
