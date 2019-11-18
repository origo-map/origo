import { Input } from '../../ui';

export default function TitleControl(options = {}) {
  const {
    title = ''
  } = options;
  const cls = 'placeholder-text-smaller smaller width-100';
  const placeholderText = 'Här kan du skriva en rubrik';
  const style = { height: '2rem', margin: 0 };
  return Input({
    cls,
    style,
    placeholderText,
    value: title
  });
}
