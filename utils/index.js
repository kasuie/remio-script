/*
 * @Author: kasuie
 * @Date: 2024-08-04 13:13:03
 * @LastEditors: kasuie
 * @LastEditTime: 2024-08-04 13:13:03
 * @Description:
 */
const request = (data) => {
  return new Promise((resolve, reject) => {
    if (!data.method) {
      data.method = "get";
    }
    if (!data.timeout) {
      data.timeout = 10000;
    }
    data.onload = function (res) {
      try {
        resolve(JSON.parse(res.responseText));
      } catch (error) {
        reject(false);
      }
    };
    data.onerror = function (e) {
      reject(false);
    };
    data.ontimeout = function () {
      reject(false);
    };
    GM.xmlHttpRequest(data);
  });
};
