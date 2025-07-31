// /lib/math.js

// This file contains minimalist implementations of math functions
// to avoid importing the entire mathjs library on the client-side.

/**
 * Calculates the dot product of two vectors.
 * @param {Array<number>} a
 * @param {Array<number>} b
 * @returns {number}
 */
export function dot(a, b) {
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result += a[i] * b[i];
  }
  return result;
}

/**
 * Calculates the Euclidean norm (magnitude) of a vector.
 * @param {Array<number>} a
 * @returns {number}
 */
export function norm(a) {
  let sumOfSquares = 0;
  for (let i = 0; i < a.length; i++) {
    sumOfSquares += a[i] * a[i];
  }
  return Math.sqrt(sumOfSquares);
}
