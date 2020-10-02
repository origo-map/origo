function setId(containerElement) {
  const children = [...containerElement.children];
  const input = children.filter(child => child.tagName === 'INPUT')[0];
  const suffix = input.id.replace('input-', '');
  return `searchList-empty-list-${suffix}`;
}
export default function makeEmptyList(container) {
  const emptyList = document.createElement('ul');
  emptyList.hidden = true;
  emptyList.id = setId(container);
  const emptyListItem = document.createElement('li');
  emptyListItem.style = 'height: 50px';
  emptyList.append(emptyListItem);
  container.append(emptyList);
}
