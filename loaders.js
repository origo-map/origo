function Loaders() {
  if (process.env.import_sass) {
    require('./scss/origo.scss');
  }
}
export default Loaders;
