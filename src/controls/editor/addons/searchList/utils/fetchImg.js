export default function fetchImg(callback, options) {
  const dir = options.location;
  const ext = options.extension;
  let src;
  let val;
  fetch(dir, {
    method: 'GET'
  })
    .then(res => res.text())
    .then((data) => {
      const images = [];
      const el = document.createElement('html');
      el.innerHTML = data;
      const links = el.querySelectorAll('a');
      links.forEach((link) => {
        const candidate = link.href.split('/').pop();
        const array = candidate.split('.');
        if (array.length === 2 && array[1] === ext) {
          src = array.join('.');
          val = array[0].split('_').join('');
          images.push({
            src: `${dir}/${src}`,
            value: val
          });
        }
      });
      callback(images);
    })
    .catch(error => console.error(error));
}
