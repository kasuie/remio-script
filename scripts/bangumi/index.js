/*
 * @Author: kasuie
 * @Date: 2024-07-03 11:01:25
 * @LastEditors: kasuie
 * @LastEditTime: 2024-07-09 17:14:44
 * @Description:
 */
(function () {
  "use strict";

  let $message, $button;

  const BaseUrl = "https://kasuie.cc/apis";

  const onMessage = (text, type = "success", time = 3000) => {
    if (text && $message) {
      let timer;
      if (timer) clearTimeout(timer);
      if (type == "success") {
        $message.css("color", "#4ef16a");
      } else if (type == "error") {
        $message.css("color", "#f23939");
      } else {
        $message.css("color", "#ffffff");
      }
      $message.text(text);
      $message.css("top", "36px");
      timer = setTimeout(() => {
        $message.css("top", "-36px");
      }, time);
    }
  };

  const onLoading = (loading = true) => {
    $button && $button.attr("disabled", loading);
  };

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

  const onGetPathEnd = (type, _path = null) => {
    const path = _path || window.location.pathname;
    if (path && path.includes(type)) {
      const pathname = path.split("/");
      if (pathname?.length) {
        return _path
          ? pathname[pathname.length - 1]
          : +pathname[pathname.length - 1];
      } else {
        return null;
      }
    } else {
      return null;
    }
  };

  const init = () => {
    $button = $("<button>", {
      id: "mio-button",
      text: "Mio",
    });
    $message = $("<div>", {
      id: "mio-message",
    });

    $button.click(() => onGetData());

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

    $message.css({
      position: "fixed",
      top: "-36px",
      left: "50%",
      transform: "translateX(-50%)",
      width: "200px",
      textAlign: "center",
      minWidth: "100px",
      minHeight: "36px",
      background: "rgba(0,0,0,.4)",
      borderRadius: "12px",
      transition: "all .3s ease-in-out",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    });

    $("body.bangumi").append($button);
    $("body.bangumi").append($message);
  };

  const CID = onGetPathEnd("character");

  const SID = onGetPathEnd("subject");

  console.log("CID>>>", CID, "SID>>>", SID);

  const onGetData = () => {
    // return console.log("SID:", SID, "CID:", CID);
    if (CID) {
      onLoading();
      /** 根据cid获取角色信息 */
      const character = request({
        method: "GET",
        url: `https://api.bgm.tv/v0/characters/${CID}`,
      });

      /** 根据cid获取角色cv信息 */
      request({
        method: "GET",
        url: `https://api.bgm.tv/v0/characters/${CID}/persons`,
      }).then((cvs) => {
        let cv = null;
        const item = cvs?.find((v) => v.subject_type === 2);
        if (item?.id) {
          /** 根据id获取cv详细信息 */
          cv = request({
            method: "GET",
            url: `https://api.bgm.tv/v0/persons/${item.id}`,
          });
        }
        Promise.all([character, cv]).then(([character, cv]) => {
          const cvData = cv && formatPerson(cv, true);
          const params = {
            ...formatChar(character),
            actors: cvData
              ? JSON.stringify({ name: cvData.name, id: cvData.id })
              : null,
            cv: cvData,
          };
          onSubmit(`${BaseUrl}/bgm/saveChar`, params);
        });
      });
    } else if (SID) {
      onLoading();
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
          const afterPersons = formatRoles(persons);
          const { data, actors } = formatRoles(characters, true);
          const personsId = [],
            resultPersons = [];
          const relCharacters = data.map((v) => ({
            id: v.id,
            name: v.name,
            relation: v.relation,
          }));
          const relPersons = afterPersons.map((v) => {
            if (!personsId.includes(v.id)) {
              // 去重
              personsId.push(v.id);
              resultPersons.push({
                ...v,
                summary: null,
              });
            }

            return {
              id: v.id,
              name: v.name,
              position: v.summary,
            };
          });
          // 去重
          const resultActors =
            actors?.reduce(
              (prev, curr) => {
                if (!prev[0].includes(curr.id)) {
                  prev[0].push(curr.id);
                  prev[1].push(curr);
                }
                return prev;
              },
              [[], []]
            )[1] || [];
          const params = {
            ...formatSub(subject),
            characters: data,
            persons: resultPersons.concat(resultActors),
            relPersons: JSON.stringify(relPersons),
            relCharacters: JSON.stringify(relCharacters),
          };
          onSubmit(`${BaseUrl}/bgm/saveSub`, params);
        }
      );
    }
  };

  const onSubmit = (
    url,
    params,
    options = {
      method: "POST",
    }
  ) => {
    console.log("onSubmit:", params);
    request({
      ...options,
      url: url,
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify(params),
    })
      .then((res) => {
        console.log(res, "请求结果~");
        onMessage(res.message, res.success ? "success" : "error");
      })
      .catch((e) => onMessage(`请求失败：${e}`, "error"))
      .finally(() =>
        setTimeout(() => {
          onLoading(false);
        }, 300)
      );
  };

  const formatPerson = (person, isCv) => {
    const {
      career,
      blood_type,
      birth_day,
      birth_mon,
      birth_year,
      images,
      infobox,
      gender,
      stat,
      last_modified,
      img,
      ...others
    } = person;

    for (const key in images) {
      images[key] = images[key].replace("https://lain.bgm.tv", "");
    }

    const infoKeys = [
      { name: "中文名", field: "nameCn" },
      { name: "别名", field: "aliasName" },
      { name: "性别", field: "gender" },
      { name: "生日", field: "birth" },
      { name: "Twitter", field: "twitter" },
      { name: "引用来源", field: "source" },
    ];

    let aliasName, nameCn, twiAccount, birthDay;

    const info = infobox?.reduce((prev, curr) => {
      const item = infoKeys.find((v) => curr.key.includes(v.name));
      if (item) {
        if (item.field === "nameCn" && !nameCn) {
          nameCn = curr.value;
        } else if (item.field === "aliasName" && !aliasName) {
          aliasName = curr.value;
        } else if (item.field === "gender" && !gender) {
          gender = curr.value === "男" ? "male" : "female";
        } else if (item.field === "twitter") {
          if (curr.value.includes(".com")) {
            twiAccount = onGetPathEnd(".com", curr.value);
          } else {
            twiAccount = curr.value;
          }
        } else if (item.field === "birth") {
          birthDay = curr.value;
        }
      } else {
        !prev && (prev = {});
        prev[curr.key] = curr.value;
      }
      return prev;
    }, null);

    if (!birthDay) {
      birthDay = [birth_year, birth_mon, birth_day].reduce((prev, curr) => {
        return prev ? `${prev}-${curr || ""}` : curr;
      }, null);
    }

    return {
      ...others,
      twiAccount,
      birthDay,
      nameCn,
      gender,
      isCv,
      info: JSON.stringify(info),
      aliasName: aliasName && JSON.stringify(aliasName),
      bgmImages: JSON.stringify(images),
      career: career && career.join(","),
    };
  };

  const formatChar = (char) => {
    let {
      birth_day,
      birth_mon,
      birth_year,
      blood_type,
      images,
      infobox,
      stat,
      gender,
      ...others
    } = char;
    for (const key in images) {
      images[key] = images[key].replace("https://lain.bgm.tv", "");
    }
    const infoKeys = [
      { name: "中文名", field: "nameCn" },
      { name: "别名", field: "aliasName" },
      { name: "性别", field: "gender" },
      { name: "生日", field: "birth" },
      { name: "引用来源", field: "source" },
    ];

    let aliasName, nameCn, birthDay, birthDesc;

    birthDay = [birth_year, birth_mon, birth_day].reduce((prev, curr) => {
      return prev ? `${prev}-${curr || ""}` : curr;
    }, null);

    const info = infobox?.reduce((prev, curr) => {
      const item = infoKeys.find((v) => curr.key.includes(v.name));
      if (item) {
        if (item.field === "nameCn" && !nameCn) {
          nameCn = curr.value;
        } else if (item.field === "aliasName" && !aliasName) {
          aliasName = curr.value;
        } else if (item.field === "gender" && !gender) {
          gender = curr.value === "男" ? "male" : "female";
        } else if (item.field === "birth") {
          birthDesc = curr.value;
        }
      } else {
        !prev && (prev = {});
        prev[curr.key] = curr.value;
      }
      return prev;
    }, null);

    return {
      ...others,
      info: info && JSON.stringify(info),
      nameCn,
      gender,
      birthDay,
      birthDesc,
      bloodType: blood_type,
      aliasName: aliasName && JSON.stringify(aliasName),
      bgmImages: JSON.stringify(images),
    };
  };

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

    for (const key in images) {
      images[key] = images[key].replace("https://lain.bgm.tv", "");
    }

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
      bgmImages: JSON.stringify(images),
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
          actors: itemCvs?.length
            ? JSON.stringify(itemCvs.map((v) => ({ name: v.name, id: v.id })))
            : null,
          bgmImages: JSON.stringify(images),
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
          summary: isCv ? short_summary : relation,
          bgmImages: JSON.stringify(images),
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
