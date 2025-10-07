// eslint.config.js — CommonJS version (no "type": "module" needed)

const eslintPluginPrettier = require("eslint-plugin-prettier");
const eslintConfigPrettier = require("eslint-config-prettier");
const tseslint = require("@typescript-eslint/eslint-plugin");
const tsParser = require("@typescript-eslint/parser");

/** @type {import("eslint").Linter.FlatConfig[]} */
module.exports = [
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
        sourceType: "module",
      },
      globals: {
        console: "readonly",
        process: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      prettier: eslintPluginPrettier,
    },
    rules: {
      ...(tseslint.configs.recommended
        ? tseslint.configs.recommended.rules
        : {}),
      ...(eslintConfigPrettier.rules || {}),

      // TypeScript rules
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-module-boundary-types": "off",

      // Prettier integration
      "prettier/prettier": "error",

      // Node & style
      "no-console": "off",
      "no-unused-vars": "warn",
      "prefer-const": "error",
    },
  },
  {
    ignores: ["dist", "node_modules", "*.js"],
  },
];
