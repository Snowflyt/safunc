/**
 * Capitalize the first letter of a string.
 * @param s The string to capitalize.
 * @returns
 */
export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Trim indents of a multiline string.
 * @param s The string to trim.
 * @returns
 */
export const trimIndent = (s: string) => {
  const lines = s.split("\n");
  let minIndent = Infinity;
  for (const line of lines) {
    if (line.trim() === "") continue;
    const indent = line.search(/\S/);
    if (indent !== -1) minIndent = Math.min(minIndent, indent);
  }
  return lines
    .map((line) => line.slice(minIndent))
    .join("\n")
    .trim();
};
