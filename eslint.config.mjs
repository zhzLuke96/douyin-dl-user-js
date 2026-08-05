import tseslint from "typescript-eslint"
import eslint from "@eslint/js"

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-unsafe-function-type": "off",
      "@typescript-eslint/no-this-alias": "off",
      "no-console": "off",
      "no-control-regex": "off",
      "no-empty": "off",
      "no-var": "off",
    },
  },
  {
    ignores: [
      "dist/",
      "node_modules/",
      "docs/",
      "build.mjs",
      "*.config.*",
      "src/types/douyin.ts",
    ],
  },
)