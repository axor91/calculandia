import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["logic/**/*.ts", "lib/**/*.ts"],
      thresholds: {
        statements: 70,
        branches: 60,
        functions: 60,
        lines: 75,
      },
    },
  },
});
