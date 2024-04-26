/**
 * Returns `true` if the value is a primitive.
 * @value The value to check.
 *
 * @example
 * ```typescript
 * isPrimitive(""); // => true
 * isPrimitive("a"); // => true
 * isPrimitive(0); // => true
 * isPrimitive(false); // => true
 * isPrimitive(null); // => true
 * isPrimitive(undefined); // => true
 * isPrimitive({}); // => false
 * isPrimitive([]); // => false
 * isPrimitive(() => {}); // => false
 * isObject(/a/); // => false
 * isObject(new Number(0)); // => false
 * isObject(new String("")); // => false
 * ```
 *
 * @see {@link isObject}
 */
export const isPrimitive = (
  value: unknown,
): value is string | number | boolean | bigint | symbol | undefined | null =>
  value == null ||
  typeof value === "string" ||
  typeof value === "number" ||
  typeof value === "boolean" ||
  typeof value === "bigint" ||
  typeof value === "symbol";

/**
 * Returns `true` if the value is an object. (i.e. not a primitive)
 * @param value The value to check.
 *
 * @example
 * ```typescript
 * isObject({}); // => true
 * isObject([]); // => true
 * isObject(() => {}); // => true
 * isObject(/a/); // => true
 * isObject(new Number(0)); // => true
 * isObject(new String("")); // => true
 * isObject(""); // => false
 * isObject("a"); // => false
 * isObject(0); // => false
 * isObject(false); // => false
 * isObject(null); // => false
 * isObject(undefined); // => false
 * ```
 *
 * @see {@link isPrimitive}
 */
export const isObject = (value: unknown): value is object => {
  if (value === null) return false;
  const type = typeof value;
  return type === "object" || type === "function";
};

/**
 * Returns `true` if the value is object-like, meaning it's not `null` and has a `typeof` result of `"object"`.
 * @param value The value to check.
 *
 * @example
 * ```typescript
 * isObjectLike({}); // => true
 * isObjectLike([1, 2, 3]); // => true
 * isObjectLike(new Set([1, 2, 3])); // => true
 * isObjectLike(new Map([["a", 1], ["b", 2], ["c", 3]])); // => true
 * isObjectLike(null); // => false
 * isObjectLike(undefined); // => false
 * isObjectLike(0); // => false
 * ```
 */
export const isObjectLike = (value: unknown): value is Record<PropertyKey, unknown> =>
  typeof value === "object" && value !== null;
