import WebGLTile from 'ol/layer/WebGLTile';

export default function webgltile(options, source) {
  return new WebGLTile(Object.assign({}, options, { source }));
}
