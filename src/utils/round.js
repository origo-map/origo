const round = function round(value, decimals) {
  const val = Math.round(`${value}e${decimals}`);
  return Number(`${val}e-${decimals}`);
};

export default round;
