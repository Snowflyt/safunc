import type { EQ, GT, LT } from "./number";

/**
 * Reverse a string.
 */
export type Reverse<S extends string> = S extends `${infer F}${infer R}` ? `${Reverse<R>}${F}` : "";

/**
 * Compare the length of two strings.
 */
export type CompareStrLength<S1 extends string, S2 extends string> =
  S1 extends `${string}${infer R}` ?
    S2 extends `${string}${infer S}` ?
      CompareStrLength<R, S>
    : GT
  : S2 extends "" ? EQ
  : LT;

/**
 * Convert a string to a number.
 */
export type StrToNum<S extends string> = S extends `${infer R extends number}` ? R : never;
