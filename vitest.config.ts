import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: [
        "logic/**/*.ts",
        "lib/**/*.ts",
        "calculations/**/*.ts",
        "catalog/**/*.ts",
        "components/calculator/state.ts",
      ],
      thresholds: {
        statements: 70,
        branches: 60,
        functions: 60,
        lines: 75,
      },
    },
  },
});
