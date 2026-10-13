import demoplugin from './demoplugin/demoplugin';

if (import.meta.env.DEV) {
  demoplugin({
    mySetting: 'Demo plugin',
    a: 'value',
    b: 'value'
  });
}
