export default function attachInputEvent(input) {
  input.addEventListener('input', () => {
    const { parentElement } = input;
    const { children } = parentElement;
    const uls = [...children].filter(child => child.tagName === 'UL');
    const awesomeList = uls.filter(u => !u.id.includes('empty-list'))[0];
    const emptyList = uls.filter(u => u.id.includes('empty-list'))[0];
    if (awesomeList.hidden) {
      emptyList.hidden = false;
    } else {
      emptyList.hidden = true;
    }
    if (input.value.length === 0) {
      emptyList.hidden = true;
    }
  });
}
