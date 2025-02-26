/*
 * @Author: kasuie
 * @Date: 2025-02-17 16:13:48
 * @LastEditors: kasuie
 * @LastEditTime: 2025-02-26 10:19:44
 * @Description:
 */
import {
  GM,
  GmXmlhttpRequestOption,
  GmResponseType,
} from "vite-plugin-monkey/dist/client";
export * from "./storage";

export const request = (data: GmXmlhttpRequestOption<GmResponseType, any>) => {
  return new Promise((resolve, reject) => {
    if (!data.method) {
      data.method = "get";
    }
    if (!data.timeout) {
      data.timeout = 60000;
    }
    data.onload = function (res) {
      try {
        resolve(JSON.parse(res.responseText));
      } catch (error) {
        reject(error);
      }
    };
    data.onerror = function (e) {
      reject(e);
    };
    data.ontimeout = function () {
      reject("timeout");
    };
    GM.xmlHttpRequest(data);
  });
};
