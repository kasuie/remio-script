/*
 * @Author: kasuie
 * @Date: 2025-02-17 16:13:48
 * @LastEditors: kasuie
 * @LastEditTime: 2025-02-20 11:18:29
 * @Description:
 */
import {
  GM,
  GmXmlhttpRequestOption,
  GmResponseType,
} from "vite-plugin-monkey/dist/client";

export const request = (data: GmXmlhttpRequestOption<GmResponseType, any>) => {
  return new Promise((resolve, reject) => {
    if (!data.method) {
      data.method = "get";
    }
    if (!data.timeout) {
      data.timeout = 60000;
    }
    data.onload = function (res: any) {
      try {
        resolve(JSON.parse(res.responseText));
      } catch (error) {
        reject(error);
      }
    };
    data.onerror = function (e: any) {
      reject(e);
    };
    data.ontimeout = function () {
      reject(false);
    };
    GM.xmlHttpRequest(data);
  });
};
