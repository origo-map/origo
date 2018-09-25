import isUrl from './isurl';

// Checks if str is a valid url. If not append str to baseUrl
export default function validateUrl(str, baseUrl) {
  const url = isUrl(str) ? str : baseUrl + str;
  return url;
}
