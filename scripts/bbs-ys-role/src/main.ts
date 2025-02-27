import { request, storage } from "remio-script-utils";
import $ from "jquery";
import { GM } from "vite-plugin-monkey/dist/client";

let params: any = null;

const BaseUrl = process.env.BASE_URL;

const onAppend = (ele: string, data: string) => $(ele).append(data);

const init = () => {
  const $button = $("<button>", {
    id: "mio-button",
    text: "Mio",
  });

  $button.click(() => onOpenModal());

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

  GM.addStyle(`
      .modal {
          display: none; /* 默认隐藏 */
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 500px;
          background-color: #010101;
          box-shadow: 0 0 15px rgba(0, 0, 0, 0.5);
          padding: 20px;
          border-radius: 10px;
          z-index: 1000;
      }
      .modal-title {
          color: white;      
      }
      .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 18px;
          font-weight: bold;
      }
      .submit-btn {
        padding: 6px 16px;
        font-size: 12px;
        background-color: #f09199;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
      }
      .close-btn {
          cursor: pointer;
          color: white;
          font-size: 24px;
      }
      .modal-body {
          margin: 20px 0;
          min-height: 200px;
      }
      .modal-body > p, .modal-body span{
          font-size: 14px;
          color: white;
      }
      .modal-footer {    
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 16px;
      }
      .overlay {
          display: none; /* 默认隐藏 */
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          z-index: 999;
      }
      .open-modal-btn {
          padding: 10px 20px;
          font-size: 16px;
          cursor: pointer;
      }
      input {
        outline: none;
        border: none;
        color: white;
        background-color: rgba(255, 255, 255, .3);
        flex: 1;
        border-radius: 8px;
        padding: 6px 8px;
      }
      .apis {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 16px 0;
      }
      .apis > p {
        display: flex;
        flex-direction: row;
        gap: 4px;    
        align-items: center;
      }
  `);

  $("body").append($button);
};

const onLoading = (loading = true) => {
  const $submit = $("#apisubmit");
  $submit &&
    $submit.attr({
      disabled: loading,
    });
};

const onSubmit = () => {
  const RApi = $("#RApi").val();
  const WApi = $("#WApi").val();
  storage.set("RoleApi", RApi);
  storage.set("WeaponApi", WApi);
  onLoading();
  /** 更新角色 */
  const roleRes = !!RApi
    ? request({
        method: "POST",
        url: RApi as string,
        headers: { "Content-Type": "application/json" },
        data: JSON.stringify(params.rolesVo),
      })
    : null;

  /** 更新武器 */
  const weaponRes = !!WApi
    ? request({
        method: "POST",
        url: WApi as string,
        headers: { "Content-Type": "application/json" },
        data: JSON.stringify(params.weaponsVo),
      })
    : null;
  if ($(".msg-tip")) $(".modal-body .msg-tip")?.remove();
  Promise.all([roleRes, weaponRes].filter((v) => !!v))
    .then(([res1, res2]: any) => {
      console.log("请求结果~", res1, res2);
      if (res1 && res2 && res1.success && res2.success) {
        onAppend(
          "div.modal-body",
          "<p class='msg-tip' style='color: #69f769;'>发送数据成功！</p>"
        );
      } else if (res1 && res1.success && WApi) {
        onAppend(
          "div.modal-body",
          "<p class='msg-tip'>角色发送数据成功！武器发送数据失败</p>"
        );
      } else if (res2 && res2.success && RApi) {
        onAppend(
          "div.modal-body",
          "<p class='msg-tip'>武器发送数据成功！角色发送数据失败</p>"
        );
      } else {
        onAppend(
          "div.modal-body",
          "<p class='msg-tip' style='color: red;'>都发送数据失败惹</p>"
        );
      }
    })
    .catch((e) => {
      onAppend(
        "div.modal-body",
        `<p class='msg-tip' style='color: red;'>发送数据失败惹：${
          e?.statusText || e
        }</p>`
      );
    })
    .finally(() => onLoading(false));
};

const onGetData = () => {
  onAppend("div.modal-body", "<p>开始加载数据...</p>");
  onLoading();
  request({
    method: "GET",
    url: `https://api-takumi-static.mihoyo.com/common/blackboard/ys_obc/v1/home/content/list?app_sn=ys_obc&channel_id=189`,
  })
    .then((res: any) => {
      if (res.message === "OK") {
        const {
          data: { list },
        } = res;
        let rolesVo: any = [];
        let weaponsVo: any = [];
        if (list && list[0]) {
          const roles = list[0].children.find((v: any) => v.id == 25);
          const weapons = list[0].children.find((v: any) => v.id == 5);
          rolesVo = formatRoles(roles.list);
          weaponsVo = formatWeapons(weapons.list);
          params = { rolesVo, weaponsVo };
          console.log(rolesVo, weaponsVo);
        }
        onAppend(
          "div.modal-body",
          `<p>加载成功，角色${rolesVo.length}条数据，武器${weaponsVo.length}条数据</p>`
        );
        onAppend(
          "div.modal-body",
          `<div class="apis">
            <p><span>角色接口：</span><input id="RApi" type="text" placeholder="角色提交接口" /></p>
            <p><span>武器接口：</span><input id="WApi" type="text" placeholder="武器提交接口" /></p>
          </div>`
        );
      } else {
        onAppend("div.modal-body", "<p>加载数据失败</p>");
        console.log("获取数据失败：", res);
      }
    })
    .then(async () => {
      const RoleApi = await storage.get(
        "RoleApi",
        `${BaseUrl}/ys/updateRoles?queryId=true`
      );
      const WeaponApi = await storage.get(
        "WeaponApi",
        `${BaseUrl}/ys/updateWeapons?queryId=true`
      );
      $("#RApi").val(RoleApi as string);
      $("#WApi").val(WeaponApi as string);
    })
    .catch((e) => console.log(e))
    .finally(() => onLoading(false));
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

const onClear = (ele: string) => $(ele).html("");

const onCloseModal = () => {
  params = null;
  onLoading(false);
  onClear("div.modal-body");
  $(".overlay, .modal").fadeOut();
};

const onOpenModal = () => {
  $(".overlay, .modal").fadeIn();
  onGetData();
};

// 动态生成弹框的HTML结构
$("body").append(`
  <div class="overlay"></div>
  <div class="modal">
      <div class="modal-header">
          <span class="modal-title">添加</span>
          <span class="close-btn">&times;</span>
      </div>
      <div class="modal-body">
      </div>
      <div class="modal-footer">
          <button id="apisubmit" class="submit-btn">提交</button>
      </div>
  </div>
`);

$(".close-btn").on("click", onCloseModal);

$(".submit-btn").on("click", onSubmit);

init();
