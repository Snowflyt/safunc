import type { Eq, Fn } from "./common";
import type {
  GetPart,
  HeadPart,
  PartElem,
  TailPart,
  WrapWithName,
  WrapWithNameOptional,
} from "./labeled-tuple";
import type { Compare, GT, Inc } from "./number";

/**
 * Add proper labels to each item of a tuple type, handling optional items gracefully.
 *
 * Useful for making function parameters more readable.
 *
 * @example
 * ```typescript
 * type R1 = NameParams<[number, number]>;
 * //   ^?: [n: number, m: number]
 * type R2 = NameParams<[optionalArg?: boolean]>; // 🡄 Optional items are handled gracefully
 * //   ^?: [b?: boolean | undefined]
 * type R3 = NameParams<[string[], (s1: string, s2: string) => string, _?: number]>;
 * //   ^?: [ss: string[], f: (s1: string, s2: string) => string, n?: number | undefined]
 * ```
 */
export type NameParams<TS extends unknown[]> = _NameParams<TS, J>;
type J = [
  [Is<string>, [s: _], [s1: _, s2: _, s3: _, s4: _]],
  [IsOneOf<[number, bigint]>, [n: _, m: _], [n1: _, n2: _, n3: _, n4: _]],
  [Is<boolean>, [b: _], [b1: _, b2: _, b3: _, b4: _]],
  [Is<Date>, [d: _], [d1: _, d2: _, d3: _, d4: _]],
  [IsOneOf<[string[], readonly string[]]>, [ss: _], [ss1: _, ss2: _, ss3: _, ss4: _]],
  [
    IsOneOf<
      [
        number[],
        readonly number[],
        bigint[],
        readonly bigint[],
        (number | bigint)[],
        readonly (number | bigint)[],
      ]
    >,
    [ns: _, ms: _],
    [ns1: _, ns2: _, ns3: _, ns4: _],
  ],
  [IsOneOf<[boolean[], readonly boolean[]]>, [bs: _], [bs1: _, bs2: _, bs3: _, bs4: _]],
  [Extends<readonly unknown[]>, [xs: _, ys: _, zs: _, ws: _, vs: _, us: _], []],
  [Extends<Fn>, [f: _, g: _, h: _], [f1: _, f2: _, f3: _, f4: _]],
  Otherwise<[x: _, y: _, z: _, w: _, v: _, u: _]>,
];

/******************
 * Implementation *
 ******************/
type _ = void;

declare const __condition: unique symbol;
interface Condition<Type extends string, T> {
  [__condition]: Type;
  __names: T;
}

interface Is<T> extends Condition<"is", T> {}
interface IsOneOf<TS extends unknown[]> extends Condition<"is-one-of", TS> {}
interface Extends<T> extends Condition<"extends", T> {}

declare const __otherwise: unique symbol;
interface Otherwise<Names extends _[]> {
  [__otherwise]: Names;
}

type Conditions = [...[Condition<any, any>, _[], _[]][], Otherwise<any>];

type CountEq<X, TS extends unknown[]> = _CountEq<X, TS> extends infer R extends number ? R : never;
type _CountEq<X, TS extends unknown[], Acc extends number = 0> =
  TS extends [] ? Acc
  : _CountEq<X, TailPart<TS>, Eq<PartElem<HeadPart<TS>>, X> extends true ? Inc<Acc> : Acc>;
type CountEqOneOf<XS extends unknown[], TS extends unknown[]> =
  _CountEqOneOf<XS, TS> extends infer R extends number ? R : never;
type _CountEqOneOf<XS extends unknown[], TS extends unknown[], Acc extends number = 0> =
  TS extends [] ? Acc
  : _CountEqOneOf<
      XS,
      TailPart<TS>,
      _EqOneOf<PartElem<HeadPart<TS>>, XS> extends true ? Inc<Acc> : Acc
    >;
type _EqOneOf<T, XS extends unknown[]> =
  XS extends [infer X, ...infer Rest] ?
    Eq<T, X> extends true ?
      true
    : _EqOneOf<T, Rest>
  : false;
type CountExtends<X, TS extends unknown[]> =
  _CountExtends<X, TS> extends infer R extends number ? R : never;
type _CountExtends<X, TS extends unknown[], Acc extends number = 0> =
  TS extends [] ? Acc
  : _CountExtends<X, TailPart<TS>, PartElem<HeadPart<TS>> extends X ? Inc<Acc> : Acc>;

type CountOtherwise<TS extends unknown[], CS extends unknown[], Acc extends number = 0> =
  TS extends [] ? Acc
  : CountOtherwise<
      TailPart<TS>,
      CS,
      _MatchAnyCondition<PartElem<HeadPart<TS>>, CS> extends true ? Acc : Inc<Acc>
    >;
type _MatchAnyCondition<T, CS extends unknown[]> =
  CS extends [[infer C extends Condition<any, any>, unknown, unknown], ...infer Rest] ?
    C extends Is<infer U> ?
      Eq<T, U> extends true ?
        true
      : _MatchAnyCondition<T, Rest>
    : C extends IsOneOf<infer TS> ?
      _EqOneOf<T, TS> extends true ?
        true
      : _MatchAnyCondition<T, Rest>
    : C extends Extends<infer U> ?
      T extends U ?
        true
      : _MatchAnyCondition<T, Rest>
    : never
  : false;

type _NameParams<
  TS extends unknown[],
  CS extends Conditions,
  Prev extends unknown[] = [],
  All extends unknown[] = TS,
> =
  (
    TS extends [] ?
      []
    : [
        ..._NameParam<
          PartElem<HeadPart<TS>>,
          [_?: never] extends HeadPart<TS> ? true : false,
          CS,
          CS,
          Prev,
          All
        >,
        ..._NameParams<TailPart<TS>, CS, [...Prev, PartElem<HeadPart<TS>>], All>,
      ]
  ) extends infer R extends TS ?
    R
  : never;
type _NameParam<
  T,
  IsOptional extends boolean,
  CS extends unknown[],
  AllCS extends unknown[],
  Prev extends unknown[],
  All extends unknown[],
> =
  (
    CS extends (
      [
        infer C extends [Condition<any, any>, _[], _[]] | Otherwise<any>,
        ...infer Rest extends unknown[],
      ]
    ) ?
      _TryNameParam<T, IsOptional, C, AllCS, Prev, All> extends infer R ?
        [R] extends [never] ?
          _NameParam<T, IsOptional, Rest, AllCS, Prev, All>
        : R
      : never
    : never
  ) extends infer R extends unknown[] ?
    R
  : never;
type _TryNameParam<
  T,
  IsOptional extends boolean,
  C extends [Condition<any, any>, _[], _[]] | Otherwise<any>,
  CS extends unknown[],
  Prev extends unknown[],
  All extends unknown[],
> =
  C extends [Is<infer U>, infer PreferredNames extends _[], infer AlternativeNames extends _[]] ?
    Eq<T, U> extends true ?
      Compare<CountEq<U, All>, PreferredNames["length"]> extends GT ?
        IsOptional extends true ?
          WrapWithNameOptional<
            GetPart<CountEq<U, Prev>, AlternativeNames> extends infer N extends [_] ? N : [_: _],
            T
          >
        : WrapWithName<
            GetPart<CountEq<U, Prev>, AlternativeNames> extends infer N extends [_] ? N : [_: _],
            T
          >
      : IsOptional extends true ?
        WrapWithNameOptional<
          GetPart<CountEq<U, Prev>, PreferredNames> extends infer N extends [_] ? N : [_: _],
          T
        >
      : WrapWithName<
          GetPart<CountEq<U, Prev>, PreferredNames> extends infer N extends [_] ? N : [_: _],
          T
        >
    : never
  : C extends (
    [
      IsOneOf<infer US extends unknown[]>,
      infer PreferredNames extends _[],
      infer AlternativeNames extends _[],
    ]
  ) ?
    _EqOneOf<T, US> extends true ?
      Compare<CountEqOneOf<US, All>, PreferredNames["length"]> extends GT ?
        IsOptional extends true ?
          WrapWithNameOptional<
            GetPart<CountEqOneOf<US, Prev>, AlternativeNames> extends infer N extends [_] ? N
            : [_: _],
            T
          >
        : WrapWithName<
            GetPart<CountEqOneOf<US, Prev>, AlternativeNames> extends infer N extends [_] ? N
            : [_: _],
            T
          >
      : IsOptional extends true ?
        WrapWithNameOptional<
          GetPart<CountEqOneOf<US, Prev>, PreferredNames> extends infer N extends [_] ? N : [_: _],
          T
        >
      : WrapWithName<
          GetPart<CountEqOneOf<US, Prev>, PreferredNames> extends infer N extends [_] ? N : [_: _],
          T
        >
    : never
  : C extends (
    [Extends<infer U>, infer PreferredNames extends _[], infer AlternativeNames extends _[]]
  ) ?
    T extends U ?
      Compare<CountExtends<U, All>, PreferredNames["length"]> extends GT ?
        IsOptional extends true ?
          WrapWithNameOptional<
            GetPart<CountExtends<U, Prev>, AlternativeNames> extends infer N extends [_] ? N
            : [_: _],
            T
          >
        : WrapWithName<
            GetPart<CountExtends<U, Prev>, AlternativeNames> extends infer N extends [_] ? N
            : [_: _],
            T
          >
      : IsOptional extends true ?
        WrapWithNameOptional<
          GetPart<CountExtends<U, Prev>, PreferredNames> extends infer N extends [_] ? N : [_: _],
          T
        >
      : WrapWithName<
          GetPart<CountExtends<U, Prev>, PreferredNames> extends infer N extends [_] ? N : [_: _],
          T
        >
    : never
  : C extends Otherwise<infer Names extends _[]> ?
    IsOptional extends true ?
      WrapWithNameOptional<
        GetPart<CountOtherwise<Prev, CS>, Names> extends infer N extends [_] ? N : [_: _],
        T
      >
    : WrapWithName<
        GetPart<CountOtherwise<Prev, CS>, Names> extends infer N extends [_] ? N : [_: _],
        T
      >
  : never;
