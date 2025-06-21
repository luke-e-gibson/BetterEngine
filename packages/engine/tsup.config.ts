import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/engine.ts"],
  clean: true,
  format: ["esm"],
  dts: true,
});