import Image from 'ol/layer/image';

export default function image(options, source) {
  return new Image(Object.assign({}, { source }, options));
}
