import { Button, ToggleGroup } from '../../ui';

export default function ResolutionControl({ resolution }) {
  const lowButton = Button({
    cls: 'grow light text-smaller padding-left-large',
    text: 'Låg (75)',
    state: resolution === 75 ? 'active' : 'initial'
  });
  const middleButton = Button({
    cls: 'grow light text-smaller padding-right-large',
    text: 'Mellan (150)',
    state: resolution === 150 ? 'active' : 'initial'
  });
  const highButton = Button({
    cls: 'grow light text-smaller padding-right-large',
    text: 'Hög (300)',
    state: resolution === 300 ? 'active' : 'initial'
  });
  const resolutionControl = ToggleGroup({
    cls: 'flex rounded bg-inverted border',
    components: [lowButton, middleButton, highButton],
    style: { height: '2rem', display: 'flex' }
  });
  lowButton.on('click', () => resolutionControl.dispatch('change:resolution', { resolution: 75 }));
  middleButton.on('click', () => resolutionControl.dispatch('change:resolution', { resolution: 150 }));
  highButton.on('click', () => resolutionControl.dispatch('change:resolution', { resolution: 300 }));

  return resolutionControl;
}
