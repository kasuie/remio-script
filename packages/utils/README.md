# 油猴插件开发工具包 ✨

## 安装

```shell
npm i -D remio-script-utils
```

# 使用方法

```js
import { request } from "remio-script-utils";
request({
  method: "GET",
  url: `your_api`,
})
  .then((res) => {
    console.log(res);
  })
  .catch((e) => console.log(e));
```
