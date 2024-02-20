/**
 * Creates an empty UL as placeholder for messages
 * @param {any} container
 * @returns {Element} A list element which caller can set contents with a message to show to the user
 */
export default function makeEmptyList(container) {
  const emptyList = document.createElement('ul');
  emptyList.hidden = true;
  const emptyListItem = document.createElement('li');
  emptyListItem.style = 'height: 50px';
  emptyList.append(emptyListItem);
  container.append(emptyList);
  return emptyListItem;
}
