/*
 * @Author: kasuie
 * @Date: 2024-07-03 11:01:25
 * @LastEditors: kasuie
 * @LastEditTime: 2024-07-03 15:55:58
 * @Description:
 */
(function () {
  "use strict";

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

  const onGetPathId = (type) => {
    if (window.location.pathname && window.location.pathname.includes(type)) {
      const pathname = window.location.pathname.split("/");
      if (pathname?.length) {
        return +pathname[pathname.length - 1];
      } else {
        return null;
      }
    } else {
      return null;
    }
  };

  const CID = onGetPathId("character");

  const SID = onGetPathId("subject");

  console.log("CID>>>", CID, "SID>>>", SID);

  if (CID) {
    /** 根据cid获取角色信息 */
    request({
      method: "GET",
      url: `https://api.bgm.tv/v0/characters/${CID}`,
    })
      .then((res) => {
        console.log("获取角色请求结果：", res);
      })
      .catch((e) => console.log(e))
      .finally(() => {
        console.log("finally>>>>");
      });
  } else if (SID) {
    /** 根据sid获取番剧信息 */
    request({
      method: "GET",
      url: `https://api.bgm.tv/v0/subjects/${SID}`,
    })
      .then((res) => {
        console.log("获取番剧请求结果：", res);
      })
      .catch((e) => console.log(e))
      .finally(() => {
        console.log("finally>>>>");
      });

    /** 根据sid获取番剧角色信息 */
    request({
      method: "GET",
      url: `https://api.bgm.tv/v0/subjects/${SID}/characters`,
    })
      .then((res) => {
        console.log("获取番剧角色请求结果：", res);
      })
      .catch((e) => console.log(e))
      .finally(() => {
        console.log("finally>>>>");
      });

    /** 根据sid获取番剧人员信息 */
    request({
      method: "GET",
      url: `https://api.bgm.tv/v0/subjects/${SID}/persons`,
    })
      .then((res) => {
        console.log("获取番剧人员请求结果：", res);
      })
      .catch((e) => console.log(e))
      .finally(() => {
        console.log("finally>>>>");
      });
  }

  /** 获取收藏 */
  request({
    method: "GET",
    url: `https://api.bgm.tv/v0/users/493768/collections?limit=30&offset=0`,
  })
    .then((res) => {
      console.log("获取收藏请求结果：", res);
    })
    .catch((e) => console.log(e))
    .finally(() => {
      console.log("finally>>>>");
    });
})();
