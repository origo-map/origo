export default function awesomeImage(src, value) {
  const div = document.createElement('div');
  const img = document.createElement('img');
  img.style = 'width: 28px;';
  img.setAttribute('src', src);
  const p = document.createElement('p');
  p.innerHTML = value;
  div.appendChild(img);
  div.appendChild(p);
  return div;
}
