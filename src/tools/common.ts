/**
 * Judge whether the two types are exactly the same.
 */
export type Eq<T, U> =
  (<G>() => G extends T ? 1 : 2) extends <G>() => G extends U ? 1 : 2 ? true : false;

/**
 * If `T` is `never`, return `Then`, otherwise return `Else`.
 */
export type IfNever<T, Then, Else = T> = [T] extends [never] ? Then : Else;

/**
 * A type that represents a function.
 */
export type Fn = (...args: never[]) => unknown;

/**
 * Merge two objects together. Optional keys are considered.
 *
 * @example
 * ```typescript
 * type A = { a: number; b?: string };
 * type B = { a: boolean; c: string };
 * type R = Merge<A, B>;
 * //   ^?: { a: boolean; b?: string; c: string }
 * ```
 */
export type Merge<L, R> = _Id<
  Pick<L, Exclude<keyof L, keyof R>> &
    Pick<R, Exclude<keyof R, OptionalKeyOf<R>>> &
    Pick<R, Exclude<OptionalKeyOf<R>, keyof L>> &
    _SpreadProperties<L, R, OptionalKeyOf<R> & keyof L>
>;
type _Id<T> = T extends infer U ? { [K in keyof U]: U[K] } : never;
type OptionalKeyOf<O> = {
  [K in keyof O]-?: {} extends { [P in K]: O[K] } ? K : never;
}[keyof O];
type _SpreadProperties<L, R, K extends keyof L & keyof R> = {
  [P in K]: L[P] | Exclude<R[P], undefined>;
};

/**
 * Convert a union type to a tuple type.
 */
export type TuplifyLiteralStringUnion<U extends string> =
  _ToList<U> extends infer X ?
    X extends readonly unknown[] ?
      X
    : never
  : never;
type _ToList<U, LN extends readonly unknown[] = [], LastU = Last<U>> = {
  0: _ToList<Exclude<U, LastU>, [LastU, ...LN]>;
  1: LN;
}[[U] extends [never] ? 1 : 0];
type Last<U> =
  IntersectOf<U extends unknown ? (x: U) => void : never> extends (x: infer P) => void ? P : never;
type IntersectOf<U> =
  (U extends unknown ? (k: U) => void : never) extends (k: infer I) => void ? I : never;
