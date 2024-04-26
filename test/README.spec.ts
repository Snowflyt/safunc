/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable @typescript-eslint/ban-ts-comment */

import { morph } from "arktype";
import { expect, test } from "vitest";

import { def, optional, sig } from "../src";

import { trimIndent } from "@/utils/string";

test("introduction", () => {
  const add1 = def(sig("number", "number", "=>", "number"), (n, m) => n + m);
  expect(add1(1, 2)).toBe(3);
  expect(() =>
    // @ts-expect-error
    add1(1),
  ).toThrowError(new TypeError("Expected 2 arguments, but got 1"));
  expect(() =>
    add1(
      // @ts-expect-error
      "foo",
      2,
    ),
  ).toThrowError(
    new TypeError(
      "The 1st argument of 'function(number, number): number' must be a number (was string)",
    ),
  );

  const add2 = def(sig("number", "number"), (n, m) => n + m);
  expect(() =>
    add2(
      1,
      // @ts-expect-error
      "foo",
    ),
  ).toThrowError(
    new TypeError("The 2nd argument of 'function(number, number)' must be a number (was string)"),
  );

  const addIntegers = def(sig("integer", "integer", "=>", "integer"), function add(n, m) {
    return n + m + 0.5; // <- This will throw a TypeError
  });
  expect(() => addIntegers(1, 2)).toThrowError(
    new TypeError(
      "The return value of 'function add(integer, integer): integer' must be an integer (was 3.5)",
    ),
  );
});

test("optional parameters", () => {
  const range_ = def(
    sig("integer", optional("integer"), optional("integer>0"), "=>", "integer[]"),
    function range(startOrStop, stop, step = 1) {
      const start = stop === undefined ? 0 : startOrStop;
      stop ??= startOrStop;
      return Array.from({ length: Math.ceil((stop - start) / step) }, (_, i) => start + i * step);
    },
  );
  expect(range_(3)).toEqual([0, 1, 2]);
  expect(range_(1, 5)).toEqual([1, 2, 3, 4]);
  expect(() =>
    range_(
      1,
      // @ts-expect-error
      "foo",
    ),
  ).toThrowError(
    new TypeError(
      "The 2nd argument of 'function range(integer, ?integer, ?integer>0): Array<integer>' must be a number (was string)",
    ),
  );
  expect(() => range_(1, 5, -1)).toThrowError(
    new TypeError(
      "The 3rd argument of 'function range(integer, ?integer, ?integer>0): Array<integer>' must be more than 0 (was -1)",
    ),
  );

  const repeat = def(
    sig("string", optional({ "n?": "integer>0" }), "=>", "string"),
    (s, { n = 2 } = {}) => s.repeat(n),
  );
  expect(() =>
    repeat("foo", {
      n: 0.5,
    }),
  ).toThrowError(
    new TypeError(
      "Property 'n' of the 2nd argument of 'function(string, ?{ n?: integer>0 }): string' must be an integer (was 0.5)",
    ),
  );
});

test("overloads", () => {
  const repeatString = def(
    sig("string", "=>", "string"),
    sig("integer>0", "string", "=>", "string"),
    function repeat(...args) {
      const [n, s] = args.length === 1 ? [2, args[0]] : args;
      return s.repeat(n);
    },
  );
  expect(() =>
    // @ts-expect-error
    repeatString(),
  ).toThrowError(new TypeError("Expected 1-2 arguments, but got 0"));
  expect(repeatString("foo")).toBe("foofoo");
  expect(repeatString(3, "bar")).toBe("barbarbar");
  expect(() =>
    repeatString(
      // @ts-expect-error
      5,
    ),
  ).toThrowError(
    new TypeError(
      "The 1st argument of 'function repeat(string): string' (overload 1 of 2) must be a string (was number)",
    ),
  );

  const concat = def(
    sig("string", "string", "=>", "string"),
    sig("number", "number", "=>", "number"),
    (a, b) => (a as any) + (b as any),
  );
  expect(concat("foo", "bar")).toBe("foobar");
  expect(concat(1, 2)).toBe(3);
  expect(() =>
    // @ts-expect-error
    concat("foo", 42),
  ).toThrowError(
    new TypeError(
      trimIndent(`
        No overload matches this call.
          Overload 1 of 2, '(string, string): string', gave the following error.
            The 2nd argument must be a string (was number)
          Overload 2 of 2, '(number, number): number', gave the following error.
            The 1st argument must be a number (was string)
      `),
    ),
  );

  const range = def(
    sig("integer", "=>", "integer[]"),
    sig("integer", "integer", "?integer<0|integer>0", "=>", "integer[]"),
    (startOrStop, stop?, step = 1) => {
      const start = stop === undefined ? 0 : startOrStop;
      stop ??= startOrStop;
      const res: number[] = [];
      if (step > 0) for (let i = start; i < stop; i += step) res.push(i);
      else for (let i = start; i > stop; i += step) res.push(i);
      return res;
    },
  );
  expect(() =>
    // @ts-expect-error
    range(),
  ).toThrowError(new TypeError("Expected 1-3 arguments, but got 0"));
  expect(range(3)).toEqual([0, 1, 2]);
  expect(() =>
    range(
      1,
      // @ts-expect-error
      "2",
    ),
  ).toThrowError(
    new TypeError(
      "The 2nd argument of 'function(integer, integer, ?integer<0|integer>0): Array<integer>' (overload 2 of 2) must be a number (was string)",
    ),
  );
});

test("morph", () => {
  const stringifiablePrimitive = morph(
    "string | number | bigint | boolean | null | undefined",
    (x) => String(x),
  );
  expect(stringifiablePrimitive(42).data).toBe("42");
  expect(stringifiablePrimitive(Symbol("foo")).problems![0]!.message).toBe(
    "Must be a string, a number, a bigint, boolean, null or undefined (was (symbol foo))",
  );

  const dateString = morph("string", (x, problems) =>
    isNaN(Date.parse(x)) ? problems.mustBe("a valid date") : new Date(x),
  );
  expect(dateString("2024-04-26").data).toEqual(new Date("2024-04-26"));
  expect(dateString("foo").problems![0]!.message).toBe("Must be a valid date (was 'foo')");
  expect(dateString(42).problems![0]!.message).toBe("Must be a string (was number)");

  const isoDateString = morph("Date", (x) => x.toISOString().slice(0, 10));

  const addYears = def(
    sig(dateString, "integer", "=>", isoDateString),
    function addYears(date, years) {
      date.setFullYear(date.getFullYear() + years);
      return date;
    },
  );
  expect(addYears("2024-04-26", 1)).toBe("2025-04-26");
});

test("helper methods", () => {
  const sig1 = sig("integer", "=>", "integer[]");
  const sig2 = sig("integer", "integer", "?integer>0", "=>", "integer[]");
  const range = def(sig1, sig2, (startOrStop, stop?, step = 1) => {
    const start = stop === undefined ? 0 : startOrStop;
    stop ??= startOrStop;
    return Array.from({ length: Math.ceil((stop - start) / step) }, (_, i) => start + i * step);
  });

  expect(range.matchArguments(3)).toBe(sig1);
  expect(range.matchArguments(1, 5)).toBe(sig2);
  expect(range.matchArguments("foo")).toBe(null);

  expect(() => range.assertArguments(1, 5)).not.toThrow();
  expect(() => range.assertArguments("foo")).toThrowError(
    new TypeError(
      "The 1st argument of 'function(integer): Array<integer>' (overload 1 of 2) must be a number (was string)",
    ),
  );

  expect(range.allowArguments(1, 5)).toBe(true);
  expect(range.allowArguments("foo")).toBe(false);
});
