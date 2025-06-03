import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import jestPlugin from "eslint-plugin-jest";
import testingLibraryPlugin from "eslint-plugin-testing-library";
import jestDomPlugin from "eslint-plugin-jest-dom";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["**/__tests__/**/*", "**/*.test.[jt]s?(x)", "**/*.spec.[jt]s?(x)"],
    plugins: {
      jest: jestPlugin,
      "testing-library": testingLibraryPlugin,
      "jest-dom": jestDomPlugin,
    },
    rules: {
      ...jestPlugin.configs.recommended.rules,
      ...jestPlugin.configs.style.rules,
      ...testingLibraryPlugin.configs.react.rules,
      ...testingLibraryPlugin.configs.dom.rules, // if not using react-specific version or for general dom utils
      ...jestDomPlugin.configs.recommended.rules,
      // You can override or add specific rules here
      // e.g. 'testing-library/await-async-queries': 'error',
    },
    languageOptions: {
      globals: {
        jest: "readonly",
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        // Add other Jest globals if you use them
      },
    },
  },
];

export default eslintConfig;
