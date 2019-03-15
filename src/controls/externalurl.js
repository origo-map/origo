import ExternalurlSingleButton from './externalurl/externalurlSingleButton';
import ExternalurlSeveralButtons from './externalurl/externalurlSeveralButtons';

const Externalurl = function Externalurl(optOptions) {
  const options = optOptions || {};
  if (options.links.length === 1) {
    return ExternalurlSingleButton(options);
  } else if (options.links.length > 1) {
    return ExternalurlSeveralButtons(options);
  }
};

export default Externalurl;
