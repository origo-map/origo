import Image from 'ol/layer/Image';

export default function image(options, source) {
  return new Image(Object.assign({}, { source }, options));
}
