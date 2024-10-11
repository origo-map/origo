import { Button, ToggleGroup } from '../../ui';

export default function OrientaionControl({ orientation, localize }) {
  const portraitButton = Button({
    cls: 'grow light text-smaller padding-left-large',
    text: localize('portrait'),
    state: orientation === 'portrait' ? 'active' : 'initial',
    ariaLabel: localize('portraitAriaLabel')
  });
  const landscapeButton = Button({
    cls: 'grow light text-smaller padding-right-large',
    text: localize('landscape'),
    state: orientation === 'landscape' ? 'active' : 'initial',
    ariaLabel: localize('landscapeAriaLabel')
  });
  const orientationControl = ToggleGroup({
    cls: 'flex rounded bg-inverted border',
    components: [portraitButton, landscapeButton],
    style: { height: '2rem', display: 'flex' }
  });
  landscapeButton.on('click', () => orientationControl.dispatch('change:orientation', { orientation: 'landscape' }));
  portraitButton.on('click', () => orientationControl.dispatch('change:orientation', { orientation: 'portrait' }));

  return orientationControl;
}
