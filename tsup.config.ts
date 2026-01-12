import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["build/ts/index.ts"],
  format: ["esm"],
  dts: true,
  outDir: "dist",
  clean: true,
  splitting: false,
  sourcemap: false,
  treeshake: true,
});

