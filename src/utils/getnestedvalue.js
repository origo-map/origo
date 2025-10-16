const getNestedValue = function getNestedValue(feature, attributeKey) {
  let attributeKeyValue = '';
  // Handle if foreignKey is nested json object
  if (typeof feature.get(attributeKey) === 'undefined' && attributeKey.indexOf('.') > 0) {
    const splitMatch = attributeKey.split('.');
    let key = splitMatch.shift(); // Get the first key
    let objectTemp = feature.get(key); // Get the initial object

    // Drill down to the end of the nested attribute and return the value
    while (splitMatch.length > 0 && objectTemp !== undefined) {
      key = splitMatch.shift(); // Get the next key
      if (objectTemp && key in objectTemp) {
        objectTemp = objectTemp[key]; // Move deeper into the object
      } else {
        objectTemp = undefined; // Key does not exist, set to undefined
        break; // No need to continue if the key is not found
      }
    }
    attributeKeyValue = objectTemp; // Assign the nested value to featureValue
  } else {
    attributeKeyValue = feature.get(attributeKey);
  }
  return attributeKeyValue;
};

export default getNestedValue;
