import Button from '../../ui/button';

export default function CreatedControl(options = {}) {
  let {
    checked
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
      checked = !checked;
      this.setIcon(getCheckIcon(checked));
      this.dispatch('change:check', { checked });
    },
    style: {
      'align-self': 'center'
    },
    icon: getCheckIcon(checked)
  });
}
