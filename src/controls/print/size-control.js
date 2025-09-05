import { Button, ToggleGroup } from '../../ui';
import round2 from '../../utils/round';
import titleCase from '../../utils/titlecase';

export default function SizeControl({ initialSize, sizes, localize }) {
  const sizeButtons = sizes.map((size) => {
    if (size === 'custom') {
      return Button({
        cls: 'grow light text-smaller',
        text: localize('configureSize'),
        state: initialSize === size ? 'active' : 'initial',
        style: { width: `${String(round2(100 - round2(100 / sizes.length, 1) * (sizes.length - 1), 1))}%` },
        ariaLabel: localize('configureSizeAriaLabel')
      });
    }
    return Button({
      cls: 'grow light text-smaller',
      text: titleCase(size),
      state: initialSize === size ? 'active' : 'initial',
      style: { width: `${String(round2(100 / sizes.length, 1))}%` },
      ariaLabel: titleCase(size)
    });
  });

  const sizeControl = ToggleGroup({
    cls: 'flex button-group divider-horizontal rounded bg-inverted border',
    components: sizeButtons,
    style: { height: '2rem', display: 'flex' }
  });
  sizeButtons.forEach((sizeButton, index) => {
    sizeButton.on('click', () => sizeControl.dispatch('change:size', { size: sizes[index] }));
  });

  return sizeControl;
}
