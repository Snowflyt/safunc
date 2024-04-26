import { equal, expect, test } from "typroof";

import { def, optional, sig } from "./safunc";

import type { Safunc, Sig, untyped } from "./safunc";

test("sig", () => {
  expect(sig("number", "number", "=>", "number")).to(equal<Sig<(n: number, m: number) => number>>);
  expect(sig("number", "number")).to(equal<Sig<(n: number, m: number) => untyped>>);
  expect(sig("string", "?boolean", "?integer>0", "=>", "integer[]")).to(
    equal<Sig<(s: string, b?: boolean, n?: number) => number[]>>,
  );
});

test("optional", () => {
  const repeatString = def(
    //  ^?
    sig("string", optional({ "n?": "integer>0" }), "=>", "string"),
    (s, { n = 2 } = {}) => s.repeat(n),
  );
  expect(repeatString).to(equal<Safunc<(s: string, opts?: { n?: number }) => string>>);
});
