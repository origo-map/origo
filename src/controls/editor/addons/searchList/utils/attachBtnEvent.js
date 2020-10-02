import Awesomplete from 'awesomplete';

export default function attachBtnEvent(btn, awe, list) {
  let awesome = awe;
  Awesomplete.$(btn).addEventListener('click', () => {
    const hasList = list.map(a => btn.classList.contains(a.input.id));
    const index = hasList.indexOf(true);
    awesome = list[index];

    if (awesome.ul.childNodes.length === 0) {
      awesome.minChars = 0;
      awesome.evaluate();
    } else if (awesome.ul.hasAttribute('hidden')) {
      awesome.open();
    } else {
      awesome.close();
    }
    list.map((a) => {
      if (!btn.classList.contains(a.input.id)) {
        a.close();
      }
      return a;
    });
  });
}
