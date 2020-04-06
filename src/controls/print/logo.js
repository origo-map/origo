import { Element as El } from '../../ui';

export default function Logo(options = {}) {
  const {
    baseUrl,
    logo
  } = options;
  let {
    cls = 'padding-bottom-small',
    src = 'css/png/logo_print.png',
    style = {
      height: '3rem'
    }
  } = options;
  if ('cls' in logo) {
    cls = logo.cls;
  }
  if ('src' in logo) {
    src = logo.src;
  }
  if ('style' in logo) {
    style = logo.style;
  }

  return El({
    attributes: { src: `${baseUrl}${src}` },
    cls,
    tagName: 'img',
    style
  });
}
