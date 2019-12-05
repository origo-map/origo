import { Element as El } from '../../ui';

export default function Logo(options = {}) {
  const {
    baseUrl,
    cls = 'padding-bottom-small',
    src = 'css/png/logo_print.png',
    style = {
      height: '3rem'
    }
  } = options;

  return El({
    attributes: { src: `${baseUrl}${src}` },
    cls,
    tagName: 'img',
    style
  });
}
