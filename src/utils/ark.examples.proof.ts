import { equal, expect, test } from "typroof";

import { record, unions } from "./ark";

import type { Type } from "arktype";

test("record", () => {
  const schema = record("string", "number");
  expect(schema).to(equal<Type<Record<string, number>>>);
});

test("unions", () => {
  const schema = unions("string", "number", "boolean");
  expect(schema).to(equal<Type<string | number | boolean>>);
});
