function arrToObj(arr, start) {
  const obj = {};
  let val = start;
  arr.slice().reverse().forEach((curr) => {
    val += `-${curr}`;
    obj[curr] = val;
  });
  return obj;
}

export default function (map, {
  breakPoints,
  breakPointsPrefix: prefix,
  mapId
}) {
  const targetEl = document.getElementById(mapId);
  const breakNames = Object.getOwnPropertyNames(breakPoints);
  const breakCls = arrToObj(breakNames, prefix);
  const breakClsNames = breakNames.map(breakSize => breakCls[breakSize]);

  const getSize = function getSize() {
    const size = map.getSize();
    const sizes = Object.keys(breakPoints);
    const val = sizes.reduce((prev, curr) => {
      const height = breakPoints[curr][1];
      const width = breakPoints[curr][0];
      if (size[0] <= width || size[1] <= height) {
        if (!prev) {
          return curr;
        }
        return prev;
      }
      return prev;
    }, undefined);
    return val;
  };

  const onSizeChange = function onSizeChange() {
    const val = getSize();
    targetEl.classList.remove(...breakClsNames);
    if (val) {
      targetEl.classList.add(breakCls[val]);
    }
  };

  window.addEventListener('resize', onSizeChange);
  onSizeChange();

  return {
    getSize
  };
}
