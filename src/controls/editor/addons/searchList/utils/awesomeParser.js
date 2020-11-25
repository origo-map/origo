import awesomeImage from './awesomeImage';

export default function awesomeParser(list) {
  return list.map((item) => {
    if (item.src && item.value) {
      return {
        label: awesomeImage(item.src, item.value).outerHTML,
        value: item.value
      };
    }
    return item.value;
  });
}
