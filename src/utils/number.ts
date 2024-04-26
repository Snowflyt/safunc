/**
 * Returns the ordinal suffix of a number.
 * @param n The number to get the ordinal suffix of.
 * @returns
 *
 * @example
 * ```typescript
 * ordinal(1); // => "1st"
 * ordinal(2); // => "2nd"
 * ordinal(3); // => "3rd"
 * ordinal(5); // => "5th"
 * ordinal(11); // => "11th"
 * ordinal(12); // => "12th"
 * ordinal(21); // => "21st"
 * ```
 */
export const ordinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0])!;
};

/**
 * Create an array of numbers in a range.
 * @param start The start of the range (inclusive).
 * @param stop The end of the range (exclusive).
 * @param step The step of the range. Defaults to `1`.
 * @returns
 */
export const range = (start: number, stop: number, step = 1) => {
  const res: number[] = [];
  if (step > 0) for (let i = start; i < stop; i += step) res.push(i);
  else for (let i = start; i > stop; i += step) res.push(i);
  return res;
};

/**
 * Return the human-readable form of a list of _sorted_ natural numbers.
 * @param ns The list of natural numbers.
 * @returns
 *
 * @example
 * ```typescript
 * humanizeNaturalNumbers([1, 2, 3, 4, 5]); // => "1-5"
 * humanizeNaturalNumbers([1, 2, 3, 5, 6]); // => "1-3 or 5-6"
 * humanizeNaturalNumbers([1, 2, 4, 7, 8, 9]); // => "1-2, 4 or 7-9"
 * ```
 */
export const humanizeNaturalNumbers = (ns: readonly number[]) => {
  const res: string[] = [];
  let t = ns[0]!.toString();
  for (let i = 1; i < ns.length; i++) {
    if (ns[i] === ns[i - 1]! + 1) {
      if (t.includes("-")) t = t.split("-", 2)[0]! + "-" + ns[i];
      else t += "-" + ns[i];
    } else {
      res.push(t);
      t = ns[i]!.toString();
    }
  }
  res.push(t);

  if (res.length === 1) return res[0]!;
  return [res.slice(0, -1).join(", "), res[res.length - 1]!].join(" or ");
};
