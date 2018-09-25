import $ from 'jquery';

export default function (targetObj, options) {
  const target = '.o-map';
  const prefix = options.breakPointsPrefix;
  const breakPoints = options.breakPoints;
  const breakNames = Object.getOwnPropertyNames(breakPoints);
  const breakCls = arrToObj(breakNames, prefix);
  const breakClsNames = breakNames.map(breakSize => breakCls[breakSize]);

  $(window).on('resize', onSizeChange);
  onSizeChange();

  function onSizeChange() {
    const mapSize = targetObj.getSize();
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
    $(target).removeClass(breakClsNames.join(' '));
    if (val) {
      $(target).addClass(breakCls[val]);
    }
  }

  function arrToObj(arr, start) {
    const obj = {};
    let val = start;
    arr.slice().reverse().forEach((curr) => {
      val += `-${curr}`;
      obj[curr] = val;
    });
    return obj;
  }
}
