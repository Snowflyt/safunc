import { expect, test } from "vitest";

import { record, unions } from "./ark";

test("record", () => {
  const schema = record("string", "number");
  expect(() => schema.assert({ foo: 42 })).not.toThrow();
  expect(() => schema.assert(42)).toThrowError(new TypeError("Must be an object (was number)"));
  expect(() => schema.assert({ foo: "bar" })).toThrowError(
    new TypeError('Must be an object with values of type \'number\' (was {"foo":"bar"})'),
  );
  expect(() => schema.assert({ [Symbol()]: 42 })).toThrowError(
    new TypeError("Must be an object with keys of type 'string' (was {})"),
  );
});

test("unions", () => {
  const schema = unions("string", "number", "boolean");
  expect(() => schema.assert("foo")).not.toThrow();
  expect(() => schema.assert(42)).not.toThrow();
  expect(() => schema.assert(true)).not.toThrow();
  expect(() => schema.assert({})).toThrowError(
    new TypeError("Must be a string, a number or boolean (was {})"),
  );
});
