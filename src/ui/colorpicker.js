import Component from './component';
import { mapPalette, hexToRgb, rgbToHex } from '../utils/colorpalette';

/**
 * Lets the user pick a color from a palette of swatches or choose any color with a color input.
 * Dispatches a change event with the picked color and calls the change callback if given.
 */
export default function ColorPicker(options = {}) {
  let {
    value
  } = options;
  const {
    cls = '',
    colors = mapPalette,
    ariaLabel = '',
    customColorLabel = '',
    change
  } = options;

  let el;

  const isCustomColor = () => Boolean(value) && !colors.includes(value);

  const updateSelected = function updateSelected() {
    el.querySelectorAll('button').forEach((swatch) => {
      const selected = swatch.dataset.color === value;
      swatch.classList.toggle('selected', selected);
      swatch.setAttribute('aria-pressed', selected);
    });
    const customIcon = el.querySelector('.o-colorpicker-custom-icon');
    customIcon.classList.toggle('selected', isCustomColor());
    customIcon.style.background = isCustomColor() ? value : '';
  };

  const pick = function pick(color) {
    value = color;
    updateSelected();
    if (change) change(value);
    this.dispatch('change', { color: value });
  };

  return Component({
    getValue() {
      return value;
    },
    setValue(color) {
      value = color;
      if (el) updateSelected();
    },
    onRender() {
      el = document.getElementById(this.getId());
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const swatch = e.target.closest('button');
        if (swatch) {
          e.preventDefault();
          pick.call(this, swatch.dataset.color);
        }
      });
      el.querySelector('input').addEventListener('input', (e) => {
        pick.call(this, hexToRgb(e.target.value));
      });
      this.dispatch('render');
    },
    render() {
      const swatches = colors.map((color) => {
        const selected = color === value;
        return `<li><button type="button" class="o-colorpicker-swatch${selected ? ' selected' : ''}" data-color="${color}" style="background-color: ${color};" aria-label="${color}" aria-pressed="${selected}"></button></li>`;
      }).join('');
      // The custom color is shown as a rainbow until a custom color is picked, to make it clear that any color can be chosen
      const customValue = value ? rgbToHex(value) : '#000000';
      const customIconStyle = isCustomColor() ? ` style="background: ${value};"` : '';
      const custom = `<li class="o-colorpicker-custom-item">
        <label class="o-colorpicker-custom flex row align-center pointer">
          <input type="color" value="${customValue}" aria-label="${customColorLabel}">
          <span class="o-colorpicker-custom-icon${isCustomColor() ? ' selected' : ''}"${customIconStyle}></span>
          <span class="padding-left-small">${customColorLabel}</span>
        </label>
      </li>`;
      return `<ul id="${this.getId()}" class="o-colorpicker flex row wrap ${cls}" aria-label="${ariaLabel}">${swatches}${custom}</ul>`;
    }
  });
}
