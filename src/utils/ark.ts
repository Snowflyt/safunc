/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import {
  type,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - Only used in doc comments
  union,
} from "arktype";

import { isObject, isObjectLike, isPrimitive } from "./assertions";

import type { Fn } from "@/tools/common";
import type {
  Infer,
  PrecompiledDefaults,
  Problems,
  Type,
  inferDefinition,
  validateDefinition,
} from "arktype";

export type ValidateDefinition<Def> = validateDefinition<Def, PrecompiledDefaults>;
export type InferDefinition<Def> = inferDefinition<Def, PrecompiledDefaults>;

export type Out<O> = readonly ["|>", O];

export type AsOut<T> = Type<T>["infer"];
export type AsIn<T> = Type<T>["inferIn"];

/**
 * Judge whether the input is an Arktype schema.
 * @param x The input to judge.
 * @returns
 */
export const isType = (x: unknown): x is Type =>
  isObject(x) && "infer" in x && "inferIn" in x && "allows" in x;

const recordSymbol = Symbol("safunc/record");
type ValidateProp<Def> =
  ParseDef<ValidateDefinition<Def>> extends PropertyKey ? ValidateDefinition<Def>
  : "PropType should extends 'string | number | symbol'";
type ParseDef<Def> = ReturnType<typeof type<Def>> extends Type<infer T> ? T : never;
/**
 * An Arktype schema that validates an object with a specific set of keys and values.
 * @param prop The schema for the keys.
 * @param value The schema for the values.
 * @returns
 *
 * @example
 * ```typescript
 * const schema = record("string", "number");
 * //    ^?: Type<Record<string, number>>
 * schema.assert({ foo: 42 });
 * schema.assert(42); // !TypeError: Must be an object (was number)
 * schema.assert({ foo: "bar" }); // !TypeError: Must be an object with values of type 'number' (was {"foo":"bar"})
 * schema.assert({ [Symbol()]: 42 }); // !TypeError: Must be an object with keys of type 'string' (was {})
 * ```
 */
export const record = <Prop, Value>(
  prop: ValidateProp<Prop>,
  value: ValidateDefinition<Value>,
): Type<
  Record<
    // @ts-expect-error - TS doesn't know `ParseDef<Prop>` extends `PropertyKey`
    ParseDef<Prop>,
    ParseDef<Value>
  >
> => {
  const propSchema = type(prop as never);
  const valueSchema = type(value);

  return type([
    "object" as Infer<
      Record<
        // @ts-expect-error - TS doesn't know `ParseDef<Prop>` extends `PropertyKey`
        ParseDef<Prop>,
        ParseDef<Value>
      >
    >,
    "=>",
    // @ts-expect-error - TS doesn't know it is assignable
    Object.assign(
      (
        o: Record<
          // @ts-expect-error - TS doesn't know `ParseDef<Prop>` extends `PropertyKey`
          ParseDef<Prop>,
          ParseDef<Value>
        >,
        problems: Problems,
      ) => {
        if (!isObject(o)) return problems.mustBe("an object");
        for (const k of [...Object.keys(o), ...Object.getOwnPropertySymbols(o)]) {
          const { problems: keyProblems } = propSchema(k);
          if (keyProblems)
            problems.mustBe(`an object with keys of type '${stringifyDefinitionOf(propSchema)}'`);
          const { data: newValue } = valueSchema(o[k as keyof typeof o]);
          if (newValue) o[k as keyof typeof o] = newValue as never;
          else
            problems.mustBe(
              `an object with values of type '${stringifyDefinitionOf(valueSchema)}'`,
            );
        }
        return true;
      },
      { [recordSymbol]: "record", $meta: { propSchema, valueSchema } },
    ),
  ]) as never;
};
/**
 * Judge whether the input is an Arktype schema created by {@link record}
 * @param fn The input to judge.
 * @returns
 */
const isRecordSchema = (fn: Fn) => recordSymbol in fn && fn[recordSymbol] === "record";

/**
 * A shorthand for creating nested Arktype {@link union}s. Supports up to 16 arguments.
 * @param args
 * @returns
 *
 * @example
 * ```typescript
 * const schema = unions("string", "number", "boolean");
 * //    ^?: Type<string | number | boolean>
 * schema.assert("foo");
 * schema.assert(42);
 * schema.assert(true);
 * schema.assert({}); // !TypeError: Must be a string, a number or boolean (was {})
 * ```
 */
export const unions: {
  <A, B>(a: ValidateDefinition<A>, b: ValidateDefinition<B>): Type<ParseDef<A> | ParseDef<B>>;
  // prettier-ignore
  <A, B, C>(a: ValidateDefinition<A>, b: ValidateDefinition<B>, c: ValidateDefinition<C>): Type<ParseDef<A> | ParseDef<B> | ParseDef<C>>;
  // prettier-ignore
  <A, B, C, D>(a: ValidateDefinition<A>, b: ValidateDefinition<B>, c: ValidateDefinition<C>, d: ValidateDefinition<D>): Type<ParseDef<A> | ParseDef<B> | ParseDef<C> | ParseDef<D>>;
  // prettier-ignore
  <A, B, C, D, E>(a: ValidateDefinition<A>, b: ValidateDefinition<B>, c: ValidateDefinition<C>, d: ValidateDefinition<D>, e: ValidateDefinition<E>): Type<ParseDef<A> | ParseDef<B> | ParseDef<C> | ParseDef<D> | ParseDef<E>>;
  // prettier-ignore
  <A, B, C, D, E, F>(a: ValidateDefinition<A>, b: ValidateDefinition<B>, c: ValidateDefinition<C>, d: ValidateDefinition<D>, e: ValidateDefinition<E>, f: ValidateDefinition<F>): Type<ParseDef<A> | ParseDef<B> | ParseDef<C> | ParseDef<D> | ParseDef<E> | ParseDef<F>>;
  // prettier-ignore
  <A, B, C, D, E, F, G>(a: ValidateDefinition<A>, b: ValidateDefinition<B>, c: ValidateDefinition<C>, d: ValidateDefinition<D>, e: ValidateDefinition<E>, f: ValidateDefinition<F>, g: ValidateDefinition<G>): Type<ParseDef<A> | ParseDef<B> | ParseDef<C> | ParseDef<D> | ParseDef<E> | ParseDef<F> | ParseDef<G>>;
  // prettier-ignore
  <A, B, C, D, E, F, G, H>(a: ValidateDefinition<A>, b: ValidateDefinition<B>, c: ValidateDefinition<C>, d: ValidateDefinition<D>, e: ValidateDefinition<E>, f: ValidateDefinition<F>, g: ValidateDefinition<G>, h: ValidateDefinition<H>): Type<ParseDef<A> | ParseDef<B> | ParseDef<C> | ParseDef<D> | ParseDef<E> | ParseDef<F> | ParseDef<G> | ParseDef<H>>;
  // prettier-ignore
  <A, B, C, D, E, F, G, H, I>(a: ValidateDefinition<A>, b: ValidateDefinition<B>, c: ValidateDefinition<C>, d: ValidateDefinition<D>, e: ValidateDefinition<E>, f: ValidateDefinition<F>, g: ValidateDefinition<G>, h: ValidateDefinition<H>, i: ValidateDefinition<I>): Type<ParseDef<A> | ParseDef<B> | ParseDef<C> | ParseDef<D> | ParseDef<E> | ParseDef<F> | ParseDef<G> | ParseDef<H> | ParseDef<I>>;
  // prettier-ignore
  <A, B, C, D, E, F, G, H, I, J>(a: ValidateDefinition<A>, b: ValidateDefinition<B>, c: ValidateDefinition<C>, d: ValidateDefinition<D>, e: ValidateDefinition<E>, f: ValidateDefinition<F>, g: ValidateDefinition<G>, h: ValidateDefinition<H>, i: ValidateDefinition<I>, j: ValidateDefinition<J>): Type<ParseDef<A> | ParseDef<B> | ParseDef<C> | ParseDef<D> | ParseDef<E> | ParseDef<F> | ParseDef<G> | ParseDef<H> | ParseDef<I> | ParseDef<J>>;
  // prettier-ignore
  <A, B, C, D, E, F, G, H, I, J, K>(a: ValidateDefinition<A>, b: ValidateDefinition<B>, c: ValidateDefinition<C>, d: ValidateDefinition<D>, e: ValidateDefinition<E>, f: ValidateDefinition<F>, g: ValidateDefinition<G>, h: ValidateDefinition<H>, i: ValidateDefinition<I>, j: ValidateDefinition<J>, k: ValidateDefinition<K>): Type<ParseDef<A> | ParseDef<B> | ParseDef<C> | ParseDef<D> | ParseDef<E> | ParseDef<F> | ParseDef<G> | ParseDef<H> | ParseDef<I> | ParseDef<J> | ParseDef<K>>;
  // prettier-ignore
  <A, B, C, D, E, F, G, H, I, J, K, L>(a: ValidateDefinition<A>, b: ValidateDefinition<B>, c: ValidateDefinition<C>, d: ValidateDefinition<D>, e: ValidateDefinition<E>, f: ValidateDefinition<F>, g: ValidateDefinition<G>, h: ValidateDefinition<H>, i: ValidateDefinition<I>, j: ValidateDefinition<J>, k: ValidateDefinition<K>, l: ValidateDefinition<L>): Type<ParseDef<A> | ParseDef<B> | ParseDef<C> | ParseDef<D> | ParseDef<E> | ParseDef<F> | ParseDef<G> | ParseDef<H> | ParseDef<I> | ParseDef<J> | ParseDef<K> | ParseDef<L>>;
  // prettier-ignore
  <A, B, C, D, E, F, G, H, I, J, K, L, M>(a: ValidateDefinition<A>, b: ValidateDefinition<B>, c: ValidateDefinition<C>, d: ValidateDefinition<D>, e: ValidateDefinition<E>, f: ValidateDefinition<F>, g: ValidateDefinition<G>, h: ValidateDefinition<H>, i: ValidateDefinition<I>, j: ValidateDefinition<J>, k: ValidateDefinition<K>, l: ValidateDefinition<L>, m: ValidateDefinition<M>): Type<ParseDef<A> | ParseDef<B> | ParseDef<C> | ParseDef<D> | ParseDef<E> | ParseDef<F> | ParseDef<G> | ParseDef<H> | ParseDef<I> | ParseDef<J> | ParseDef<K> | ParseDef<L> | ParseDef<M>>;
  // prettier-ignore
  <A, B, C, D, E, F, G, H, I, J, K, L, M, N>(a: ValidateDefinition<A>, b: ValidateDefinition<B>, c: ValidateDefinition<C>, d: ValidateDefinition<D>, e: ValidateDefinition<E>, f: ValidateDefinition<F>, g: ValidateDefinition<G>, h: ValidateDefinition<H>, i: ValidateDefinition<I>, j: ValidateDefinition<J>, k: ValidateDefinition<K>, l: ValidateDefinition<L>, m: ValidateDefinition<M>, n: ValidateDefinition<N>): Type<ParseDef<A> | ParseDef<B> | ParseDef<C> | ParseDef<D> | ParseDef<E> | ParseDef<F> | ParseDef<G> | ParseDef<H> | ParseDef<I> | ParseDef<J> | ParseDef<K> | ParseDef<L> | ParseDef<M> | ParseDef<N>>;
  // prettier-ignore
  <A, B, C, D, E, F, G, H, I, J, K, L, M, N, O>(a: ValidateDefinition<A>, b: ValidateDefinition<B>, c: ValidateDefinition<C>, d: ValidateDefinition<D>, e: ValidateDefinition<E>, f: ValidateDefinition<F>, g: ValidateDefinition<G>, h: ValidateDefinition<H>, i: ValidateDefinition<I>, j: ValidateDefinition<J>, k: ValidateDefinition<K>, l: ValidateDefinition<L>, m: ValidateDefinition<M>, n: ValidateDefinition<N>, o: ValidateDefinition<O>): Type<ParseDef<A> | ParseDef<B> | ParseDef<C> | ParseDef<D> | ParseDef<E> | ParseDef<F> | ParseDef<G> | ParseDef<H> | ParseDef<I> | ParseDef<J> | ParseDef<K> | ParseDef<L> | ParseDef<M> | ParseDef<N> | ParseDef<O>>;
  // prettier-ignore
  <A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P>(a: ValidateDefinition<A>, b: ValidateDefinition<B>, c: ValidateDefinition<C>, d: ValidateDefinition<D>, e: ValidateDefinition<E>, f: ValidateDefinition<F>, g: ValidateDefinition<G>, h: ValidateDefinition<H>, i: ValidateDefinition<I>, j: ValidateDefinition<J>, k: ValidateDefinition<K>, l: ValidateDefinition<L>, m: ValidateDefinition<M>, n: ValidateDefinition<N>, o: ValidateDefinition<O>, p: ValidateDefinition<P>): Type<ParseDef<A> | ParseDef<B> | ParseDef<C> | ParseDef<D> | ParseDef<E> | ParseDef<F> | ParseDef<G> | ParseDef<H> | ParseDef<I> | ParseDef<J> | ParseDef<K> | ParseDef<L> | ParseDef<M> | ParseDef<N> | ParseDef<O> | ParseDef<P>>;
} = (...args: unknown[]) => {
  let res: any = args[0];
  for (const arg of args.slice(1)) res = [res, "|", arg];
  return type(res);
};

/**
 * Stringify the definition of an Arktype schema.
 * @param type The Arktype schema to stringify.
 * @returns
 */
export const stringifyDefinitionOf = (type: Type): string =>
  stringifyDefinition(prettifiedDefinitionOf(type));
const stringifyDefinition = (value: unknown): string => {
  if (typeof value === "string")
    return value.endsWith("[]") ? "Array<" + value.slice(0, -2) + ">" : value;
  if (isPrimitive(value)) return String(value);
  if (Array.isArray(value) && value.length === 3 && value[0] === "record")
    return "Record<" + stringifyDefinition(value[1]) + ", " + stringifyDefinition(value[2]) + ">";
  if (Array.isArray(value)) {
    if (value.length === 2 && value[1] === "[]")
      return "Array<" + stringifyDefinition(value[0]) + ">";
    if (value.length === 3 && (value[1] === "|" || value[1] === "&"))
      return stringifyDefinition(value[0]) + " " + value[1] + " " + stringifyDefinition(value[2]);
    return "[" + value.map(stringifyDefinition).join(", ") + "]";
  }
  if (isObjectLike(value))
    return (
      "{ " +
      Object.entries(value)
        .map(([k, v]) => `${k}: ${stringifyDefinition(v)}`)
        .join("; ") +
      " }"
    );
  return String(value);
};
const prettifiedDefinitionOf = (type: unknown): unknown => {
  if (!isObject(type)) return type;
  if (!("definition" in type)) return type;

  const { definition } = type;

  if (isType(definition)) return prettifiedDefinitionOf(definition);

  if (Array.isArray(definition))
    if (definition.length === 3 && ["|>", ":"].includes(definition[1])) {
      return [prettifiedDefinitionOf(definition[0]), definition[1], definition[2]];
    } else if (definition.length === 3 && definition[1] === "=>") {
      if (isRecordSchema(definition[2])) {
        const propDefinition = prettifiedDefinitionOf(definition[2].$meta.propSchema);
        const valueDefinition = prettifiedDefinitionOf(definition[2].$meta.valueSchema);
        if (typeof propDefinition === "string" && typeof valueDefinition === "string")
          return `Record<${propDefinition}, ${valueDefinition}>`;
        return ["record", propDefinition, valueDefinition];
      }
      return [prettifiedDefinitionOf(definition[0]), definition[1], definition[2]];
    } else if (definition.length === 2 && definition[1] === "[]") {
      const innerDefinition = prettifiedDefinitionOf(definition[0]);
      return typeof innerDefinition === "string" ?
          "Array<" + innerDefinition + ">"
        : [innerDefinition, "[]"];
    } else if (definition.length === 2 && ["instanceOf", "keyOf", "==="].includes(definition[0])) {
      return [definition[0], prettifiedDefinitionOf(definition[1])];
    } else if (definition.length === 3 && ["&", "|"].includes(definition[1])) {
      return [
        prettifiedDefinitionOf(definition[0]),
        definition[1],
        prettifiedDefinitionOf(definition[2]),
      ];
    } else {
      const definitions = definition.map(prettifiedDefinitionOf);
      if (definitions.every((d) => typeof d === "string"))
        return "[" + definitions.join(", ") + "]";
      return definitions;
    }

  if (isObjectLike(definition))
    return Object.fromEntries(
      Object.entries(definition).map(([key, value]) => [key, prettifiedDefinitionOf(value)]),
    );

  return definition;
};
