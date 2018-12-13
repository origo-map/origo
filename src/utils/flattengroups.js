const flattenGroups = function flattenGroups(arr, parent) {
  return arr.reduce((acc, item) => {
    const group = Object.assign({}, item);
    if (parent) {
      group.parent = parent;
      group.type = 'grouplayer';
    }
    if (group.groups) {
      const parentGroup = Object.assign({}, group);
      delete parentGroup.groups;
      return acc.concat(parentGroup, flattenGroups(group.groups, parentGroup.name));
    }
    acc.push(group);
    return acc;
  }, []);
};

export default flattenGroups;
