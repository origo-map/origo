import permalinkParser from './permalinkparser';
import permalinkStore from './permalinkstore';
import urlparser from '../utils/urlparser';

export default (() => {
  return {
    getPermalink: function getPermalink(options) {
      var hash = urlparser.formatUrl(permalinkStore.getState());
      var url = permalinkStore.getUrl() + "#" + hash;
      return (url);
    },
    parsePermalink: function parsePermalink(url) {
      if (url.indexOf('#') > -1) {
        var urlSearch = url.split('#')[1];
        var urlParts = urlSearch.split('&');
        var urlAsObj = {};
        urlParts.forEach(function(part) {
          var key = part.split('=')[0];
          var val = part.split('=')[1];
          if (permalinkParser.hasOwnProperty(key)) {
            urlAsObj[key] = permalinkParser[key](val);
          }
        });
        return urlAsObj;
      } else {
        return false;
      }
    }
  };
})();
