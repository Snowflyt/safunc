import { expect, test } from "vitest";

import { humanizeNaturalNumbers, ordinal, range } from "./number";

test("ordinal", () => {
  expect(ordinal(1)).toBe("1st");
  expect(ordinal(2)).toBe("2nd");
  expect(ordinal(3)).toBe("3rd");
  expect(ordinal(5)).toBe("5th");
  expect(ordinal(11)).toBe("11th");
  expect(ordinal(12)).toBe("12th");
  expect(ordinal(13)).toBe("13th");
  expect(ordinal(14)).toBe("14th");
  expect(ordinal(20)).toBe("20th");
  expect(ordinal(21)).toBe("21st");
  expect(ordinal(22)).toBe("22nd");
  expect(ordinal(23)).toBe("23rd");
  expect(ordinal(24)).toBe("24th");
});

test("range", () => {
  expect(range(0, 5)).toEqual([0, 1, 2, 3, 4]);
  expect(range(3, 9, 2)).toEqual([3, 5, 7]);
  expect(range(3, -2, -1)).toEqual([3, 2, 1, 0, -1]);
});

test("humanizeNaturalNumbers", () => {
  expect(humanizeNaturalNumbers([1, 2, 3, 4, 5])).toBe("1-5");
  expect(humanizeNaturalNumbers([1, 2, 3, 5, 6])).toBe("1-3 or 5-6");
  expect(humanizeNaturalNumbers([1, 2, 4, 7, 8, 9])).toBe("1-2, 4 or 7-9");
});
