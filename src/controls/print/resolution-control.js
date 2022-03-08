import { Button, ToggleGroup } from '../../ui';
import round2 from '../../utils/round';

export default function ResolutionControl({ initialResolution, resolutions }) {
  const resolutionButtons = resolutions.map((resolution, index) => {
    if (index + 1 === resolutions.length) {
      return Button({
        cls: 'grow light text-smaller',
        text: `${resolution.label} (${resolution.value})`,
        state: initialResolution === resolution.value ? 'active' : 'initial',
        style: { width: `${String(round2(100 - round2(100 / resolutions.length, 1) * (resolutions.length - 1), 1))}%` },
        ariaLabel: `${resolution.label} (${resolution.value})`
      });
    }
    return Button({
      cls: 'grow light text-smaller',
      text: `${resolution.label} (${resolution.value})`,
      state: initialResolution === resolution.value ? 'active' : 'initial',
      style: { width: `${String(round2(100 / resolutions.length, 1))}%` },
      ariaLabel: `${resolution.label} (${resolution.value})`
    });
  });

  const resolutionControl = ToggleGroup({
    cls: 'flex rounded bg-inverted border',
    components: resolutionButtons,
    style: { height: 'fit-content', display: 'flex' }
  });
  resolutionButtons.forEach((resolutionButton, index) => {
    resolutionButton.on('click', () => resolutionControl.dispatch('change:resolution', { resolution: resolutions[index].value }));
  });

  return resolutionControl;
}
