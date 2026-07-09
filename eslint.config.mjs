// Flat ESLint config (ESLint 9). Covers the TypeScript app and shared package,
// plus the plain Node test/build scripts. Prettier owns formatting, so
// eslint-config-prettier is applied last to switch off style rules.
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  {
    ignores: ["**/node_modules/**", "dist-web/**", "**/.expo/**", "**/*.json", "**/*.md"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { react, "react-hooks": reactHooks },
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: "detect" } },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      // React 19 + the new JSX transform: no in-scope React import required.
      "react/react-in-jsx-scope": "off",
      // TypeScript already models component props, so PropTypes is redundant.
      "react/prop-types": "off",
      // TypeScript resolves identifiers; no-undef double-reports and is noisy.
      "no-undef": "off",
    },
  },
  {
    // Node scripts: verification, smoke tests, and the device launcher.
    files: ["scripts/**/*.mjs"],
    languageOptions: {
      globals: {
        process: "readonly",
        console: "readonly",
        URL: "readonly",
        fetch: "readonly",
      },
    },
  },
  prettier,
);
