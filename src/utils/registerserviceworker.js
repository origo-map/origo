import floatingPanel from '../ui/floatingpanel';
import Button from '../ui/button';
import El from '../ui/element';

/**
 * Static helper to register a service worker. Is seriously async, but caller is not in posistion
 * to await, so everything happens in a then() clause and is finished when it's done.
 * @param {any} viewer The one and only viewer
 * @param {any} serviceWorkerFilename Name of service-worker file, as relative path inlcuding extension
 */
const registerServiceWorker = (viewer, serviceWorkerFilename) => {
  // This is not a control, so we don't get the localize control as argumnet.
  const localization = viewer.getControlByName('localization');
  let registration;

  /**
   * Helper to localize strings
   * @param {any} key Localize dictionary key in the "serviceWorker" context
   * @returns
   */
  function localize(key) {
    return localization.getStringByKeys({ targetParentKey: 'serviceWorker', targetKey: key });
  }

  /**
   * Helper to show the notification dialog
   */
  function alertSW() {
    // This is a one off floating panel
    const txt = El({
      innerHTML: localize('newVersionText'),
      tagName: 'p',
      cls: 'o-card-content'
    });
    const btn = Button({
      text: localize('newVersionButton'),
      cls: 'border margin primary',
      click: () => {
        if (registration.waiting) {
          // Force activating service worker to avoid having to close all tabs and reopen
          // Requires that the service worker listens to this message, which the boilerplate code does.
          registration.waiting.postMessage('SKIP_WAITING');
        } else {
          // just reload the page if there is no waiting Service Worker
          window.location.reload();
        }
      }
    });
    const content = El({
      components: [txt, btn],
      cls: 'flex align-center column o-card'
    });
    const notifiction = floatingPanel(
      {
        viewer,
        isActive: true,
        removeOnClose: true,
        title: localize('newVersionTitle'),
        contentComponent: content
      }
    );
    // Injects itself to the viewer on render
    notifiction.render();
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register(serviceWorkerFilename).then(reg => {
      registration = reg;
      if (registration.installing) {
        console.log('Service Worker installing for the first time');
      } else if (registration.waiting) {
        console.log('We got a new Service Worker waiting to be activated');
        alertSW(viewer, registration);
      } else if (registration.active) {
        console.log('The current Service worker is active');
      }

      registration.addEventListener('updatefound', () => {
        console.log('We found a new Service Worker to update');
        if (registration.installing) {
          console.log('The new Service Worker is installing');
        }
        registration.installing.addEventListener('statechange', () => {
          console.log('[UPDATE] Service worker installing state change', registration);

          if (registration.installing) {
            console.log('The new Service Worker is installing');
          } else if (registration.waiting) {
            console.log('The new Service Worker is waiting to be activated');
            // our new instance is now waiting for activation (its state is 'installed')

            alertSW(viewer, registration);
          } else {
            // apparently installation must have failed (SW state is 'redundant')
            // it makes no sense to think about this update any more
          }
        });
      });

      // The controllerchange event of the ServiceWorkerContainer interface fires when the Service Worker has forcefully
      // activated itself. Most likely because the user pressed the button in the floating panel.
      // Force page reload to reload content
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }).catch(e => {
      console.error('Service Worker registration failed: ', e);
      viewer.getLogger().createToast({
        status: 'danger',
        title: localize('installErrorTitle'),
        message: localize('installErrorText')
      });
    });
  } else {
    // The browser does not support service workers. Probably hasn't happened since 2018
    console.error('No serviceworker');
  }
};

export default registerServiceWorker;
