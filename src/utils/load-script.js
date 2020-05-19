const LoadScript = function LoadScript(options = {}) {
  const {
    src,
    global
  } = options;

  let isLoaded = false;

  const createScript = () => {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = src;
    return script;
  };

  const appendScript = (script) => {
    const el = document.getElementsByTagName('script')[0];
    el.parentNode.insertBefore(script, el);
  };

  const loadScript = function loadScript() {
    return new Promise((resolve, reject) => {
      const script = createScript();
      appendScript(script);

      // promise can be resolved when loaded
      script.addEventListener('load', () => {
        isLoaded = true;
        resolve(script);
      });

      // Handle load script error
      script.addEventListener('error', () => {
        reject(new Error(`${this.src} failed to load ${global}.`));
      });
    });
  };

  return {

    load() {
      // eslint-disable-next-line no-async-promise-executor
      return new Promise(async (resolve, reject) => {
        // check if script already loaded
        if (!isLoaded) {
          try {
            await loadScript();
            resolve(window[global]);
          } catch (err) {
            console.error(err);
            reject(err);
          }
          return;
        }
        resolve(window[global]);
      });
    }
  };
};

export default LoadScript;
