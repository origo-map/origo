import { Textarea } from '../../ui';

export default function TextareaControl(options = {}) {
  const {
    text = ''
  } = options;
  const cls = 'placeholder-text-smaller text-smaller width-100';
  const placeholderText = 'Här kan du skriva en beskrivning';
  const style = { margin: 0 };
  return Textarea({
    cls,
    placeholderText,
    style,
    value: text
  });
}
