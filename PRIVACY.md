# 隐私说明

FF14 Chat Overlay 是一个运行于 ACT OverlayPlugin 中的本地聊天记录与查看工具。

## 数据存储

本工具记录的 FF14 聊天消息、组队记录及相关设置均保存在用户本机的 OverlayPlugin Chromium 浏览器存储中，包括：

- IndexedDB：聊天记录、组队记录等
- localStorage：界面设置、频道颜色、自定义分类等

这些数据不会因为使用 GitHub Pages 而上传至本项目的 GitHub 仓库。

## 数据收集

本项目当前：

- 不设服务器数据库
- 不上传聊天记录
- 不上传组队记录
- 不上传玩家昵称
- 不收集用户账号信息
- 不提供遥测或统计功能

项目中的 JavaScript 不会主动将 FF14 聊天数据发送至第三方服务器。

## GitHub Pages

GitHub Pages 仅用于提供本项目运行所需的 HTML、CSS 和 JavaScript 静态文件。

用户的聊天数据仍由用户本机保存。

## 数据删除

用户可以通过工具中的“清空聊天记录”功能删除本地聊天记录。

组队记录目前不会在界面中提供一键清空功能，以降低误删除风险。

## 第三方软件

本工具依赖 ACT、FFXIV_ACT_Plugin 与 OverlayPlugin 才能获取游戏日志。

这些第三方软件的隐私政策及数据处理行为不属于本项目控制范围。
