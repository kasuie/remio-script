import { GM } from "vite-plugin-monkey/dist/client";
import $ from "jquery";

const BASE_URL = process.env.BASE_URL;

const request = (options: any) => {
  return new Promise((resolve, reject) => {
    if (!options.method) {
      options.method = "get";
    }
    if (!options.timeout) {
      options.timeout = 10000;
    }
    options.onload = function (res: any) {
      try {
        resolve(JSON.parse(res.responseText));
      } catch (error) {
        reject(false);
      }
    };
    options.onerror = function (e: any) {
      reject(e);
    };
    options.ontimeout = function () {
      reject(false);
    };
    GM.xmlHttpRequest(options);
  });
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

  $("body").append($button);
};

const onSubmit = () => {
  request({
    method: "GET",
    url: `https://api-takumi-static.mihoyo.com/common/blackboard/ys_obc/v1/home/content/list?app_sn=ys_obc&channel_id=189`,
  })
    .then((res: any) => {
      if (res.message === "OK") {
        const {
          data: { list },
        } = res;
        if (list && list[0]) {
          const roles = list[0].children.find((v: any) => v.id == 25);
          const weapons = list[0].children.find((v: any) => v.id == 5);
          const rolesVo = formatRoles(roles.list);
          const weaponsVo = formatWeapons(weapons.list);
          console.log(rolesVo, weaponsVo);
          /** 更新角色 */
          const roleRes = request({
            method: "POST",
            url: `${BASE_URL}/ys/updateRoles?queryId=true`,
            headers: { "Content-Type": "application/json" },
            data: JSON.stringify(rolesVo),
          });

          /** 更新武器 */
          const weaponRes = request({
            method: "POST",
            url: `${BASE_URL}/ys/updateWeapons?queryId=true`,
            headers: { "Content-Type": "application/json" },
            data: JSON.stringify(weaponsVo),
          });

          Promise.all([roleRes, weaponRes])
            .then(([res1, res2]) => {
              console.log("请求结果~", res1, res2);
            })
            .catch((e) => console.log("请求失败：", e));
        }
      } else {
        console.log("获取数据失败：", res);
      }
    })
    .catch((e) => console.log(e));
};

const formatWeapons = (list: any) => {
  if (!Array.isArray(list)) return null;
  const getWays = [
    "祈愿",
    "活动",
    "商店",
    "商城兑换",
    "锻造",
    "珍珠纪行",
    "宝箱",
    "初始武器",
  ];
  const allAttrs = [
    "攻击力",
    "元素精通",
    "暴击率",
    "暴击伤害",
    "物理伤害加成",
    "防御力",
    "元素充能效率",
    "生命值",
    "移动速度",
    "攻击速度",
    "护盾强效",
    "元素伤害",
  ];
  return list.reverse().map((v) => {
    let { title, content_id, icon, summary, ext } = v;
    let star = 0,
      weaponType = 0,
      getWay = "",
      attrs = "",
      disabled = false;
    if (ext) {
      if (ext.includes("星级/四星")) {
        star = 4;
      } else if (ext.includes("星级/五星")) {
        star = 5;
      } else if (ext.includes("星级/三星")) {
        star = 3;
      } else if (ext.includes("星级/二星")) {
        star = 2;
      } else if (ext.includes("星级/一星")) {
        star = 1;
      }
      if (ext.includes("武器/单手剑")) {
        weaponType = 1;
      } else if (ext.includes("武器/双手剑")) {
        weaponType = 2;
      } else if (ext.includes("武器/弓")) {
        weaponType = 3;
      } else if (ext.includes("武器/长柄武器")) {
        weaponType = 4;
      } else if (ext.includes("武器/法器")) {
        weaponType = 5;
      }
      getWay = getWays.filter((w) => ext.includes(w))?.join(",") || "";
      attrs = allAttrs.filter((a) => ext.includes(a))?.join(",") || "";
    }
    return {
      weaponName: title,
      contentId: content_id,
      icon,
      summary,
      star,
      attrs,
      getWay,
      weaponType,
      disabled,
    };
  });
};

const formatRoles = (list: any) => {
  if (!Array.isArray(list)) return null;
  return list.reverse().map((v) => {
    let { title, content_id, icon, summary, ext } = v;
    let star = 0,
      element = 0,
      area = 0,
      weaponType = 0,
      disabled = false;
    if (ext) {
      if (ext.includes("星级/四星")) {
        star = 4;
      } else if (ext.includes("星级/五星")) {
        star = 5;
      }
      if (title == "旅行者") {
        element = -1;
      } else if (ext.includes("元素/冰")) {
        element = 1;
      } else if (ext.includes("元素/草")) {
        element = 2;
      } else if (ext.includes("元素/火")) {
        element = 3;
      } else if (ext.includes("元素/水")) {
        element = 4;
      } else if (ext.includes("元素/风")) {
        element = 5;
      } else if (ext.includes("元素/雷")) {
        element = 6;
      } else if (ext.includes("元素/岩")) {
        element = 7;
      }
      if (ext.includes("地区/蒙德")) {
        area = 1;
      } else if (ext.includes("地区/璃月")) {
        area = 2;
      } else if (ext.includes("地区/稻妻")) {
        area = 3;
      } else if (ext.includes("地区/须弥")) {
        area = 4;
      } else if (ext.includes("地区/枫丹")) {
        area = 5;
      } else if (ext.includes("地区/至冬")) {
        area = 6;
      }
      if (ext.includes("武器/单手剑")) {
        weaponType = 1;
      } else if (ext.includes("武器/双手剑")) {
        weaponType = 2;
      } else if (ext.includes("武器/弓")) {
        weaponType = 3;
      } else if (ext.includes("武器/长柄武器")) {
        weaponType = 4;
      } else if (ext.includes("武器/法器")) {
        weaponType = 5;
      }
    }
    if (title.includes("【预告】")) {
      disabled = true;
      title = title.replace("【预告】", "");
    }
    return {
      role: title,
      contentId: content_id,
      icon,
      summary,
      star,
      element,
      area,
      weaponType,
      disabled,
    };
  });
};

init();
