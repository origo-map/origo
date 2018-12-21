import permalinkParser from './permalinkparser';
import permalinkStore from './permalinkstore';
import urlparser from '../utils/urlparser';

export default (() => ({
  getPermalink: function getPermalink(viewer) {
    const hash = urlparser.formatUrl(permalinkStore.getState(viewer));
    const url = `${permalinkStore.getUrl(viewer)}#${hash}`;
    return (url);
  },
  parsePermalink: function parsePermalink(url) {
    if (url.indexOf('#') > -1) {
      const urlSearch = url.split('#')[1];
      const urlParts = urlSearch.split('&');
      const urlAsObj = {};
      urlParts.forEach((part) => {
        const key = part.split('=')[0];
        const val = part.split('=')[1];
        if (Object.prototype.hasOwnProperty.call(permalinkParser, key)) {
          urlAsObj[key] = permalinkParser[key](val);
        }
      });
      return urlAsObj;
    }

    return false;
  }
}))();
