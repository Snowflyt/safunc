import { morph } from "arktype";
import { equal, expect, test } from "typroof";

import { def, optional, sig } from "../src";

import type { Safunc, Sig } from "../src";

test("introduction", () => {
  const add1 = def(sig("number", "number", "=>", "number"), (n, m) => n + m);
  //    ^?
  expect(add1).to(equal<Safunc<(n: number, m: number) => number>>);

  const add2 = def(sig("number", "number"), (n, m) => n + m);
  //    ^?
  expect(add2).to(equal<Safunc<(n: number, m: number) => number>>);

  const repeatString = def(
    //  ^?
    sig("string", optional({ "n?": "integer>0" }), "=>", "string"),
    (s, { n = 2 } = {}) => s.repeat(n),
  );
  expect(repeatString).to(equal<Safunc<(s: string, args_1?: { n?: number }) => string>>);

  const addIntegers = def(sig("integer", "integer", "=>", "integer"), function add(n, m) {
    //  ^?
    return n + m + 0.5;
  });
  expect(addIntegers).to(equal<Safunc<(n: number, m: number) => number>>);
});

test("optional parameters", () => {
  const range1 = def(
    //  ^?
    sig("integer", optional("integer"), optional("integer>0"), "=>", "integer[]"),
    function range(startOrStop, stop, step = 1) {
      const start = stop === undefined ? 0 : startOrStop;
      stop ??= startOrStop;
      return Array.from({ length: Math.ceil((stop - start) / step) }, (_, i) => start + i * step);
    },
  );
  expect(range1).to(equal<Safunc<(startOrStop: number, stop?: number, step?: number) => number[]>>);

  const range2 = def(
    //  ^?
    sig("integer", "?integer", "?integer>0", "=>", "integer[]"),
    function range(startOrStop, stop, step = 1) {
      const start = stop === undefined ? 0 : startOrStop;
      stop ??= startOrStop;
      return Array.from({ length: Math.ceil((stop - start) / step) }, (_, i) => start + i * step);
    },
  );
  expect(range2).to(equal<Safunc<(startOrStop: number, stop?: number, step?: number) => number[]>>);
});

test("overloads", () => {
  const repeat = def(
    //  ^?
    sig("string", "=>", "string"),
    sig("integer>0", "string", "=>", "string"),
    function repeat(...args) {
      const [n, s] = args.length === 1 ? [2, args[0]] : args;
      return s.repeat(n);
    },
  );
  expect(repeat).to(equal<Safunc<((s: string) => string) & ((n: number, s: string) => string)>>);

  const concat = def(
    //  ^?
    sig("string", "string", "=>", "string"),
    sig("number", "number", "=>", "number"),
    (a, b) => (a as any) + (b as any),
  );
  expect(concat).to(
    equal<Safunc<((s1: string, s2: string) => string) & ((n: number, m: number) => number)>>,
  );

  const range1 = def(
    //  ^?
    sig("integer", "=>", "integer[]"),
    sig("integer", "integer", "?integer<0|integer>0", "=>", "integer[]"),
    function range(startOrStop, stop?, step = 1) {
      const start = stop === undefined ? 0 : startOrStop;
      stop ??= startOrStop;
      const res: number[] = [];
      if (step > 0) for (let i = start; i < stop; i += step) res.push(i);
      else for (let i = start; i > stop; i += step) res.push(i);
      return res;
    },
  );
  expect(range1).to(
    equal<Safunc<((n: number) => number[]) & ((n1: number, n2: number, n3?: number) => number[])>>,
  );

  const range2 = def(
    //  ^?
    sig("integer", "=>", "integer[]") as Sig<(stop: number) => number[]>,
    sig("integer", "integer", "?integer<0|integer>0", "=>", "integer[]") as Sig<
      (start: number, stop: number, step?: number) => number[]
    >,
    function range(startOrStop, stop?, step = 1) {
      const start = stop === undefined ? 0 : startOrStop;
      stop ??= startOrStop;
      const res: number[] = [];
      if (step > 0) for (let i = start; i < stop; i += step) res.push(i);
      else for (let i = start; i > stop; i += step) res.push(i);
      return res;
    },
  );
  expect(range2).to(
    equal<
      Safunc<
        ((stop: number) => number[]) & ((start: number, stop: number, step?: number) => number[])
      >
    >,
  );
});

test("morph", () => {
  const dateString = morph("string", (x, problems) =>
    isNaN(Date.parse(x)) ? problems.mustBe("a valid date") : new Date(x),
  );
  const isoDateString = morph("Date", (x) => x.toISOString().slice(0, 10));

  const addYears = def(
    //  ^?
    sig(dateString, "integer", "=>", isoDateString),
    function addYears(date, years) {
      //     ^?
      expect(date).to(equal<Date>);
      date.setFullYear(date.getFullYear() + years);
      return date;
    },
  );
  expect(addYears).to(equal<Safunc<(date: string, years: number) => string>>);
});

test("helper methods", () => {
  const sig1 = sig("integer", "=>", "integer[]") as Sig<(stop: number) => number[]>;
  const sig2 = sig("integer", "integer", "?integer>0", "=>", "integer[]") as Sig<
    (start: number, stop: number, step?: number) => number[]
  >;
  const range = def(sig1, sig2, (startOrStop, stop?, step = 1) => {
    const start = stop === undefined ? 0 : startOrStop;
    stop ??= startOrStop;
    return Array.from({ length: Math.ceil((stop - start) / step) }, (_, i) => start + i * step);
  });
  expect(range).to(
    equal<
      Safunc<
        ((stop: number) => number[]) & ((start: number, stop: number, step?: number) => number[])
      >
    >,
  );

  expect(range.unwrap()).to(
    equal<
      ((stop: number) => number[]) & ((start: number, stop: number, step?: number) => number[])
    >,
  );
});
