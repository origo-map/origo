export default function moveBtn(btn) {
  const { parentElement } = btn;
  const awesome = parentElement.querySelector('.awesomplete');
  awesome.appendChild(btn);
}
