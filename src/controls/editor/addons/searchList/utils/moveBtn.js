/**
 * Moves the button to appear after the UL after awesomplete constructor has rearranged DOM.
 * @param {any} btn
 */
export default function moveBtn(btn) {
  const { parentElement } = btn;
  const awesome = parentElement.querySelector('.awesomplete');
  awesome.appendChild(btn);
}
