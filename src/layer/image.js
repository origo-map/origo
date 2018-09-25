import Image from 'ol/layer/image';

export default function image(options, source) {
  const opt = options;
  opt.source = source;
  return new Image(opt);
}
