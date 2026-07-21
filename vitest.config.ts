import { defineConfig } from "vitest/config"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"

const __dir = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: { "@": resolve(__dir, ".") },
  },
  test: {
    environment: "node",
    include: ["**/__tests__/**/*.test.ts", "**/*.test.ts"],
    exclude: ["node_modules", ".next"],
  },
})
