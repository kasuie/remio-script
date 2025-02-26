/*
 * @Author: kasuie
 * @Date: 2025-02-26 10:10:22
 * @LastEditors: kasuie
 * @LastEditTime: 2025-02-26 10:33:56
 * @Description:
 */
import { GM } from "vite-plugin-monkey/dist/client";
export const storage = {
  set(key: string, val: unknown) {
    return GM.setValue(key, val);
  },
  get(key: string, defaultValue?: unknown) {
    return GM.getValue(key, defaultValue);
  },
  all() {
    return GM.listValues();
  },
  del(key: string) {
    return GM.deleteValue(key);
  },
  async clear() {
    let keys = this.all();
    for (let key of await keys) {
      GM.deleteValue(key);
    }
  },
};
