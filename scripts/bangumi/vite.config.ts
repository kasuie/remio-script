/*
 * @Author: kasuie
 * @Date: 2025-02-17 11:04:59
 * @LastEditors: kasuie
 * @LastEditTime: 2025-02-20 10:49:10
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
        userscript: {
          author: "kasuie",
          icon: "https://www.google.com/s2/favicons?sz=64&domain=bgm.tv",
          namespace: "remio/script-bangumi",
          match: ["https://bgm.tv/*"],
          version: "0.0.1",
        },
      }),
    ],
  };
});
