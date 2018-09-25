const shift = function shift(number, precision, reverseShift) {
  let prec = precision;
  if (reverseShift) {
    prec = -prec;
  }
  const numArray = `${number}`.split('e');
  return +`${numArray[0]}e${(numArray[1] ? (+numArray[1] + prec) : prec)}`;
};
const round2 = function round2(number, precision) {
  return shift(Math.round(shift(number, precision, false)), precision, true);
};

export default round2;
