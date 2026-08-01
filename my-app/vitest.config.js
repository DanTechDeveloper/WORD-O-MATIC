import { defineConfig } from "vitest/config";
import path from "path";
 
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.{js,jsx,cjs,ts,tsx,mjs}"],
    exclude: ["/node_modules/", "tests/Feature/", "tests/Unit/Example"],
    setupFiles: ["./tests/setup.js"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "resources/js"),
    },
  },
});