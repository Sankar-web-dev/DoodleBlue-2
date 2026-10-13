// Both Client and Server linters don't accept individual file paths:
// - `next lint <files>` fails to find the app directory
// - `tsc --noEmit <files>` ignores tsconfig.json (TS5112)
// Using function form so lint-staged does NOT append file paths.
export default {
  "Client/**/*.{ts,tsx,js,jsx}": () => "pnpm --filter ./Client lint",
  "Server/**/*.{ts,js}": () => "pnpm --filter ./Server lint",
};
