// Using a function for Server so lint-staged does NOT append individual file paths.
// `tsc --noEmit` must use tsconfig.json — passing files directly causes TS5112.
export default {
  "Client/**/*.{ts,tsx,js,jsx}": "pnpm --filter ./Client lint",
  "Server/**/*.{ts,js}": () => "pnpm --filter ./Server lint",
};
