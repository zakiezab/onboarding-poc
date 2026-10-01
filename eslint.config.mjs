import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored third-party ES modules served as static files (see
    // app/layout.tsx import map) — not our code, not built by the bundler.
    "public/vendor/**",
    // Magic UI registry components, kept verbatim from
    // https://magicui.design/r/<name>.json (shadcn/ui registry convention —
    // "yours" to use and edit, but not written against this repo's stricter
    // lint rules, and left unmodified here so future re-fetches stay diffable).
    "registry/**",
  ]),
]);

export default eslintConfig;
