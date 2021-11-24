/**
 * Removes comments from JSON files. Comments are replaced with blanks to keep same size
 * and row numbering for easier debugging of parse errors.
 *
 * Both c-style one line comments and multi line comments are supported. Nested multiline is not supported.
 * @param {any} jsonstring A string contining JSON
 * @returns {string} A new JSON without comments
 */
function stripJSONComments(jsonstring) {
  // Stupid javascript have immutable strings. Make a char array to work with.
  const json = jsonstring.split('');
  let ix = 0;
  const lastindex = json.length - 1;

  // Main loop. Beware, ix is advanced at several places.
  while (ix < lastindex) {
    // Found string literal, advance util end of literal to avoid having main loop keeping state
    if (json[ix] === '"') {
      ix += 1;
      while (json[ix] !== '"' && ix < lastindex) {
        if (json[ix] === '\\') {
          // Eat away one extra. Technically an eascpe sequence can be longer than one character, but we are only interested in not stopping on
          // an escaped double quote and afraid of an escaped backslash that would fool an unescaped double quote.
          ix += 1;
        }
        ix += 1;
      }
    } else if (json[ix] === '/' && json[ix + 1] === '/') {
      // Now we know that we�re not inside a string literal, start looking for comments
    // If it is one line comment, advance until end of line
      json[ix] = ' ';
      json[ix + 1] = ' ';
      ix += 2;
      // Accept pretty much any row ending combo. We don't care and don't destroy
      while (json[ix] !== '\n' && json[ix] !== '\r' && ix <= lastindex) {
        json[ix] = ' ';
        ix += 1;
      }
    } else if (json[ix] === '/' && json[ix + 1] === '*') {
    // If it is a multiline comment advance until end marker
      json[ix] = ' ';
      json[ix + 1] = ' ';
      ix += 2;
      while (!(json[ix] === '*' && json[ix + 1] === '/') && ix <= lastindex) {
        // Keep eol markers so we can produce a good error message when JSON.parse fails.
        if (json[ix] !== '\n' && json[ix] !== '\r') {
          json[ix] = ' ';
        }
        ix += 1;
      }
      json[ix] = ' ';
      json[ix + 1] = ' ';
      ix += 1;
    }
    // Advance to next character in main loop
    ix += 1;
  }
  // Make a string out of it again
  return json.join('');
}

export default stripJSONComments;
