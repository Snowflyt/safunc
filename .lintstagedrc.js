// @ts-check

/** @satisfies {import("lint-staged").Config} */
const config = {
  "{src,test}/**/*.{js,ts}":
    "eslint --fix --report-unused-disable-directives-severity error --max-warnings 0",
  "*.{js,cjs,mjs,ts,cts,mts}":
    "eslint --fix --report-unused-disable-directives-severity error --max-warnings 0",
  "{src,test}/**/*.json": "prettier --log-level=silent --write",
  "*.{json,md}": "prettier --log-level=silent --write",
};

export default config;
