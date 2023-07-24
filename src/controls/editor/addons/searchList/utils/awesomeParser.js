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
    } else if (item.label) {
      // If label is present, use that as value and store actual value as backingValue (not accessible by awesome)
      // This is because it becomes messy to implement the filter function to search in label if the label is formatted (images).
      // drawback is that it is not possible to search in backingValue. This implementation is completely internal to searchList
      // so it's easy to change.
      return {
        value: item.label,
        label: item.label,
        backingValue: item.value
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
