/*
 * @Author: kasuie
 * @Date: 2025-02-17 11:04:59
 * @LastEditors: kasuie
 * @LastEditTime: 2025-02-20 11:20:42
 * @Description:
 */
import { defineConfig, loadEnv } from "vite";
import monkey from "vite-plugin-monkey";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  return {
    define: {
      "process.env.BASE_URL": JSON.stringify(env.VITE_BASE_URL),
    },
    plugins: [
      monkey({
        entry: "src/main.ts",
        server: { mountGmApi: true },
        build: {
          externalGlobals: {
            jquery: "$",
          },
        },
        userscript: {
          author: "kasuie",
          icon: "https://www.google.com/s2/favicons?sz=64&domain=bbs.mihoyo.com",
          namespace: "remio/script-bbs",
          match: ["https://bbs.mihoyo.com/*"],
          version: "0.0.1",
          require: ["https://cdn.bootcss.com/jquery/3.7.1/jquery.min.js"],
        },
      }),
    ],
  };
});
