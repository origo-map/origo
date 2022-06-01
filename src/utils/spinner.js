/**
 * Creates a spinner element. Add it as a node in a container, or use outerHtml to extract the HTML as a string.
 * @returns {Element} A DOM element
 * */
function spinner() {
  const spinnerEl = document.createElement('img');
  spinnerEl.src = 'img/loading.gif';
  spinnerEl.classList.add('spinner');

  return spinnerEl;
}

export default spinner;
