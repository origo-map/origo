import { Button, ToggleGroup } from '../../ui';

export default function OrientaionControl({ orientation }) {
  const portraitButton = Button({
    cls: 'grow light text-smaller padding-left-large',
    text: 'Stående',
    state: orientation === 'portrait' ? 'active' : 'initial'
  });
  const landscapeButton = Button({
    cls: 'grow light text-smaller padding-right-large',
    text: 'Liggande',
    state: orientation === 'landscape' ? 'active' : 'initial'
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
