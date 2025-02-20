/*
 * @Author: kasuie
 * @Date: 2025-02-20 09:40:07
 * @LastEditors: kasuie
 * @LastEditTime: 2025-02-20 11:04:11
 * @Description:
 */
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";
import { defineConfig } from "rollup";

export default defineConfig([
  {
    input: "src/index.ts",
    output: [
      {
        file: "dist/index.cjs.js",
        format: "cjs",
        sourcemap: false,
      },
      {
        file: "dist/index.esm.js",
        format: "es",
        sourcemap: false,
      },
    ],
    context: "global",
    plugins: [typescript()],
    external: ["vite-plugin-monkey/dist/client"],
  },
  {
    input: "src/index.ts",
    output: [{ file: "dist/index.d.ts", format: "es" }],
    plugins: [dts()],
  },
]);
