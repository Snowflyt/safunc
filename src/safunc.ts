import { type } from "arktype";

import { isType, stringifyDefinitionOf } from "./utils/ark";
import { isObject } from "./utils/assertions";
import { humanizeNaturalNumbers, ordinal, range } from "./utils/number";
import { capitalize } from "./utils/string";

import type { Eq, Fn } from "./tools/common";
import type { LabeledBy } from "./tools/labeled-tuple";
import type { NameParams } from "./tools/name-params";
import type { AsIn, AsOut, InferDefinition, ValidateDefinition } from "./utils/ark";
import type { Type } from "arktype";

/**
 * Validate Arktype definitions for function parameters.
 * Handle optional parameters (starts with "?").
 */
type ValidateParamDefinition<Def> =
  // Handle optional parameters (starts with "?")
  Def extends `?${infer Def}` ? `?${ValidateDefinition<Def>}`
  : // Provide better intellisense for "?" (optional parameters)
  Def extends "?" ? `?${ValidateDefinition<"">}`
  : ValidateDefinition<Def>;

/**
 * Infer types of function parameters from Arktype definitions.
 * Handle optional parameters (starts with "?").
 */
type InferParamsDefinition<Defs extends any[]> =
  Defs extends [infer H, ...infer T] ? [..._InferParamsDefinition<H>, ...InferParamsDefinition<T>]
  : [];
type _InferParamsDefinition<Def> =
  // HACK: Use labeled tuple type to make TS aware of optional function parameters.
  Def extends `?${infer Def}` ? [optionalArg?: InferDefinition<Def>]
  : Def extends Optional<infer Def> ? [optionalArg?: InferDefinition<Def>]
  : [InferDefinition<Def>];

/**
 * An Arktype schema representing an untyped function return type.
 * Clarify it with the `untyped` interface.
 */
const untyped: Type<unknown> = Object.assign(type("unknown"), { _tag: "untyped" });
/**
 * Judge if the given schema is the `untyped` schema.
 * @param schema The schema.
 * @returns
 */
const isUntyped = (schema: unknown) =>
  isObject(schema) && "_tag" in schema && schema._tag === "untyped";

declare const untypedSymbol: unique symbol;
/**
 * A placeholder type to represent the untyped return type of a function.
 */
export interface untyped {
  [untypedSymbol]: void;
}
/**
 * If the given type is `untyped`, return `Then`, otherwise return `Else`.
 */
type IfUntyped<T, Then, Else = T> = Eq<T, untyped> extends true ? Then : Else;
/**
 * Replace the return type of a function with `R` if it is `untyped`, otherwise keep it.
 */
type RefineUntyped<F extends Fn, R> = IfUntyped<ReturnType<F>, (...args: Parameters<F>) => R, F>;
/**
 * Return `any` if all return type of `FS` are `untyped`, otherwise return the common return type
 * with `untyped` excluded.
 */
type FInReturn<FS extends Fn[]> =
  { [K in keyof FS]: ReturnType<FS[K]> }[number] extends infer R ?
    IfUntyped<R, any, Exclude<R, untyped>>
  : never;

declare const sigSymbol: unique symbol;
/**
 * Signature of a function that can be used at runtime to validate function arguments and return.
 * @see {@link sig}
 */
export interface Sig<out F extends Fn> extends SigInOut<F, F> {}
/**
 * {@link Sig} when Arktype morphs are considered.
 *
 * `FIn` is the type of function inside `def` for implementation,
 * while `FOut` is the return type of `def`.
 */
export interface SigInOut<out FIn extends Fn, out FOut extends Fn> {
  [sigSymbol]: [FIn, FOut];

  $parameterSchemas: readonly (Type<unknown> | Optional<Type<unknown>>)[];
  $returnSchema: Type<unknown>;

  $availableArgumentLengths: readonly number[];

  toString: () => string;
}

type AsOutAll<TS extends unknown[]> =
  { [K in keyof TS]: AsOut<TS[K]> } extends infer R extends unknown[] ? R : never;
type AsInAll<TS extends unknown[]> =
  { [K in keyof TS]: AsIn<TS[K]> } extends infer R extends unknown[] ? R : never;

/**
 * Make type information of {@link SigInOut} more readable by labeling the parameters,
 * and simplify it to {@link Sig} if possible.
 */
type ReadableSig<Params extends unknown[], Return> =
  Eq<[AsOutAll<Params>, AsOut<Return>], [Params, Return]> extends true ?
    Sig<(...args: NameParams<Params>) => Return>
  : SigInOut<
      (...args: NameParams<AsOutAll<Params>>) => AsIn<Return>,
      (...args: NameParams<AsInAll<Params>>) => AsOut<Return>
    >;

/**
 * Factory to create a {@link Sig}.
 */
type SigBuilder = {
  /* With return type */
  <const ParamDef1, const ParamDef2, const ParamDef3, const ParamDef4, const ReturnDef>(
    paramDef1: ValidateParamDefinition<ParamDef1>,
    paramDef2: ValidateParamDefinition<ParamDef2>,
    paramDef3: ValidateParamDefinition<ParamDef3>,
    paramDef4: ValidateParamDefinition<ParamDef4>,
    _: "=>",
    returnDef: ValidateDefinition<ReturnDef>,
  ): ReadableSig<
    InferParamsDefinition<[ParamDef1, ParamDef2, ParamDef3, ParamDef4]>,
    InferDefinition<ReturnDef>
  >;
  <const ParamDef1, const ParamDef2, const ParamDef3, const ReturnDef>(
    paramDef1: ValidateParamDefinition<ParamDef1>,
    paramDef2: ValidateParamDefinition<ParamDef2>,
    paramDef3: ValidateParamDefinition<ParamDef3>,
    _: "=>",
    returnDef: ValidateDefinition<ReturnDef>,
  ): ReadableSig<
    InferParamsDefinition<[ParamDef1, ParamDef2, ParamDef3]>,
    InferDefinition<ReturnDef>
  >;
  <const ParamDef1, const ParamDef2, const ReturnDef>(
    paramDef1: ValidateParamDefinition<ParamDef1>,
    paramDef2: ValidateParamDefinition<ParamDef2>,
    _: "=>",
    returnDef: ValidateDefinition<ReturnDef>,
  ): ReadableSig<InferParamsDefinition<[ParamDef1, ParamDef2]>, InferDefinition<ReturnDef>>;
  <const ParamDef1, const ReturnDef>(
    paramDef1: ValidateParamDefinition<ParamDef1>,
    _: "=>",
    returnDef: ValidateDefinition<ReturnDef>,
  ): ReadableSig<[InferDefinition<ParamDef1>], InferDefinition<ReturnDef>>;
  <const ReturnDef>(
    _: "=>",
    returnDef: ValidateDefinition<ReturnDef>,
  ): ReadableSig<[], InferDefinition<ReturnDef>>;

  /* Without return type */
  <const ParamDef1, const ParamDef2, const ParamDef3, const ParamDef4>(
    paramDef1: ValidateParamDefinition<ParamDef1>,
    paramDef2: ValidateParamDefinition<ParamDef2>,
    paramDef3: ValidateParamDefinition<ParamDef3>,
    paramDef4: ValidateParamDefinition<ParamDef4>,
  ): ReadableSig<InferParamsDefinition<[ParamDef1, ParamDef2, ParamDef3, ParamDef4]>, untyped>;
  <const ParamDef1, const ParamDef2, const ParamDef3>(
    paramDef1: ValidateParamDefinition<ParamDef1>,
    paramDef2: ValidateParamDefinition<ParamDef2>,
    paramDef3: ValidateParamDefinition<ParamDef3>,
  ): ReadableSig<InferParamsDefinition<[ParamDef1, ParamDef2, ParamDef3]>, untyped>;
  <const ParamDef1, const ParamDef2>(
    paramDef1: ValidateParamDefinition<ParamDef1>,
    paramDef2: ValidateParamDefinition<ParamDef2>,
  ): ReadableSig<InferParamsDefinition<[ParamDef1, ParamDef2]>, untyped>;
  <const ParamDef1>(
    paramDef1: ValidateParamDefinition<ParamDef1>,
  ): ReadableSig<[InferDefinition<ParamDef1>], untyped>;
};

const optionalSymbol = Symbol("optional");
/**
 * A type to represent an optional parameter.
 */
export interface Optional<T> {
  [optionalSymbol]: T;
}
/**
 * Mark a parameter definition as optional.
 * @param def The parameter definition.
 * @returns
 *
 * @example
 * ```typescript
 * const repeat = def(
 *   sig("string", optional({ "n?": "integer>0" }), "=>", "string"),
 *   (s, { n = 2 } = {}) => s.repeat(n),
 * );
 * ```
 */
export const optional = <Def>(def: ValidateDefinition<Def>): Optional<Def> => ({
  [optionalSymbol]: def as Def,
});
/**
 * Judge whether the input is an optional parameter.
 * @param x The input to judge.
 * @returns
 */
const isOptional = <T>(x: unknown): x is Optional<T> => isObject(x) && optionalSymbol in x;

/**
 * Create a function signature that can be used to validate function arguments at runtime.
 *
 * Usually used with {@link def}.
 *
 * @example
 * ```typescript
 * const s1 = sig("number", "number", "=>", "number");
 * //    ^?: Sig<(n: number, m: number) => number>
 * const s2 = sig("number", "number");
 * //    ^?: Sig<(n: number, m: number) => untyped>
 * const s3 = sig("string", "?boolean", "?integer>0", "=>", "integer[]");
 * //    ^?: Sig<(s: string, b?: boolean, n?: number) => number[]>
 * ```
 *
 * @see {@link def} for usage examples.
 */
export const sig: SigBuilder = (...args: unknown[]) => {
  const [paramDefs, returnDef] = (() => {
    if (args.indexOf("=>") === -1) return [args, untyped];
    const idx = args.indexOf("=>");
    return [args.slice(0, idx), args[idx + 1]];
  })();

  const $parameterSchemas: (Type<unknown> | Optional<Type<unknown>>)[] = paramDefs.map((def) => {
    if (isType(def) || (isOptional(def) && isType(def[optionalSymbol])))
      return def as Type<unknown> | Optional<Type<unknown>>;
    if (typeof def === "string" && def.startsWith("?")) def = optional(def.slice(1) as never);
    if (isOptional(def)) return optional(type(def[optionalSymbol] as never));
    return type(def as never);
  });
  const $returnSchema: Type<unknown> = isType(returnDef) ? returnDef : type(returnDef as never);

  const firstOptionalIdx = $parameterSchemas.findIndex(isOptional);
  const $availableArgumentLengths: number[] =
    firstOptionalIdx === -1 ?
      [$parameterSchemas.length]
    : range(firstOptionalIdx, $parameterSchemas.length + 1);

  return {
    ...({} as { [sigSymbol]: [any, any] }),

    $parameterSchemas,
    $returnSchema,

    $availableArgumentLengths,

    toString: () => {
      let res = "(";
      res += $parameterSchemas
        .map((s) =>
          isType(s) ? stringifyDefinitionOf(s) : "?" + stringifyDefinitionOf(s[optionalSymbol]),
        )
        .join(", ");
      res += ")";
      if (!isUntyped($returnSchema)) res += `: ${stringifyDefinitionOf($returnSchema)}`;
      return res;
    },
  } satisfies Sig<any>;
};

/**
 * A safe function with parameters and (optionally) return type validation.
 */
// @ts-expect-error - 'F' could be instantiated with a different subtype of constraint 'Fn'
export interface Safunc<F extends Fn> extends F {
  /**
   * Signatures of the function.
   */
  $sigs: readonly Sig<any>[];
  /**
   * The original function without type validation.
   *
   * The type is not auto inferred due to considerations of Arktype `morph`s.
   */
  $fn: Fn;

  /**
   * Remove helper methods and return the original function (validations are still kept).
   */
  unwrap: () => F;

  /**
   * Get the matched `Sig` for given arguments.
   * @param args Arguments to match.
   * @returns
   * @throws {TypeError} If no signature matches the given arguments.
   */
  matchArguments: (...args: unknown[]) => Sig<any> | null;
  /**
   * Assert given arguments are valid for the function.
   * @param args Arguments to validate.
   * @throws {TypeError} If given arguments are invalid.
   */
  assertArguments: (...args: unknown[]) => void;

  /**
   * Check if the function allows the given arguments.
   * @param args Arguments to check.
   * @returns
   */
  allowArguments: (...args: unknown[]) => boolean;
}

/**
 * Create a type-safe function with runtime parameters and (optionally) return type validation.
 * @returns
 *
 * @example
 * ```typescript
 * const add = def(sig("number", "number", "=>", "number"), (n, m) => n + m);
 * //    ^?: Safunc<(n: number, m: number) => number>
 * add(1, 2); // => 3
 * add("foo", 2); // !TypeError: The 1st argument of 'function(number, number): number' must be a number (was string)
 *
 * // Or omit the return type if you don't want to validate it
 * const add = def(sig("number", "number"), (n, m) => n + m);
 * //    ^?: Safunc<(n: number, m: number) => number>
 * add(1, "foo"); // !TypeError: The 2nd argument of 'function(number, number)' must be a number (was string)
 * ```
 *
 * @example
 * ```typescript
 * // Support for optional parameters and overloaded signatures
 * // Optional parameters are marked with a question mark (`?`) before the type,
 * // or use the `optional` helper function if it is not a plain string (e.g. `optional({ foo: "string" })`).
 * const range = def(
 *   //  ^?: Safunc<((n: number) => number[]) & ((n1: number, n2: number, n3?: number) => number[])
 *   sig("integer", "=>", "integer[]"),
 *   sig("integer", "integer", "?integer>0|integer<0", "=>", "integer[]"),
 *   function range(startOrStop, stop?, step = 1) {
 *     //                        ^^^^^
 *     // The `?` is required to make the function compatible with given signatures in TypeScript
 *     const start = stop === undefined ? 0 : startOrStop;
 *     stop ??= startOrStop;
 *     const res: number[] = [];
 *     if (step > 0) for (let i = start; i < end; i += step) res.push(i);
 *     else for (let i = start; i > end; i += step) res.push(i);
 *     return res;
 *   },
 * );
 *
 * // Use `as Sig<...>` to provide more readable type information
 * const range = def(
 *   //  ^?: Safunc<((stop: number) => number[]) & ((start: number, stop: number, step?: number) => number[])>
 *   sig("integer", "=>", "integer[]") as Sig<(stop: number) => number[]>,
 *   sig("integer", "integer", "?integer>0|integer<0", "=>", "integer[]") as Sig<
 *     (start: number, stop: number, step?: number) => number[]
 *   >,
 *   function range(startOrStop, stop?, step = 1) {
 *     // ...
 *   },
 * );
 * ```
 */
export const def: {
  <FIn extends Fn, FOut extends Fn, F extends RefineUntyped<FIn, any>>(
    sig: SigInOut<FIn, FOut>,
    fn: F,
  ): Safunc<
    (
      ...args: LabeledBy<Parameters<F>, Parameters<FOut>>
    ) => IfUntyped<ReturnType<FOut>, ReturnType<F>>
  >;
  // prettier-ignore
  <FIn1 extends Fn, FOut1 extends Fn, FIn2 extends Fn, FOut2 extends Fn, F extends (...args: Parameters<FIn1> | Parameters<FIn2>) => FInReturn<[FIn1, FIn2]>>(sig1: SigInOut<FIn1, FOut1>, sig2: SigInOut<FIn2, FOut2>, fn: F): Safunc<RefineUntyped<FOut1, ReturnType<F>> & RefineUntyped<FOut2, ReturnType<F>>>;
  // prettier-ignore
  <FIn1 extends Fn, FOut1 extends Fn, FIn2 extends Fn, FOut2 extends Fn, FIn3 extends Fn, FOut3 extends Fn, F extends (...args: Parameters<FIn1> | Parameters<FIn2> | Parameters<FIn3>) => FInReturn<[FIn1, FIn2, FIn3]>>(sig1: SigInOut<FIn1, FOut1>, sig2: SigInOut<FIn2, FOut2>, sig3: SigInOut<FIn3, FOut3>, fn: F): Safunc<RefineUntyped<FOut1, ReturnType<F>> & RefineUntyped<FOut2, ReturnType<F>> & RefineUntyped<FOut3, ReturnType<F>>>;
  // prettier-ignore
  <FIn1 extends Fn, FOut1 extends Fn, FIn2 extends Fn, FOut2 extends Fn, FIn3 extends Fn, FOut3 extends Fn, FIn4 extends Fn, FOut4 extends Fn, F extends (...args: Parameters<FIn1> | Parameters<FIn2> | Parameters<FIn3> | Parameters<FIn4>) => FInReturn<[FIn1, FIn2, FIn3, FIn4]>>(sig1: SigInOut<FIn1, FOut1>, sig2: SigInOut<FIn2, FOut2>, sig3: SigInOut<FIn3, FOut3>, sig4: SigInOut<FIn4, FOut4>, fn: F): Safunc<RefineUntyped<FOut1, ReturnType<F>> & RefineUntyped<FOut2, ReturnType<F>> & RefineUntyped<FOut3, ReturnType<F>> & RefineUntyped<FOut4, ReturnType<F>>>;
  // prettier-ignore
  <FIn1 extends Fn, FOut1 extends Fn, FIn2 extends Fn, FOut2 extends Fn, FIn3 extends Fn, FOut3 extends Fn, FIn4 extends Fn, FOut4 extends Fn, FIn5 extends Fn, FOut5 extends Fn, F extends (...args: Parameters<FIn1> | Parameters<FIn2> | Parameters<FIn3> | Parameters<FIn4> | Parameters<FIn5>) => FInReturn<[FIn1, FIn2, FIn3, FIn4, FIn5]>>(sig1: SigInOut<FIn1, FOut1>, sig2: SigInOut<FIn2, FOut2>, sig3: SigInOut<FIn3, FOut3>, sig4: SigInOut<FIn4, FOut4>, sig5: SigInOut<FIn5, FOut5>, fn: F): Safunc<RefineUntyped<FOut1, ReturnType<F>> & RefineUntyped<FOut2, ReturnType<F>> & RefineUntyped<FOut3, ReturnType<F>> & RefineUntyped<FOut4, ReturnType<F>> & RefineUntyped<FOut5, ReturnType<F>>>;
  // prettier-ignore
  <FIn1 extends Fn, FOut1 extends Fn, FIn2 extends Fn, FOut2 extends Fn, FIn3 extends Fn, FOut3 extends Fn, FIn4 extends Fn, FOut4 extends Fn, FIn5 extends Fn, FOut5 extends Fn, FIn6 extends Fn, FOut6 extends Fn, F extends (...args: Parameters<FIn1> | Parameters<FIn2> | Parameters<FIn3> | Parameters<FIn4> | Parameters<FIn5> | Parameters<FIn6>) => FInReturn<[FIn1, FIn2, FIn3, FIn4, FIn5, FIn6]>>(sig1: SigInOut<FIn1, FOut1>, sig2: SigInOut<FIn2, FOut2>, sig3: SigInOut<FIn3, FOut3>, sig4: SigInOut<FIn4, FOut4>, sig5: SigInOut<FIn5, FOut5>, sig6: SigInOut<FIn6, FOut6>, fn: F): Safunc<RefineUntyped<FOut1, ReturnType<F>> & RefineUntyped<FOut2, ReturnType<F>> & RefineUntyped<FOut3, ReturnType<F>> & RefineUntyped<FOut4, ReturnType<F>> & RefineUntyped<FOut5, ReturnType<F>> & RefineUntyped<FOut6, ReturnType<F>>>;
  // prettier-ignore
  <FIn1 extends Fn, FOut1 extends Fn, FIn2 extends Fn, FOut2 extends Fn, FIn3 extends Fn, FOut3 extends Fn, FIn4 extends Fn, FOut4 extends Fn, FIn5 extends Fn, FOut5 extends Fn, FIn6 extends Fn, FOut6 extends Fn, FIn7 extends Fn, FOut7 extends Fn, F extends (...args: Parameters<FIn1> | Parameters<FIn2> | Parameters<FIn3> | Parameters<FIn4> | Parameters<FIn5> | Parameters<FIn6> | Parameters<FIn7>) => FInReturn<[FIn1, FIn2, FIn3, FIn4, FIn5, FIn6, FIn7]>>(sig1: SigInOut<FIn1, FOut1>, sig2: SigInOut<FIn2, FOut2>, sig3: SigInOut<FIn3, FOut3>, sig4: SigInOut<FIn4, FOut4>, sig5: SigInOut<FIn5, FOut5>, sig6: SigInOut<FIn6, FOut6>, sig7: SigInOut<FIn7, FOut7>, fn: F): Safunc<RefineUntyped<FOut1, ReturnType<F>> & RefineUntyped<FOut2, ReturnType<F>> & RefineUntyped<FOut3, ReturnType<F>> & RefineUntyped<FOut4, ReturnType<F>> & RefineUntyped<FOut5, ReturnType<F>> & RefineUntyped<FOut6, ReturnType<F>> & RefineUntyped<FOut7, ReturnType<F>>>;
  // prettier-ignore
  <FIn1 extends Fn, FOut1 extends Fn, FIn2 extends Fn, FOut2 extends Fn, FIn3 extends Fn, FOut3 extends Fn, FIn4 extends Fn, FOut4 extends Fn, FIn5 extends Fn, FOut5 extends Fn, FIn6 extends Fn, FOut6 extends Fn, FIn7 extends Fn, FOut7 extends Fn, FIn8 extends Fn, FOut8 extends Fn, F extends (...args: Parameters<FIn1> | Parameters<FIn2> | Parameters<FIn3> | Parameters<FIn4> | Parameters<FIn5> | Parameters<FIn6> | Parameters<FIn7> | Parameters<FIn8>) => FInReturn<[FIn1, FIn2, FIn3, FIn4, FIn5, FIn6, FIn7, FIn8]>>(sig1: SigInOut<FIn1, FOut1>, sig2: SigInOut<FIn2, FOut2>, sig3: SigInOut<FIn3, FOut3>, sig4: SigInOut<FIn4, FOut4>, sig5: SigInOut<FIn5, FOut5>, sig6: SigInOut<FIn6, FOut6>, sig7: SigInOut<FIn7, FOut7>, sig8: SigInOut<FIn8, FOut8>, fn: F): Safunc<RefineUntyped<FOut1, ReturnType<F>> & RefineUntyped<FOut2, ReturnType<F>> & RefineUntyped<FOut3, ReturnType<F>> & RefineUntyped<FOut4, ReturnType<F>> & RefineUntyped<FOut5, ReturnType<F>> & RefineUntyped<FOut6, ReturnType<F>> & RefineUntyped<FOut7, ReturnType<F>> & RefineUntyped<FOut8, ReturnType<F>>>;
} = ((...args: unknown[]) => {
  const sigs = args.slice(0, -1) as Sig<any>[];
  const fn = args[args.length - 1] as Fn;

  let $matchedMorphedArguments: unknown[] = [];
  const matchArguments = (...args: unknown[]): Sig<any> => {
    const availableArgumentLengths = [
      ...new Set([...sigs.flatMap((sig) => sig.$availableArgumentLengths)]),
    ].sort();
    if (!availableArgumentLengths.includes(args.length)) {
      const message = `Expected ${humanizeNaturalNumbers(availableArgumentLengths)} arguments, but got ${args.length}`;
      throw new TypeError(message);
    }

    const sigAndMessages: [Sig<any>, string][] = [];
    for (let overloadIdx = 0; overloadIdx < sigs.length; overloadIdx++) {
      const sig = sigs[overloadIdx]!;
      const { $availableArgumentLengths, $parameterSchemas } = sig;
      if (!$availableArgumentLengths.includes(args.length)) {
        sigAndMessages.push([sig, "ARG_LENGTH_NOT_MATCH"]);
        continue;
      }
      const morphedArgs: unknown[] = [];
      for (let i = 0; i < args.length; i++) {
        let validator = $parameterSchemas[i];
        if (!validator) continue;
        if (isOptional(validator)) validator = validator[optionalSymbol];
        const { data, problems } = validator(args[i]);
        if (!problems) {
          morphedArgs.push(data);
          continue;
        }
        const problem = problems[0]!;
        const reason = problem.reason;
        let message = "";
        // If the message is not just the reason
        if (problem.message.length !== reason.length) {
          let prefix = problem.message.toLowerCase().slice(0, -reason.length).trim();
          // If it is likely a property name (contains no space and is not a number)
          if (!prefix.includes(" ") && isNaN(Number(prefix))) prefix = `Property '${prefix}'`;
          message += prefix + " of ";
        }
        message += `the ${ordinal(i + 1)} argument of 'function`;
        // If function has a name
        if (fn.name) message += ` ${fn.name}`;
        message += sig.toString() + "' ";
        if (sigs.length > 1) message += `(overload ${overloadIdx + 1} of ${sigs.length}) `;
        message += reason;
        message = capitalize(message);
        sigAndMessages.push([sig, message]);
        break;
      }
      if (!sigAndMessages[overloadIdx]) {
        $matchedMorphedArguments = morphedArgs;
        return sig;
      }
    }

    const errors = sigAndMessages
      .map(([sig, message], i) => ({ i, sig, message }))
      .filter(({ message: m }) => m !== "ARG_LENGTH_NOT_MATCH");

    if (errors.length === 1) throw new TypeError(errors[0]!.message);

    let message = "No overload ";
    if (fn.name) message += `of function '${fn.name}' `;
    message += "matches this call.\n";
    for (const { i, message: m, sig } of errors) {
      message += `  Overload ${i + 1} of ${sigs.length}, '${sig.toString()}', gave the following error.\n`;
      message +=
        "    " +
        m.replace(/argument of 'function.+?'( \(overload \d+ of \d+\))?/g, "argument") +
        "\n";
    }
    message = message.trimEnd();
    throw new TypeError(message);
  };

  const assertReturn = (sig: Sig<any>, r: unknown) => {
    const { data, problems } = sig.$returnSchema(r);
    if (!problems) return data;
    const problem = problems[0]!;
    const reason = problem.reason;
    let message = "";
    // If the message is not just the reason
    if (problem.message.length !== reason.length) {
      let prefix = problem.message.toLowerCase().slice(0, -reason.length).trim();
      // If it is likely a property name (contains no space and is not a number)
      if (!prefix.includes(" ") && isNaN(Number(prefix))) prefix = `Property '${prefix}'`;
      message += prefix + " of ";
    }
    message += "the return value of 'function";
    // If function has a name
    if (fn.name) message += ` ${fn.name}`;
    message += sig.toString() + "' ";
    if (sigs.length > 1) message += `(overload ${sigs.indexOf(sig) + 1} of ${sigs.length}) `;
    message += reason;
    message = capitalize(message);
    throw new TypeError(message);
  };

  const f = (...args: never[]) => {
    const matchedSig = matchArguments(...args);
    return assertReturn(matchedSig, fn(...($matchedMorphedArguments as never[])));
  };

  // Keep the name of the function for better error messages
  Object.defineProperty(f, "name", { value: fn.name });

  const res = f.bind(null);
  Object.defineProperty(res, "name", { value: fn.name });

  Object.assign(res, {
    $sigs: sigs,
    $fn: fn,

    unwrap: () => f,

    matchArguments: (...args: unknown[]) => {
      try {
        return matchArguments(...args);
      } catch (e) {
        return null;
      }
    },
    assertArguments: (...args: unknown[]) => {
      matchArguments(...args);
    },

    allowArguments: (...args: unknown[]) => {
      try {
        matchArguments(...args);
        return true;
      } catch {
        return false;
      }
    },
  } satisfies Safunc<any>);

  return res;
}) as never;
