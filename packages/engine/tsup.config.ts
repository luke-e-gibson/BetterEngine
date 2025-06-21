import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/engine.ts"],
  clean: true,
  format: ["cjs", "esm"],
  dts: true,
});