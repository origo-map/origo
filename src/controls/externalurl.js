import externalurlSingleButton from './externalurlSingleButton'
import externalurlSeveralButtons from './externalurlSeveralButtons'

function init(optOptions) {
  const options = optOptions || {};
  if (options.links.length === 1)
    externalurlSingleButton.init(options);
  else if (options.links.length > 1)
    externalurlSeveralButtons.init(options);
}

export default { init };
