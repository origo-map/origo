import awesomeImage from './awesomeImage';

/**
 * Creates a uniform format of the list items and create labels from image src
 * @param {any} list
 */
export default function awesomeParser(list) {
  return list.map((item) => {
    if (item.src && item.value) {
      return {
        label: awesomeImage(item.src, item.value).outerHTML,
        value: item.value
      };
    } else if (item.value) {
      // Must set label as well if mixed with src
      return {
        value: item.value,
        label: item.value
      };
    }

    // Assume just a string as value (is actually allowed by awesome, but to make it uniform we create an object)
    return {
      label: item,
      value: item
    };
  });
}
