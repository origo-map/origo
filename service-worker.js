/* eslint-disable no-restricted-globals */
/**
 * This is an example boilerplate code for caching an offline application. It is not production ready code
 * 
 * This example demonstrates how to use the offline configuration of Origo and only makes the applicatin itselv,origo cities and mask to
 * be available offline. The OSM background will fail. For an offline application to be meaningful it should probably have some
 * background map, such as a cached geojson or WMSOFFLINE/WFSOFFLINE layers.
 * 
 * This example uses the simplest form of cache first strategy to cache static assets.
 * 
 * All static assets are preloaded and stored in the offline cache (Storage -> Cache in devtools) by its version name
 * There can only be one version active at any time, but it is important to bump the version number when any of the controlled
 * assets are updated, as many versions can be installed.
 * 
 * The assets are hardcoded at the bottom of this file. If files are added or removed the version should also be bumped.
 * Changes to this file will trigger a new version install, so it is safest to bump the version.
 * 
 * Many other caching strategies could be implemented, for instance network first or dynamically caching assets (including map service calls),
 * but that require some knowledge on the actual aplication. The list of assets could also be given as a parameter or file to download
 * but that requires a good strategy for how to trigger a new version when the configuration itself may be cached.
 * 
 * In order for a service-worker to work in conjunction with Origo, the SKIP_WAITING event handler must be present.
 */




/**
 * MUST change this version number when any asset (including this file) has changed.
 * Version number is not significant, but an increasing number is preferrable.
 */
const VERSION = 'v1.0.30';

/**
 * Adds all provided resources to the cache
 * 
 * @param {string[]} resources list of resources to add to the cache. Provided with url string.
 */
const addResourcesToCache = async (resources) => {
  console.log('Service Worker trying to add all resources to cache ...');
  const cache = await caches.open(VERSION);

  for (const url of resources) {
    const urlToCache = new URL(url, location.href);
    // Bust web cache if assets are not version named
    const response = await fetch(urlToCache, { cache: 'no-store' });
    console.log('Caching url', urlToCache);

    await cache.put(urlToCache.href, response);
  }
  console.log('Service Worker added all resources to cache');

};


/**
 * Disable navigation preload if for some reason has been turned on
 */
const disableNavigationPreload = async () => {
  if (self.registration.navigationPreload) {
    await self.registration.navigationPreload.disable();
  }
};

/**
 * Fetch the data from the cache first, then try to fetch from the network
 * 
 * @param {*} param0 
 * @returns 
 */
const cacheFirst = async (request) => {
  // First try to get the resource from the cache
  const responseFromCache = await caches.match(request);
  if (responseFromCache) {
    console.log('Found match in cache', request.url);

    return responseFromCache;
  }

  // Next try to get the resource from the network
  // We don't care if it actully returns a valid response. If we were to dynamically cache requests,
  // we would await and add the response (a clone of) to the cache.
  return await fetch(request);

};

/**
 * Delete key from cache
 * 
 * @param {*} key 
 */
const deleteCache = async (key) => {
  await caches.delete(key);
};

/**
 * Delete all caches except the current version
 */
const deleteOldCaches = async () => {
  const cacheKeepList = [VERSION];
  const keyList = await caches.keys();
  const cachesToDelete = keyList.filter((key) => !cacheKeepList.includes(key));
  await Promise.all(cachesToDelete.map(deleteCache));
};

// Add event handler for service worker activation
self.addEventListener('activate', (event) => {
  console.log(`Service worker version ${VERSION} activating...`);
  // We don't need old caches anymore. There can be only one version active
  event.waitUntil(deleteOldCaches());
  // Make sure preload is off. We don't use it in the simple cache first approach
  event.waitUntil(disableNavigationPreload());
});


// Add event handler for service worker install
self.addEventListener('install', (event) => {
  console.log(`Service worker version ${VERSION} installing...`);

  // Files needed to cache to be able to run the app offline
  // Change this list to suit your needs
  event.waitUntil(addResourcesToCache([
    './', // This is index, but the client doesn't know that
    'index.html',
    'css/style.css',
    'js/origo.js',
    'css/svg/fa-icons.svg',
    'css/svg/material-icons.svg',
    'css/svg/miscellaneous.svg',
    'css/svg/origo-icons.svg',
    'css/svg/custom.svg',
    'index.json',
    'img/png/logo.png',
    'img/png/orto.png',
    'img/png/farg.png',
    'img/png/osm.png', // Icon for OpenStreetMap in ledgend
    'img/png/drop_blue.png',
    'data/origo-cities-3857.geojson',
    'data/origo-mask-3857.geojson'
  ]));
});

// This is where the magic happens. All fetch requests (inlcuding navigation to the page itself) from the application is intercepted here.
self.addEventListener('fetch', (event) => {
  event.respondWith(cacheFirst(event.request));
});

// This event is fired from Origo to instantly activate a new version. Without this event the user would have to close all
// tabs and reload the application to get the new version.
// It is important to implement this in your own service worker for the dialog in Origo to be able to activate this version,
// it is not a event that the browser will fire.
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
