export default function awesomeImage(src, value) {
  const div = document.createElement('div');
  div.classList.add('searchlist-item')
  const img = document.createElement('img');
  img.classList.add('searchlist-item--img')
  img.style = 'width: 28px;';
  img.setAttribute('src', src);
  const p = document.createElement('p');
  p.classList.add('searchlist-item--p')
  p.innerHTML = value;
  div.appendChild(img);
  div.appendChild(p);
  return div;
}
