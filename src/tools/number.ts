import type { CompareStrLength, Reverse, StrToNum } from "./string";

export type EQ = 0;
export type GT = 1;
export type LT = -1;

type Digit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
type SDigit = `${Digit}`;

/**
 * Add 1 to a natural number.
 */
export type Inc<N extends number> = Add<N, 1>;

/**
 * Add two natural numbers.
 */
export type Add<N extends number, M extends number> = StrToNum<SAdd<`${N}`, `${M}`>>;
type SAdd<N extends string, M extends string> =
  CompareStrLength<N, M> extends GT ? Reverse<_SAdd<Reverse<N>, Reverse<M>>>
  : Reverse<_SAdd<Reverse<M>, Reverse<N>>>;
type _SAdd<
  N extends string,
  M extends string,
  Carry extends 0 | 1 = 0,
  Result extends string = "",
> =
  N extends `${infer F extends Digit}${infer R}` ?
    M extends `${infer G extends Digit}${infer S}` ?
      _AddDigit<F, G> extends infer D extends number ?
        `${D}` extends `1${infer D extends Digit}` ?
          _SAdd<R, S, 1, `${Result}${Carry extends 1 ? _AddDigit<D, 1> : D}`>
        : D extends Digit ?
          [D, Carry] extends [9, 1] ?
            _SAdd<R, S, 1, `${Result}0`>
          : _SAdd<R, S, 0, `${Result}${Carry extends 1 ? _AddDigit<D, 1> : D}`>
        : never
      : never
    : Carry extends 1 ? `${Result}${_SAdd<N, "1">}`
    : `${Result}${N}`
  : Carry extends 1 ? `${Result}1`
  : Result;
type _AddDigit<N extends Digit, M extends Digit> =
  N extends 0 ? M
  : M extends 0 ? N
  : N extends 1 ?
    // prettier-ignore
    M extends 1 ? 2 : M extends 2 ? 3 : M extends 3 ? 4 : M extends 4 ? 5 : M extends 5 ? 6 : M extends 6 ? 7 : M extends 7 ? 8 : M extends 8 ? 9 : 10
  : N extends 2 ?
    // prettier-ignore
    M extends 1 ? 3 : M extends 2 ? 4 : M extends 3 ? 5 : M extends 4 ? 6 : M extends 5 ? 7 : M extends 6 ? 8 : M extends 7 ? 9 : M extends 8 ? 10 : 11
  : N extends 3 ?
    // prettier-ignore
    M extends 1 ? 4 : M extends 2 ? 5 : M extends 3 ? 6 : M extends 4 ? 7 : M extends 5 ? 8 : M extends 6 ? 9 : M extends 7 ? 10 : M extends 8 ? 11 : 12
  : N extends 4 ?
    // prettier-ignore
    M extends 1 ? 5 : M extends 2 ? 6 : M extends 3 ? 7 : M extends 4 ? 8 : M extends 5 ? 9 : M extends 6 ? 10 : M extends 7 ? 11 : M extends 8 ? 12 : 13
  : N extends 5 ?
    // prettier-ignore
    M extends 1 ? 6 : M extends 2 ? 7 : M extends 3 ? 8 : M extends 4 ? 9 : M extends 5 ? 10 : M extends 6 ? 11 : M extends 7 ? 12 : M extends 8 ? 13 : 14
  : N extends 6 ?
    // prettier-ignore
    M extends 1 ? 7 : M extends 2 ? 8 : M extends 3 ? 9 : M extends 4 ? 10 : M extends 5 ? 11 : M extends 6 ? 12 : M extends 7 ? 13 : M extends 8 ? 14 : 15
  : N extends 7 ?
    // prettier-ignore
    M extends 1 ? 8 : M extends 2 ? 9 : M extends 3 ? 10 : M extends 4 ? 11 : M extends 5 ? 12 : M extends 6 ? 13 : M extends 7 ? 14 : M extends 8 ? 15 : 16
  : N extends 8 ?
    // prettier-ignore
    M extends 1 ? 9 : M extends 2 ? 10 : M extends 3 ? 11 : M extends 4 ? 12 : M extends 5 ? 13 : M extends 6 ? 14 : M extends 7 ? 15 : M extends 8 ? 16 : 17
  : // prettier-ignore
  M extends 1 ? 10 : M extends 2 ? 11 : M extends 3 ? 12 : M extends 4 ? 13 : M extends 5 ? 14 : M extends 6 ? 15 : M extends 7 ? 16 : M extends 8 ? 17 : 18;

/**
 * Compare two natural numbers.
 */
export type Compare<N extends number, M extends number> =
  _CompareListLength<_ToChars<N>, _ToChars<M>> extends EQ ? _CompareDigits<_ToChars<N>, _ToChars<M>>
  : _CompareListLength<_ToChars<N>, _ToChars<M>>;
type _CompareListLength<NS extends unknown[], MS extends unknown[]> =
  NS extends [unknown, ...infer ATail extends unknown[]] ?
    MS extends [unknown, ...infer BTail extends unknown[]] ?
      _CompareListLength<ATail, BTail>
    : GT
  : MS extends [unknown, ...unknown[]] ? LT
  : EQ;
type _ToChars<N extends number | string> =
  `${N}` extends `${infer H}${infer T}` ? [H, ..._ToChars<T>] : [];
type _CompareDigits<NS extends string[], MS extends string[]> =
  NS extends [infer AHead extends SDigit, ...infer ATail extends SDigit[]] ?
    MS extends [infer BHead extends SDigit, ...infer BTail extends SDigit[]] ?
      _CompareDigit<AHead, BHead> extends EQ ?
        _CompareDigits<ATail, BTail>
      : _CompareDigit<AHead, BHead>
    : _CompareDigit<AHead, "0">
  : EQ;
type _CompareDigit<N extends SDigit, M extends SDigit> =
  N extends M ? EQ
  : N extends "0" ? LT
  : N extends "1" ?
    // prettier-ignore
    M extends "0" ? GT : LT
  : N extends "2" ?
    // prettier-ignore
    M extends "0" | "1" ? GT : LT
  : N extends "3" ?
    // prettier-ignore
    M extends "0" | "1" | "2" ? GT : LT
  : N extends "4" ?
    // prettier-ignore
    M extends "0" | "1" | "2" | "3" ? GT : LT
  : N extends "5" ?
    // prettier-ignore
    M extends "0" | "1" | "2" | "3" | "4" ? GT : LT
  : N extends "6" ?
    // prettier-ignore
    M extends "0" | "1" | "2" | "3" | "4" | "5" ? GT : LT
  : N extends "7" ?
    // prettier-ignore
    M extends "0" | "1" | "2" | "3" | "4" | "5" | "6" ? GT : LT
  : N extends "8" ?
    // prettier-ignore
    M extends "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" ? GT : LT
  : // prettier-ignore
  M extends "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" ? GT : LT;
