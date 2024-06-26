/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable @typescript-eslint/ban-ts-comment */

import { arrayOf, morph, type } from "arktype";
import { equal, error, expect, it, test } from "typroof";

import { def, defAsync, sig } from "./safunc";

import type { Safunc, Sig } from "./safunc";

it("should infer signatures of simple functions correctly", () => {
  const add1 = def(sig("number", "number", "=>", "number"), (n, m) => n + m);
  expect(add1).to(equal<Safunc<(n: number, m: number) => number>>);
  // @ts-expect-error
  expect(add1(42, "foo")).to(error);

  const add2 = def(sig("number", "number"), (n, m) => n + m);
  expect(add2).to(equal<Safunc<(n: number, m: number) => number>>);
});

it("should infer signatures of functions with optional parameters correctly", () => {
  const range = def(
    //  ^?
    sig("integer", "?integer", "?integer>0", "=>", "integer[]"),
    function range(startOrStop, stop, step = 1) {
      const start = stop === undefined ? 0 : startOrStop;
      stop ??= startOrStop;
      return Array.from({ length: Math.ceil((stop - start) / step) }, (_, i) => start + i * step);
    },
  );
  expect(range).to(equal<Safunc<(startOrStop: number, stop?: number, step?: number) => number[]>>);
  // @ts-expect-error
  range(42, "foo");
});

it("should infer signatures of functions with overloads correctly", () => {
  const range1 = def(
    //  ^?
    sig("integer", "=>", "integer[]"),
    sig("integer", "integer", "?integer<0|integer>0", "=>", "integer[]"),
    function range(startOrStop, stop?, step = 1) {
      //     ^?
      const [start, end] = (() => {
        if (stop === undefined) return [0, startOrStop];
        return [startOrStop, stop];
      })();

      const res: number[] = [];
      if (step > 0) for (let i = start; i < end; i += step) res.push(i);
      else for (let i = start; i > end; i += step) res.push(i);
      return res;
    },
  );
  expect(range1).to(
    equal<
      Safunc<
        ((n: number) => number[]) & ((n1: number, n2: number, n3?: number | undefined) => number[])
      >
    >,
  );

  const range2 = def(
    //  ^?
    sig("integer", "=>", "integer[]") as Sig<(stop: number) => number[]>,
    sig("integer", "integer", "?integer>0|integer<0", "=>", "integer[]") as Sig<
      (start: number, stop: number, step?: number) => number[]
    >,
    function range(startOrStop, stop?, step = 1) {
      const [start, end] = (() => {
        if (stop === undefined) return [0, startOrStop];
        return [startOrStop, stop];
      })();

      const res: number[] = [];
      if (step > 0) for (let i = start; i < end; i += step) res.push(i);
      else for (let i = start; i > end; i += step) res.push(i);
      return res;
    },
  );
  expect(range2).to(
    equal<
      Safunc<
        ((stop: number) => number[]) &
          ((start: number, stop: number, step?: number | undefined) => number[])
      >
    >,
  );

  const makeDate1 = def(
    //  ^?
    sig("string"),
    sig("integer>=0", "1<=integer<=12", "1<=integer<=31"),
    function makeDate(yOrIsoString, m?, d?) {
      if (typeof yOrIsoString === "string") return new Date(yOrIsoString);
      return new Date(yOrIsoString, m! - 1, d);
    },
  );
  expect(makeDate1).to(
    equal<Safunc<((isoString: string) => Date) & ((y: number, m: number, d: number) => Date)>>,
  );

  def(
    sig("string", "=>", "string"),
    sig("integer>=0", "1<=integer<=12", "1<=integer<=31"),
    // @ts-expect-error - Type 'Date' is not assignable to type 'string'
    function makeDate(yOrIsoString, m?, d?) {
      if (typeof yOrIsoString === "string") return new Date(yOrIsoString);
      return new Date(yOrIsoString, m! - 1, d);
    },
  );

  const makeDate2 = def(
    //  ^?
    sig("string", "=>", "Date"),
    sig("integer>=0", "1<=integer<=12", "1<=integer<=31"),
    function makeDate(yOrIsoString, m?, d?) {
      if (typeof yOrIsoString === "string") return new Date(yOrIsoString);
      return new Date(yOrIsoString, m! - 1, d);
    },
  );
  expect(makeDate2).to(
    equal<Safunc<((isoString: string) => Date) & ((y: number, m: number, d: number) => Date)>>,
  );
});

it("should infer signatures with Arktype morph types correctly", () => {
  const range = def(
    //  ^?
    sig("integer | parsedInteger", "?integer", "?integer>0|integer<0", "=>", "parsedInteger[]"),
    function range(startOrStop, stop?, step = 1) {
      const start = stop === undefined ? 0 : startOrStop;
      stop ??= startOrStop;
      return Array.from({ length: Math.ceil((stop - start) / step) }, (_, i) =>
        (start + i * step).toString(),
      );
    },
  );
  expect(range).to(
    equal<
      Safunc<
        (
          startOrStop: string | number,
          stop?: number | undefined,
          step?: number | undefined,
        ) => number[]
      >
    >,
  );

  const makeDate = def(
    //  ^?
    sig("string", "=>", "parsedDate"),
    sig("parsedInteger | integer>=0", "1<=integer<=12", "1<=integer<=31", "=>", "parsedDate"),
    function makeDate(yOrIsoString, m?, d?) {
      if (typeof yOrIsoString === "string") return new Date(yOrIsoString).toISOString();
      return new Date(yOrIsoString, m! - 1, d).toISOString();
    },
  );
  expect(makeDate).to(
    equal<Safunc<((s: string) => Date) & ((x: string | number, n: number, m: number) => Date)>>,
  );
});

it("should support zero-argument functions", () => {
  const now = def(sig("=>", "Date"), () => new Date());
  expect(now).to(equal<Safunc<() => Date>>);

  const date = def(
    sig("=>", "Date"),
    sig("string", "=>", "Date"),
    sig("integer>=0", "1<=integer<=12", "1<=integer<=31", "=>", "Date"),
    (yOrIsoString?, m?, d?) => {
      if (yOrIsoString === undefined) return new Date();
      if (typeof yOrIsoString === "string") return new Date(yOrIsoString);
      return new Date(yOrIsoString, m! - 1, d);
    },
  );
  expect(date).to(
    equal<
      Safunc<(() => Date) & ((s: string) => Date) & ((n1: number, n2: number, n3: number) => Date)>
    >,
  );

  const isoDateString = morph("Date", (date) => date.toISOString().slice(0, 10));

  const dateString = def(
    sig("=>", isoDateString),
    sig("integer>=0", "1<=integer<=12", "1<=integer<=31", "=>", isoDateString),
    (y?, m?, d?) => {
      if (y === undefined) return new Date();
      return new Date(y, m! - 1, d);
    },
  );
  expect(dateString).to(
    equal<Safunc<(() => string) & ((n1: number, n2: number, n3: number) => string)>>,
  );
});

it("should support asynchronous functions", () => {
  type Todo = typeof todo.infer;
  const todo = type({
    userId: "integer>0",
    id: "integer>0",
    title: "string",
    completed: "boolean",
  });

  const getTodos = defAsync(sig("=>", arrayOf(todo)), async () => {
    //  ^?
    const res = await fetch("https://jsonplaceholder.typicode.com/todos");
    return res.json() as Promise<Todo[]>;
  });
  expect(getTodos).to(equal<Safunc<() => Promise<Todo[]>>>);

  const getTodo = defAsync(
    //  ^?
    sig("integer>0", "=>", todo),
    sig("integer>0", "integer>0", "=>", arrayOf(todo)),
    async (...args) => {
      // Return a single todo if only one argument is provided
      if (args.length === 1)
        return await fetch(`https://jsonplaceholder.typicode.com/todos/${args[0]}`).then(
          (res) => res.json() as Promise<Todo>,
        );
      // Return an array of todos in a range of ids if two arguments are provided
      const [from, to] = args;
      return Promise.all(
        Array.from({ length: to - from + 1 }, (_, i) =>
          fetch(`https://jsonplaceholder.typicode.com/todos/${from + i}`).then(
            (res) => res.json() as Promise<Todo>,
          ),
        ),
      );
    },
  );
  expect(getTodo).to(
    equal<Safunc<((n: number) => Promise<Todo>) & ((n: number, m: number) => Promise<Todo[]>)>>,
  );
});

test("Safunc#unwrap", () => {
  const add = def(sig("number", "number", "=>", "number"), (n, m) => n + m);
  expect(add.unwrap()).to(equal<(n: number, m: number) => number>());

  const range = def(
    //  ^?
    sig("integer", "=>", "integer[]"),
    sig("integer", "integer", "?integer>0", "=>", "integer[]"),
    function range(startOrStop, stop?, step = 1) {
      const start = stop === undefined ? 0 : startOrStop;
      stop ??= startOrStop;
      return Array.from({ length: Math.ceil((stop - start) / step) }, (_, i) => start + i * step);
    },
  );
  expect(range.unwrap()).to(
    equal<
      ((stop: number) => number[]) & ((start: number, stop: number, step?: number) => number[])
    >,
  );
});
