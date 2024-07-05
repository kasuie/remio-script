/*
 * @Author: kasuie
 * @Date: 2024-07-03 11:01:25
 * @LastEditors: kasuie
 * @LastEditTime: 2024-07-05 09:49:20
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

  const init = () => {
    const $button = $("<button>", {
      id: "mio-button",
      text: "Mio",
    });

    $button.click(() => onSubmit());

    $button.css({
      padding: "6px 16px",
      "font-size": "12px",
      "background-color": "#f09199",
      color: "white",
      border: "none",
      "border-radius": "8px",
      cursor: "pointer",
      position: "fixed",
      top: "14px",
      right: "20px",
    });

    $("body.bangumi").append($button);
  };

  const CID = onGetPathId("character");

  const SID = onGetPathId("subject");

  console.log("CID>>>", CID, "SID>>>", SID);

  const onSubmit = () => {
    return console.log("SID:", SID, "CID:", CID);
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
      const subject = request({
        method: "GET",
        url: `https://api.bgm.tv/v0/subjects/${SID}`,
      });

      /** 根据sid获取番剧角色信息 */
      const characters = request({
        method: "GET",
        url: `https://api.bgm.tv/v0/subjects/${SID}/characters`,
      });

      /** 根据sid获取番剧人员信息 */
      const persons = request({
        method: "GET",
        url: `https://api.bgm.tv/v0/subjects/${SID}/persons`,
      });

      Promise.all([subject, characters, persons]).then(
        ([subject, characters, persons]) => {
          console.log(characters, persons);
          const afterPersons = formatRoles(persons);
          const { data, actors } = formatRoles(characters, true);
          const personsId = [],
            resultPersons = [];
          const relCharacters = data.map((v) => ({ id: v.id, name: v.name }));
          const relPersons = afterPersons.map((v) => {
            if (!personsId.includes(v.id)) {
              // 去重
              personsId.push(v.id);
              resultPersons.push({
                ...v,
                shortSummary: null,
              });
            }

            return {
              id: v.id,
              name: v.name,
              position: v.shortSummary,
            };
          });
          const params = {
            ...formatSub(subject),
            characters: data,
            persons: resultPersons.concat(actors),
            relPersons: JSON.stringify(relPersons),
            relCharacters: JSON.stringify(relCharacters),
          };
          console.log(params, "params");
          // request({
          //   method: "POST",
          //   url: "http://localhost:8001/bgm/save",
          //   headers: { "Content-Type": "application/json" },
          //   data: JSON.stringify(params),
          // }).then((res) => {
          //   console.log(res, "请求结果~");
          // });
        }
      );
    }
  };

  // /** 获取收藏 */
  // request({
  //   method: "GET",
  //   url: `https://api.bgm.tv/v0/users/493768/collections?limit=30&offset=0`,
  // })
  //   .then((res) => {
  //     console.log("获取收藏请求结果：", res);
  //   })
  //   .catch((e) => console.log(e))
  //   .finally(() => {
  //     console.log("finally>>>>");
  //   });

  const formatSub = (subject) => {
    let {
      id,
      tags,
      images,
      name_cn,
      rating: { score, total },
      date,
      infobox,
      total_episodes,
      collection,
      ...others
    } = subject;

    let aliasName,
      openTv,
      otherTv,
      startDate,
      endDate,
      copyright,
      official,
      original,
      director,
      charSetting;

    const tagsString = tags?.reduce((prev, curr, index) => {
      return index > 15 ? prev : prev ? `${prev},${curr.name}` : curr.name;
    }, "");

    const infoBox = infobox?.filter((item) => {
      if (item.key === "中文名") {
        !name_cn && (name_cn = item.value);
        return false;
      } else if (item.key === "别名") {
        aliasName = JSON.stringify(item.value);
        return false;
      } else if (item.key === "话数") {
        !total_episodes && (total_episodes = +item.value);
        return false;
      } else if (item.key === "放送开始") {
        startDate = onGetDate(item.value) || item.value;
        return false;
      } else if (item.key === "播放结束") {
        endDate = onGetDate(item.value) || item.value;
        return false;
      } else if (item.key === "官方网站") {
        official = item.value;
        return false;
      } else if (item.key === "播放电视台") {
        openTv = item.value;
        return false;
      } else if (item.key === "其他电视台") {
        otherTv = item.value;
        return false;
      } else if (item.key === "Copyright") {
        copyright = item.value;
        return false;
      } else if (item.key === "原作") {
        original = item.value;
        return false;
      } else if (item.key === "导演") {
        director = item.value;
        return false;
      } else if (item.key === "人物设定" || item.key === "角色设定") {
        charSetting = item.value;
        return false;
      } else {
        return true;
      }
    });

    return {
      ...others,
      bgmId: id,
      nameCn: name_cn,
      tags: tagsString,
      bgmScore: score,
      bgmRaters: total,
      infoBox: JSON.stringify(infoBox),
      startDate,
      endDate,
      aliasName,
      broadcast: JSON.stringify({
        openTv,
        otherTv,
      }),
      info: JSON.stringify({
        copyright,
        official,
        original,
        director,
        charSetting,
      }),
      images: JSON.stringify(images),
      totalEpisodes: total_episodes,
    };
  };

  const formatRoles = (list, isChar = false, isCv = false) => {
    if (!Array.isArray(list)) return null;
    let data = list;
    if (isChar) {
      let totalActors = [];
      data = list.map((v) => {
        let { actors, images, locked, ...others } = v;
        for (const key in images) {
          images[key] = images[key].replace("https://lain.bgm.tv", "");
        }
        const itemCvs = formatRoles(actors, false, true);
        totalActors = totalActors.concat(itemCvs);
        return {
          ...others,
          locked: locked || false,
          isCv: isCv,
          actors: JSON.stringify(
            itemCvs.map((v) => ({ name: v.name, id: v.id }))
          ),
          images: JSON.stringify(images),
        };
      });
      return { data, actors: totalActors };
    } else {
      const whiteListByCount = ["作画监督", "副导演", "原画", "补间动画"];
      const whiteList = [
        "原作",
        "导演",
        "人物原案",
        "人物设定",
        "音乐",
        "总作画监督",
        "脚本",
        "系列构成",
        "美术监督",
        "摄影监督",
      ];
      const relMaps = list.reduce((prev, curr) => {
        if (Object.hasOwn(prev, curr.relation)) {
          ++prev[curr.relation];
        } else {
          prev[curr.relation] = 1;
        }
        return prev;
      }, {});
      if (!isCv) {
        data = list.filter((v) => {
          if (!v.relation) return false;
          if (whiteList.includes(v.relation)) {
            return true;
          } else if (whiteListByCount.includes(v.relation)) {
            return relMaps[v.relation] < 7;
          } else {
            return false;
          }
        });
      }
      data = data.map((v) => {
        let { career, images, short_summary, locked, relation, ...others } = v;
        for (const key in images) {
          images[key] = images[key].replace("https://lain.bgm.tv", "");
        }
        return {
          ...others,
          locked: locked || false,
          isCv: isCv,
          shortSummary: isCv ? short_summary : relation,
          images: JSON.stringify(images),
          career: career && career.join(","),
        };
      });
      return data;
    }
  };

  const onGetDate = (dateString) => {
    if (!dateString) return null;
    const dateParts = dateString.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
    if (dateParts) {
      const year = parseInt(dateParts[1], 10);
      const month = parseInt(dateParts[2], 10) - 1;
      const day = parseInt(dateParts[3], 10);
      return new Date(year, month, day);
    } else {
      return null;
    }
  };

  init();
})();
