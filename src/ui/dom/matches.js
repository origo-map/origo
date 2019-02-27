export default function matches(match, parent, target) {
  if (target.matches(match)) {
    return true;
  } else if (target.parentElement && target.parentElement !== document) {
    return matches(match, parent, target.parentElement);
  }
  return false;
}
