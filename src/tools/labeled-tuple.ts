import type { Inc } from "./number";

/**
 * An one-element tuple. The element can be optional.
 *
 * Used to represent a type with a label.
 */
export type Part = [_?: unknown];

/**
 * If `P` is an optional {@link Part}, return `Then`, otherwise return `Else`.
 */
export type IfOptionalPart<P extends Part, Then, Else> = [_?: never] extends P ? Then : Else;
/**
 * Judge whether a {@link Part} is optional.
 */
export type IsOptionalPart<P extends Part> = IfOptionalPart<P, true, false>;

/**
 * Unwrap the element of a {@link Part}. If the part is optional, `undefined` is excluded.
 *
 * @example
 * ```typescript
 * type R1 = PartElem<[foo: number]>;
 * //   ^? number
 * type R2 = PartElem<[bar?: boolean]>;
 * //   ^? boolean
 * ```
 */
export type PartElem<P extends Part> = IfOptionalPart<P, Exclude<P[0], undefined>, P[0]>;

/**
 * Get the {@link Part} at index `Index` of a tuple. Label of the part is kept.
 */
export type GetPart<Index extends number, TS extends unknown[]> = _GetPart<Index, TS, 0>;
type _GetPart<I extends number, TS extends unknown[], Counter extends number> =
  Counter extends I ? HeadPart<TS>
  : TS extends [_?: unknown, ...infer Rest] ? _GetPart<I, Rest, Inc<Counter>>
  : never;

/**
 * Get the first {@link Part} of a tuple. Label of the part is kept.
 *
 * @example
 * ```typescript
 * type R1 = HeadPart<[foo: number, bar?: boolean]>;
 * //   ^? [foo: number]
 * type R2 = HeadPart<[baz?: string, qux?: number, zot?: boolean]>;
 * //   ^? [baz?: string]
 * ```
 */
export type HeadPart<TS extends unknown[]> =
  (
    TS extends [_?: unknown] ? TS
    : TS extends [...infer H, _?: unknown] ? HeadPart<H>
    : never
  ) extends infer R extends Part ?
    R
  : never;
/**
 * Get the rest of a tuple after the first {@link Part}. Labels are kept.
 *
 * @example
 * ```typescript
 * type R1 = TailPart<[foo: number, bar?: boolean]>;
 * //   ^? [bar?: boolean | undefined]
 * type R2 = TailPart<[baz?: string, qux?: number, zot?: boolean]>;
 * //   ^? [qux?: number | undefined, zot?: boolean | undefined]
 * ```
 */
export type TailPart<TS extends unknown[]> = TS extends [_?: unknown, ...infer Rest] ? Rest : never;

/**
 * Wrap a type in an one-element tuple with label provided by `Name`.
 *
 * @example
 * ```typescript
 * type R1 = WrapWithName<[foo: void], number>;
 * //   ^? [foo: number]
 * type R2 = WrapWithName<[bar?: void], string | boolean>;
 * //   ^? [bar: string | boolean]
 * ```
 */
export type WrapWithName<Name extends Part, T> =
  { [K in keyof Name]-?: T } extends infer R extends Part ? R : never;
/**
 * Similar to {@link WrapWithName}, but the label is optional.
 *
 * @example
 * ```typescript
 * type R1 = WrapWithNameOptional<[foo: void], number>;
 * //   ^?: [foo?: number | undefined]
 * type R2 = WrapWithNameOptional<[bar?: void], string | boolean>;
 * //   ^?: [bar?: string | boolean | undefined]
 * ```
 */
export type WrapWithNameOptional<Name extends Part, T> =
  { [K in keyof Name]?: T } extends infer R extends Part ? R : never;

/**
 * Add labels to a tuple (`TS`) by another tuple with labels (`Names`).
 * Optional items are decided by ones in `TS`.
 *
 * @example
 * ```typescript
 * type R = LabeledBy<[a: void, b: void, c: void], [number, string, optionalArg?: boolean]>;
 * //   ^?: [a: number, b: string, c?: boolean | undefined]
 * ```
 */
export type LabeledBy<Names extends unknown[], TS extends unknown[]> =
  Names extends [] ? TS
  : TS extends [] ? []
  : [..._LabeledBy<HeadPart<Names>, HeadPart<TS>>, ...LabeledBy<TailPart<Names>, TailPart<TS>>];
type _LabeledBy<Name extends Part, P extends Part> = IfOptionalPart<
  P,
  WrapWithNameOptional<Name, PartElem<P>>,
  WrapWithName<Name, PartElem<P>>
>;
