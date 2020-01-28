/* eslint-disable no-use-before-define */
/* eslint-disable no-param-reassign */
import { Component } from '../ui';

/**
 * Controller used to maintain a webbsession with a remote webserver by recurrently
 * requesting a certain url (for example a getCapabilities document)
 * @param {Object} options
 */
const Keepexternalsessionalive = function Keepexternalsessionalive(options) {

  /**
   * Schedule the call.
   * @param {object} service the object defining the service
   * @param {number} timeoutInMinutes
   */
  const initTimer = function initTimer(service, timeoutInMinutes) {
    const timeOut = (timeoutInMinutes * 60 * 1000);
    setTimeout(() => {
      callExternalService(service);
    }, timeOut);
  };

  const callExternalService = function callExternalService(service) {
    const xmlHttp = new XMLHttpRequest();
    let timeoutInMinutes = service.minutesBetweenRefreshes;
    // Callback function after service calls returns
    xmlHttp.onreadystatechange = function parseResponse() {
      if (xmlHttp.readyState === 4) {
        if (xmlHttp.status === 200) {
          // We succeded and we decrease the nrOfRefreshes to perform.
          console.log(`Successfully renewed session with ${service.url} at ${new Date().toLocaleString()}`);
          service.nrOfRefreshes -= 1;
        } else {
          // We failed and thus we increase nrOfFailedRequests. We lower the timeOut to wait until doing another try
          // If we have more than 3 errors like this we exit.
          console.log(`Failed to renewed session with ${service.url}. Are the URL correct? Are Cors enabled?`);
          service.nrOfFailedRequests += 1;

          if (service.nrOfFailedRequests > 3) {
            service.nrOfRefreshes = 0; // cancel
          }
          // Lets try again in 1min
          timeoutInMinutes = 1;
        }

        if (service.nrOfRefreshes > 0) {
          initTimer(service, timeoutInMinutes);
        }
        else {
          console.log(`Disabling recurrent call to external service: ${service.url} at ${new Date().toLocaleString()}`);
        }
      }
    };
    xmlHttp.open('GET', service.url, true);
    xmlHttp.send(null);
  };

  return Component({
    name: 'keepexternalsessionalive',
    onInit() {
      if (options.services) {
        options.services.forEach((service) => {
          service.nrOfFailedRequests = 0;
          console.log(`Enabling recurrent call to external service:${service.url} timeperiod once every ${service.minutesBetweenRefreshes}min`);
          initTimer(service);
        });
      }
    }
  });
};

export default Keepexternalsessionalive;
