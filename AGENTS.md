# AGENTS.md

面向 AI 编码代理的项目说明。人类贡献者也可参考。

## 项目是什么

DashMark 是一个**纯前端、本地优先**的书签起始页应用。用户可以按分组整理链接与文字记录，
通过统一的命令栏快速检索或直接发起网络搜索。所有数据保存在浏览器 IndexedDB 中，不上传服务器。

- 技术栈：React 19 + TypeScript + Tailwind CSS v4 + Vite + Dexie(IndexedDB)
- 产品基调：安静、迅速、不打扰。界面应保持克制，避免装饰性噪音。
- 语言：**界面文案、代码注释均使用简体中文**。新增文案请保持中文与既有语气一致。

## 常用命令

```bash
pnpm dev        # 启动开发服务器 (http://localhost:5173)
pnpm build      # tsc -b 全量类型检查 + 生产构建（提交前必须通过）
pnpm lint       # oxlint（提交前应无 error）
pnpm preview    # 预览生产构建
```

> 仓库使用 pnpm（见 `packageManager` 字段）。请勿提交 `pnpm-lock.yaml` 以外的锁文件。

## 目录结构

```
src/
  App.tsx                  应用外壳：顶栏、分组标签、内容网格、各浮层编排
  main.tsx                 入口，Provider 组合（ErrorBoundary > Data > Theme > Toast）
  index.css                Tailwind 入口、主题变量、动画与滚动条工具类
  types/index.ts           全部领域类型（Bookmark 是核心统一类型）
  contexts/
    DataContext.tsx        唯一的数据源与全部写操作（增删改、导入导出）
    ThemeContext.tsx       light / dark / auto 主题，写入 <html>.dark
    ToastContext.tsx       轻量提示
  hooks/
    useConfirmDialog.tsx   命令式确认框，返回 confirm + ConfirmDialog
                           （取消按钮 / Esc / 点遮罩都会触发 onCancel）
    useBatchSelection.ts   列表多选
    usePinyin.ts           按需加载拼音库（首屏不加载）
    useDebouncedValue.ts   防抖
  components/
    CommandBar.tsx         统一命令栏（页内检索 + 网络搜索，核心交互）
    GroupTabs.tsx          分组切换条
    BookmarkGrid.tsx       首页收藏网格 + 空状态
    BookmarkCard.tsx       链接卡片（favicon + 域名 + 悬停操作 + 右键菜单）
    TextRecordCard.tsx     文字记录卡片 + 阅读/编辑弹窗
    BookmarkEditor.tsx     新建/编辑表单（链接与文字共用）
    GroupPicker.tsx        分组多选 + 就地新建
    Manager.tsx            整屏管理台（左导航 + 右内容）
    BookmarkManager.tsx    收藏管理：筛选、批量、排序
    GroupManager.tsx       分组管理：增删改、排序
    SettingsPanel.tsx      设置：外观 / 搜索 / 数据
    About.tsx              关于与更新日志
    DraggableItemList.tsx  拖拽排序（鼠标 + 触摸）
    ErrorBoundary.tsx      顶层错误边界
    Icons.tsx              图标统一出口（lucide 语义化别名）
    ui/                    通用原语：Button / Modal / Menu / Field / Favicon
  utils/
    storage.ts             IndexedDB 读写、v1→v2 迁移、导入导出与校验
    searchScorer.ts        检索打分与排序（含拼音）
    urlValidator.ts        URL 合法性与协议安全（拒绝 javascript: 等）
    urlDisplay.ts          域名提取、favicon 地址、首字母与配色
    escapeStack.ts         Escape 分层（见下方"易错点"）
    cn.ts                  className 合并
```

## 数据模型与兼容性

核心类型定义在 `src/types/index.ts`：

- `Group { id, name, order }` — 单层分组
- `Bookmark { id, type: 'link'|'text', title, groupIds[], order, url?, content?, tags?, createdAt?, updatedAt? }`
  — 链接与文字记录共用同一类型，用 `type` 区分
- `Settings { searchEngine, darkMode, hideLegalInfo, cookieConsent }`
- `Data { version, groups, bookmarks, searchEngines, settings }`

**兼容性要求（重要）**：

- 存储格式与 v2/v3 保持一致，用 Dexie 存在 `DashmarkDB`。修改数据结构时必须提供迁移路径，
  不能破坏既有用户数据。
- `storage.ts` 支持从 v1 的 `localStorage['dashmark_data']` 迁移，勿删该逻辑。
- 导入文件同时支持 `.json` 与 `.json.gz`，校验逻辑（长度、数量、层级、URL 安全）不得削弱。
- `Bookmark.groupIds` 为空即代表"不属于任何分组"；删除分组时，仅属于该分组的收藏会被删除。

## 设计约定

> 完整的样式规范（色彩、圆角、间距、层级、禁止事项）见根目录 **[`STYLE.md`](./STYLE.md)**，
> 改动 UI 前请先阅读。以下仅列关键原则。

- **色彩**：中性灰基底 + 单一强调色 `sky`（`sky-600`）。语义色仅用于状态
  （rose=危险、emerald=成功、amber=警告）。不要为装饰引入新色相。
  视觉语言与同作者的 [salary-calc](https://github.com/Kailoinf/salary-calc) 一致：
  同一套 `sky` 强调色、纯白/纯黑底、`slate` 中性色、细边框 + 极淡阴影。
- **图标**：全部经 `components/Icons.tsx` 导入，按语义命名（如 `PlusIcon`、`TrashIcon`）。
  不要在业务组件里直接从 `lucide-react` 导入。品牌图标（GitHub）以 inline SVG 提供。
- **圆角/层次**：卡片与面板用 `rounded-xl`，控件 `rounded-lg`。层次靠边框与极淡阴影表达，
  避免重投影。
- **交互可达性**：
  - 所有仅图标按钮必须有 `aria-label`。
  - 卡片等可点击的 `div` 需带 `role="button"`、`tabIndex={0}` 与 Enter/Space 处理。
  - 键盘焦点样式由 `index.css` 的 `:focus-visible` 统一提供（输入类元素除外）。
- **动效**：使用 `animate-fade-in` / `animate-rise` / `animate-pop`。已全局尊重
  `prefers-reduced-motion`。
- **性能**：拼音库（`pinyin-pro`，约 300KB）必须保持动态加载，经 `usePinyin` 按需引入。

## 易错点（踩过的坑）

1. **`hidden` 与 Button 冲突**
   `Button` 基础类包含 `inline-flex`。若在 `className` 里传 `hidden`，由于两者都设置
   `display`，最终生效取决于 CSS 输出顺序，`hidden` 常被覆盖。
   → 需要响应式隐藏时，**用外层 `<span className="hidden sm:inline-flex">` 包裹**，
   不要直接把 `hidden` 传给 `Button`。

2. **嵌套浮层的 Escape 键**
   Modal 可能嵌套在 Manager 内。浏览器对同一事件目标（`window`）的多个监听器，
   `stopPropagation()` 不会阻止其他监听器，且执行顺序按注册顺序 —— 会导致一次 Esc
   关掉两层。
   → 统一使用 `utils/escapeStack.ts`：每层打开时 `pushEscapeLayer()`，处理前用
   `isTopEscapeLayer()` 判断自己是否是最上层，卸载时 `popEscapeLayer()`。
   **新增任何监听 Escape 的浮层都必须接入此机制。**

3. **表单状态重置**
   不要在 `useEffect` 里根据 `open` 同步 `setState` 来重置表单（会触发级联渲染并被 lint 警告）。
   → 采用"打开时才挂载 + `key` 区分编辑对象"的模式，见 `BookmarkEditor.tsx`。

4. **派生状态优先于 effect**
   能由现有 state/props 计算出的值，直接在渲染期派生（如 `App.tsx` 的 `effectiveGroup`），
   不要用 `useState` + `useEffect` 同步。

5. **搜索打分**
   `searchScorer.ts` 按 token 做 AND 匹配，任一 token 未命中即整体不匹配。
   修改打分权重时注意保持"标题 > 网址 > 正文 > 拼音 > 分组名"的优先级。

6. **输入框的双框问题**
   全局 `:focus-visible` 会给元素加 outline。输入类元素自身已用边框变色表达焦点，
   若再叠 outline 或额外的 ring 就会出现"双框"。
   → `index.css` 已将 `input/textarea/select` 从 `:focus-visible` 中排除；
   命令栏等复合输入框统一用 `focus:outline-none focus-visible:outline-none` 并只保留
   外层容器的单一边框 + 淡 ring。

## 测试

项目暂无自动化测试框架。此前用 Chromium + Chrome DevTools Protocol 做过端到端冒烟验证，
覆盖：空状态、Cookie 同意、分组/收藏的增删改、命令栏搜索与键盘导航、Esc 行为、主题切换、
管理台四个页面。修改核心交互后建议至少手动回归以下路径：

- 首页 → 新建分组 → 新建链接/文字收藏 → 卡片可打开
- 命令栏：输入过滤、↑↓ 选择、Enter 打开、Esc 清空、无匹配时提示网络搜索
- 管理台：四个页面可切换；在弹窗内按 Esc 只关弹窗、不关管理台
- 明暗主题切换、移动端（<640px）顶栏与 FAB 布局

## 提交前检查

1. `pnpm build` 通过（含 TypeScript 全量检查）
2. `pnpm lint` 无 error（唯一允许的 warning 是 `ThemeContext.tsx` 的 fast-refresh 提示）
3. 未引入未使用的导入/变量（`noUnusedLocals` 已开启，构建会拦截）
4. 若改动了存储结构，确认旧数据仍可读取
