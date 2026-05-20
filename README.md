# Desktop Calendar Widget

一个基于 Electron + Vue 3 + SQLite 的 Windows 桌面日历与待办应用，支持主窗口和桌面小组件两种使用方式。

## 功能介绍

- 月视图日历：按月展示日期，日期格子里直接显示当天待办。
- 周视图日历：按周查看待办，左右切换上一周/下一周。
- 清单视图：按日期汇总展示所有待办。
- 待办管理：支持按日期添加、勾选完成、删除待办，并选择颜色标签。
- 可选时间段：添加待办时可以选择开始时间和结束时间，展示时显示在待办前面。
- 每周重复：可以选择起止日期、每周几和时间段，批量创建重复待办。
- 完整详情：右侧详情清单里双击待办，可以查看完整长文本。
- 未完成筛选：右侧详情清单支持只看未完成待办。
- 农历与节假日：月视图显示农历、重要传统节日、24 节气、法定节假日和调休/补班标记。
- 中国时间：今天高亮按北京时间 UTC+8 计算，长时间打开跨天后会自动更新。
- 本地持久化：待办数据保存在本机 SQLite 数据库中。
- 明暗主题：支持明亮主题和暗色主题切换，已打开的桌面小组件会同步更新。
- 桌面小组件：可以打开独立桌面组件窗口，展示日历或清单。
- 小组件设置：支持透明度调节、钉住窗口、显示/隐藏右侧详情栏。
- 打包发布：支持生成 Windows 安装包和免安装版本。

## 技术栈

- Electron 29
- Vue 3
- Vite 5
- SQLite
- better-sqlite3
- chinese-days
- electron-builder

## 环境要求

建议环境：

- Windows 10 或 Windows 11
- Node.js 20.x
- npm 10.x

当前项目开发时使用：

- Node.js `20.19.3`
- Electron `29.4.6`
- Vite `5.4.x`

## 安装依赖

```powershell
npm install
```

如果 `better-sqlite3` 原生依赖安装失败，可以重新执行：

```powershell
npm run postinstall
```

## 开发运行

```powershell
npm run dev
```

该命令会同时启动：

- Vite 前端开发服务：`http://localhost:5173`
- Electron 桌面应用窗口

如果 Vite 已经启动，只想单独启动 Electron：

```powershell
npm run dev:electron
```

如果只想启动前端开发服务：

```powershell
npm run dev:vite
```

## 构建前端

```powershell
npm run build
```

构建产物会输出到：

```text
dist/
```

## 打包 Windows 应用

生成安装包：

```powershell
npm run dist
```

打包产物位于：

```text
dist-electron/
```

常见产物：

- `Desktop Calendar Widget Setup 1.0.0.exe`：Windows 安装包。
- `win-unpacked/Desktop Calendar Widget.exe`：免安装版本，需要连同整个 `win-unpacked` 文件夹一起分发。

如果只想生成免安装版本：

```powershell
npx electron-builder --win dir
```

如果只想生成 NSIS 安装包：

```powershell
npx electron-builder --win nsis
```

## 数据存储

开发模式下，数据库文件在项目根目录：

```text
calendar.db
```

生产打包后，每个用户的数据会保存到自己电脑上的 Electron `userData` 目录中，不会使用开发环境里的 `calendar.db`。

因此，把安装包发给别人时，不会包含你的本地待办数据。

## 节假日数据

农历、24 节气、法定节假日和调休/补班信息来自 `chinese-days` 依赖。该数据随依赖版本更新，若国务院发布新的节假日安排，需要更新依赖版本后重新打包。

```powershell
npm update chinese-days
npm run build
npm run dist
```

## 目录说明

```text
electron/             Electron 主进程、预加载脚本、数据库和 IPC
src/                  Vue 前端源码
src/components/       日历、待办等组件
src/pages/            主页面和桌面小组件页面
src/services/         待办数据服务
src/utils/            日期、时间、农历节假日和重复规则工具
dist/                 前端构建产物，不提交
dist-electron/        Electron 打包产物，不提交
calendar.db           开发数据库，不提交
```

## Git 忽略说明

以下内容不会提交到仓库：

- `node_modules/`
- `dist/`
- `dist-electron/`
- `.electron-data/`
- `.codex/`
- `.kiro/`
- `.vscode/`
- `calendar.db`
- `calendar.db-shm`
- `calendar.db-wal`
