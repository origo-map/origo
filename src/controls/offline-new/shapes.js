/**
 * Configures and provides settings for drawing a specific geometry type using the OpenLayers library.
 *
 * @function
 * @name shapes
 * @param {string} drawType - The type of geometry to be drawn (e.g., 'box').
 * @returns {Object} An object containing configuration settings for the specified draw type.
 *
 * @throws {Error} Throws an error if an unsupported draw type is provided.
 *
 * @example
 * // Example usage:
 * const drawOptions = shapes('box');
 * // Returns: { type: 'Circle', geometryFunction: createBox() }
 */
import { createBox } from 'ol/interaction/Draw';

export default (drawType) => {
  // Define supported draw types and their corresponding configurations.
  const types = {
    box: {
      type: 'Circle',
      geometryFunction: createBox()
    }
    // Add more draw types and configurations as needed.
  };

  // Check if the specified draw type is supported.
  if (Object.hasOwn(types, drawType)) {
    // Return the configuration for the specified draw type.
    return types[drawType];
  }

  // If the draw type is not supported, throw an error.
  throw new Error(`Unsupported draw type: ${drawType}`);
};
