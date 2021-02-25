import permalink from './permalink/permalink';
import getUrl from './utils/geturl';
import isUrl from './utils/isurl';
import trimUrl from './utils/trimurl';

function getQueryVariable(variable, storeMethod) {
  const query = window.location.search.substring(1);
  const vars = query.split('&');
  for (let i = 0; i < vars.length; i += 1) {
    const pair = vars[i].split('=');
    if (decodeURIComponent(pair[0]) === variable) {
      return decodeURIComponent(pair[1]);
    }
  }

  if (storeMethod === 'saveStateToServer') {
    console.warn('Query variable %s not found', variable);
  }
  return undefined;
}

function restorePermalink(storeMethod) {
  const mapStateId = getQueryVariable('mapStateId', storeMethod);
  if (mapStateId) {
    return permalink.readStateFromServer(mapStateId);
  }
  return Promise.resolve();
}

const loadSvgSprites = function loadSvgSprites(config) {
  const svgSprites = config.svgSprites;
  const svgPath = config.svgSpritePath;
  const svgPromises = [];
  svgSprites.forEach((sprite) => {
    const promise = fetch(svgPath + sprite).then(res => res.text()).then((data) => {
      const div = document.createElement('div');
      div.innerHTML = data;
      document.body.insertBefore(div, document.body.childNodes[0]);
    });
    svgPromises.push(promise);
    return svgPromises;
  });
};

const loadResources = async function loadResources(mapOptions, config) {
  const map = {};
  const mapEl = config.target;
  const format = 'json';
  let storeMethod = 'default';
  let urlParams;
  let url;
  let mapUrl;
  let json;

  map.el = mapEl;

  function loadMapOptions() {
    if (typeof (mapOptions) === 'object') {
      if (window.location.hash) {
        urlParams = permalink.parsePermalink(window.location.href);
      }
      map.options = Object.assign(config, mapOptions);
      map.options.controls = config.defaultControls || [];
      if (mapOptions.controls) {
        mapOptions.controls.forEach((control) => {
          const matchingControlIndex = map.options.controls.findIndex(
            (defaultControl) => (defaultControl.name === control.name)
          );
          if (matchingControlIndex !== -1) {
            Object.assign(map.options.controls[matchingControlIndex], control);
          } else {
            map.options.controls.push(control);
          }
        });
      }
      map.options.url = getUrl();
      map.options.map = undefined;
      map.options.params = urlParams;

      return Promise.all(loadSvgSprites(config) || [])
        .then(() => map);
    } else if (typeof (mapOptions) === 'string') {
      if (isUrl(mapOptions)) {
        urlParams = permalink.parsePermalink(mapOptions);
        url = mapOptions.split('#')[0];
        mapUrl = url;

        // remove file name if included in
        url = trimUrl(url);

        json = `${urlParams.map}.json`;
        url += json;
      } else {
        json = mapOptions;
        if (window.location.hash) {
          urlParams = permalink.parsePermalink(window.location.href);
          if (urlParams.map) {
            json = `${urlParams.map}.json`;
          }
        }
        url = json;
        mapUrl = getUrl();
      }

      return Promise.all(loadSvgSprites(config) || [])
        .then(() => fetch(url, {
          dataType: format
        })
          .then(res => res.json())
          .then((data) => {
            map.options = Object.assign(config, data);
            map.options.controls = config.defaultControls || [];
            if (data.controls) {
              data.controls.forEach((control) => {
                const matchingControlIndex = map.options.controls.findIndex(
                  (defaultControl) => (defaultControl.name === control.name)
                );
                if (matchingControlIndex !== -1) {
                  Object.assign(map.options.controls[matchingControlIndex], control);
                } else {
                  map.options.controls.push(control);
                }
              });
            }
            map.options.url = mapUrl;
            map.options.map = json;
            map.options.params = urlParams;

            for (let i = 0; i < map.options.controls.length; i += 1) {
              if (map.options.controls[i].name === 'sharemap') {
                if (map.options.controls[i].options) {
                  const options = map.options.controls[i].options;
                  if (options.storeMethod && options.storeMethod === 'saveStateToServer') {
                    storeMethod = options.storeMethod;
                    permalink.setSaveOnServerServiceEndpoint(map.options.controls[i].options.serviceEndpoint);
                  }
                }
              }
            }
            return restorePermalink(storeMethod).then((params) => {
              if (params) {
                map.options.params = params;
              }
              return map;
            });
          }));
    }
    return null;
  }

  // Check if authorization is required before map options is loaded
  if (config.authorizationUrl) {
    return fetch(config.authorizationUrl)
      .then(() => loadMapOptions());
  }
  return loadMapOptions();
};

export default loadResources;
