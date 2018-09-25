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

  function onSizeChange() {
    const mapSize = map.getSize();
    const val = breakNames.reduce((prev, curr) => {
      const height = breakPoints[curr][1];
      const width = breakPoints[curr][0];
      if (mapSize[0] <= width || mapSize[1] <= height) {
        if (!prev) {
          return curr;
        }
        return prev;
      }
      return prev;
    }, undefined);
    targetEl.classList.remove(...breakClsNames);
    if (val) {
      targetEl.classList.add(breakCls[val]);
    }
  }

  window.addEventListener('resize', onSizeChange);
  onSizeChange();
}
