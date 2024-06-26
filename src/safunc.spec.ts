/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable @typescript-eslint/ban-ts-comment */

import { arrayOf, morph, type } from "arktype";
import { expect, it, test } from "vitest";

import { def, defAsync, optional, sig } from "./safunc";
import { trimIndent } from "./utils/string";

it("should validate function arguments", () => {
  // With return type validation
  const add1 = def(sig("number", "number", "=>", "number"), (n, m) => n + m);
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
  expect(() =>
    // @ts-expect-error
    add1(42),
  ).toThrowError(new TypeError("Expected 2 arguments, but got 1"));

  // Without return type validation
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
});

it("should validate function return values", () => {
  const addIntegersRight = def(sig("integer", "integer", "=>", "integer"), (n, m) => n + m);
  expect(addIntegersRight(1, 2)).toBe(3);

  const addIntegersWrong = def(
    sig("integer", "integer", "=>", "integer"),
    // NOTE: Add a floating point number here to test validation of return value
    (n, m) => n + m + 0.5,
  );
  expect(() => addIntegersWrong(1, 2)).toThrowError(
    new TypeError(
      "The return value of 'function(integer, integer): integer' must be an integer (was 3.5)",
    ),
  );
});

it("should validate function with optional parameters", () => {
  const range1 = def(
    sig("integer", "?integer", "?integer<0|integer>0", "=>", "integer[]"),
    function range(startOrStop, stop, step = 1) {
      const [start, end] = (() => {
        if (stop === undefined) return [0, startOrStop];
        return [startOrStop, stop];
      })();

      const res: number[] = [];
      if (step > 0) for (let i = start; i < end; i += step) res.push(i);
      else for (let i = start; i > end; i += step) res.push(i);
      // NOTE: Add a floating point number here to test validation of return value
      res.push(0.5);
      return res;
    },
  );
  expect(() =>
    range1(
      42,
      // @ts-expect-error
      "foo",
    ),
  ).toThrowError(
    new TypeError(
      "The 2nd argument of 'function range(integer, ?integer, ?integer<0|integer>0): Array<integer>' must be a number (was string)",
    ),
  );
  expect(() => range1(0.5, 2)).toThrowError(
    new TypeError(
      "The 1st argument of 'function range(integer, ?integer, ?integer<0|integer>0): Array<integer>' must be an integer (was 0.5)",
    ),
  );
  expect(() => range1(5)).toThrowError(
    new TypeError(
      "Item at index 5 of the return value of 'function range(integer, ?integer, ?integer<0|integer>0): Array<integer>' must be an integer (was 0.5)",
    ),
  );

  const range2 = def(
    sig("integer", "?integer", "?integer>0", "=>", "integer[]"),
    function range(startOrStop, stop, step = 1) {
      const start = stop === undefined ? 0 : startOrStop;
      stop ??= startOrStop;
      return Array.from({ length: Math.ceil((stop - start) / step) }, (_, i) => start + i * step);
    },
  );
  expect(() => range2(1, 5, -1)).toThrowError(
    new TypeError(
      "The 3rd argument of 'function range(integer, ?integer, ?integer>0): Array<integer>' must be more than 0 (was -1)",
    ),
  );

  const repeatString1 = def(sig("string", optional("integer"), "=>", "string"), (s, n = 2) =>
    s.repeat(n),
  );
  expect(repeatString1("foo")).toBe("foofoo");
  expect(repeatString1("bar", 3)).toBe("barbarbar");
  expect(() =>
    repeatString1(
      "bar",
      // @ts-expect-error
      { n: 3 },
    ),
  ).toThrowError(
    new TypeError(
      "The 2nd argument of 'function(string, ?integer): string' must be a number (was object)",
    ),
  );
  expect(() => repeatString1("bar", 0.5)).toThrowError(
    new TypeError(
      "The 2nd argument of 'function(string, ?integer): string' must be an integer (was 0.5)",
    ),
  );

  const repeatString2 = def(
    sig("string", optional({ "n?": "integer>0" }), "=>", "string"),
    (s, { n = 2 } = {}) => s.repeat(n),
  );
  expect(repeatString2("foo")).toBe("foofoo");
  expect(repeatString2("bar", {})).toBe("barbar");
  expect(repeatString2("bar", { n: 3 })).toBe("barbarbar");
  expect(() =>
    repeatString2("bar", {
      // @ts-expect-error
      n: "foo",
    }),
  ).toThrowError(
    new TypeError(
      "Property 'n' of the 2nd argument of 'function(string, ?{ n?: integer>0 }): string' must be a number (was string)",
    ),
  );
  expect(() => repeatString2("bar", { n: 0.5 })).toThrowError(
    new TypeError(
      "Property 'n' of the 2nd argument of 'function(string, ?{ n?: integer>0 }): string' must be an integer (was 0.5)",
    ),
  );
});

it("should validate function with overloads", () => {
  const range_ = def(
    sig("integer", "=>", "integer[]"),
    sig("integer", "integer", "?integer>0", "=>", "integer[]"),
    function range(startOrStop, stop?, step = 1) {
      const start = stop === undefined ? 0 : startOrStop;
      stop ??= startOrStop;
      return Array.from({ length: Math.ceil((stop - start) / step) }, (_, i) => start + i * step);
    },
  );

  expect(range_(5)).toEqual([0, 1, 2, 3, 4]);
  expect(() =>
    range_(
      42,
      // @ts-expect-error
      "foo",
    ),
  ).toThrowError(
    new TypeError(
      "The 2nd argument of 'function range(integer, integer, ?integer>0): Array<integer>' (overload 2 of 2) must be a number (was string)",
    ),
  );
  expect(() => range_(0.5)).toThrowError(
    new TypeError(
      "The 1st argument of 'function range(integer): Array<integer>' (overload 1 of 2) must be an integer (was 0.5)",
    ),
  );

  const repeat = def(
    //  ^?: Safunc<((s: string) => string) & ((n: number, s: string) => string)>
    sig("string", "=>", "string"),
    sig("integer>0", "string", "=>", "string"),
    (...args) => {
      const [n, s] = args.length === 1 ? [2, args[0]] : args;
      return s.repeat(n);
    },
  );
  expect(repeat("foo")).toBe("foofoo");
  expect(repeat(3, "bar")).toBe("barbarbar");

  expect(() =>
    repeat(
      1,
      2,
      // @ts-expect-error
      3,
    ),
  ).toThrowError(new TypeError("Expected 1-2 arguments, but got 3"));
  expect(() =>
    repeat(
      // @ts-expect-error
      true,
    ),
  ).toThrowError(
    new TypeError(
      "The 1st argument of 'function(string): string' (overload 1 of 2) must be a string (was boolean)",
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
});

it("should validate function with Arktype morphs", () => {
  const range = def(
    //  ^?
    sig("integer | parsedInteger", "?integer", "?integer>0", "=>", "parsedInteger[]"),
    function range(startOrStop, stop?, step = 1) {
      const start = stop === undefined ? 0 : startOrStop;
      stop ??= startOrStop;
      return Array.from({ length: Math.ceil((stop - start) / step) }, (_, i) =>
        (start + i * step).toString(),
      );
    },
  );
  expect(range(5)).toEqual([0, 1, 2, 3, 4]);
  expect(range("3", 8, 2)).toEqual([3, 5, 7]);

  const makeDate = def(
    //  ^?
    sig("string", "=>", "parsedDate"),
    sig("parsedInteger | integer>=0", "1<=integer<=12", "1<=integer<=31", "=>", "parsedDate"),
    function makeDate(yOrIsoString, m?, d?) {
      if (typeof yOrIsoString === "string") return new Date(yOrIsoString).toISOString();
      return new Date(yOrIsoString, m! - 1, d).toISOString();
    },
  );
  expect(makeDate("2024-04-25")).toEqual(new Date("2024-04-25"));
  expect(makeDate("2024", 4, 25)).toEqual(new Date(2024, 3, 25));
});

it("should support zero-argument functions", () => {
  const now = def(sig("=>", "Date"), () => new Date());
  expect(now()).toBeInstanceOf(Date);

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
  expect(date()).toBeInstanceOf(Date);
  expect(date("2024-04-27")).toEqual(new Date("2024-04-27"));
  expect(date(2024, 4, 27)).toEqual(new Date(2024, 3, 27));

  const isoDateString = morph(
    "Date",
    (date) =>
      date.getFullYear() +
      "-" +
      String(date.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(date.getDate()).padStart(2, "0"),
  );

  const dateString = def(
    sig("=>", isoDateString),
    sig("integer>=0", "1<=integer<=12", "1<=integer<=31", "=>", isoDateString),
    (y?, m?, d?) => {
      if (y === undefined) return new Date();
      return new Date(y, m! - 1, d);
    },
  );
  expect(typeof dateString()).toBe("string");
  expect(dateString(2024, 4, 26)).toBe("2024-04-26");
});

it("should support asynchronous functions", async () => {
  type Todo = typeof todo.infer;
  const todo = type({
    userId: "integer>0",
    id: "integer>0",
    title: "string",
    completed: "boolean",
  });

  const getTodos = defAsync(sig("=>", arrayOf(todo)), async () => {
    const res = await fetch("https://jsonplaceholder.typicode.com/todos");
    return res.json() as Promise<Todo[]>;
  });
  expect((await getTodos()).slice(0, 3)).toEqual([
    {
      userId: 1,
      id: 1,
      title: "delectus aut autem",
      completed: false,
    },
    {
      userId: 1,
      id: 2,
      title: "quis ut nam facilis et officia qui",
      completed: false,
    },
    {
      userId: 1,
      id: 3,
      title: "fugiat veniam minus",
      completed: false,
    },
  ]);

  type TodoWrong = typeof todoWrong.infer;
  const todoWrong = type({
    userId: "integer>0",
    // Wrong property
    id: "string>0",
    title: "string",
    completed: "boolean",
  });
  const getTodosWrong = defAsync(sig("=>", arrayOf(todoWrong)), async () => {
    const res = await fetch("https://jsonplaceholder.typicode.com/todos");
    return res.json() as Promise<TodoWrong[]>;
  });
  await expect(getTodosWrong()).rejects.toThrowError(
    new TypeError(
      "Property '0/id' of the return value of 'function(): Promise<Array<{ userId: integer>0; id: string>0; title: string; completed: boolean }>>' must be a string (was number)",
    ),
  );

  let errorMessage = "";
  const getTodosWrong2 = getTodosWrong.onValidationError((e) => {
    errorMessage = e.message;
  });
  expect((await getTodosWrong2()).slice(0, 3)).toEqual([
    {
      userId: 1,
      id: 1,
      title: "delectus aut autem",
      completed: false,
    },
    {
      userId: 1,
      id: 2,
      title: "quis ut nam facilis et officia qui",
      completed: false,
    },
    {
      userId: 1,
      id: 3,
      title: "fugiat veniam minus",
      completed: false,
    },
  ]);
  expect(errorMessage).toBe(
    "Property '0/id' of the return value of 'function(): Promise<Array<{ userId: integer>0; id: string>0; title: string; completed: boolean }>>' must be a string (was number)",
  );

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
  expect(() => getTodo(0)).toThrowError(
    new TypeError(
      "The 1st argument of 'function(integer>0): Promise<{ userId: integer>0; id: integer>0; title: string; completed: boolean }>' (overload 1 of 2) must be more than 0 (was 0)",
    ),
  );
  expect(() => getTodo(1, 2.5)).toThrowError(
    new TypeError(
      "The 2nd argument of 'function(integer>0, integer>0): Promise<Array<{ userId: integer>0; id: integer>0; title: string; completed: boolean }>>' (overload 2 of 2) must be an integer (was 2.5)",
    ),
  );
  await expect(getTodo(1)).resolves.toEqual({
    userId: 1,
    id: 1,
    title: "delectus aut autem",
    completed: false,
  });
});

test("Safunc#unwrap", () => {
  const add = def(sig("number", "number", "=>", "number"), (n, m) => n + m);
  expect(add.unwrap()(1, 2)).toBe(3);

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
  expect(range.unwrap().name).toBe(range.name);
  expect(range.unwrap()(5)).toEqual([0, 1, 2, 3, 4]);
});
