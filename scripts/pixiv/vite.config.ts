/*
 * @Author: kasuie
 * @Date: 2025-02-20 17:58:41
 * @LastEditors: kasuie
 * @LastEditTime: 2025-02-20 17:58:46
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
        entry: "src/index.ts",
        server: { mountGmApi: true },
        userscript: {
          author: "kasuie",
          icon: "https://www.google.com/s2/favicons?sz=64&domain=pixiv",
          namespace: "remio/script-pixiv",
          match: ["https://pixiv.net/*"],
          version: "0.0.1",
        },
      }),
    ],
  };
});
