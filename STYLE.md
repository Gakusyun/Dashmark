# DashMark · 样式规范

> 使用 Tailwind CSS v4，所有样式通过 utility class 实现。
> `src/index.css` 只包含：字体引入、`@import 'tailwindcss'`、暗色变体声明、
> 页面基础样式、动画关键帧、滚动条工具类与焦点样式。**不写组件级自定义 CSS。**
>
> 组件样式应优先复用 `src/components/ui/` 下的原语，而不是重复拼装。

## 色彩

**只用 Tailwind 内置色板，不自定义颜色。** 中性色为 `slate`，全站单一强调色为 `sky`。

> 视觉语言与同作者的 [salary-calc](https://github.com/Kailoinf/salary-calc) 保持一致：
> `sky` 强调色、纯白/纯黑底、`slate` 中性色、细边框 + 极淡阴影。改动配色前请先看该项目的 `STYLE.md`。

| 用途 | class |
|------|-------|
| 页面背景 | 由 `body` 指定（浅 `#ffffff` / 深 `#000000`），不在组件里写 |
| 卡片/面板背景 | `bg-white`（深色 `dark:bg-black`） |
| 主体文字 | `text-slate-800` / `text-slate-900`（深色 `dark:text-slate-100`） |
| 次要文字 | `text-slate-500` / `text-slate-400` |
| 占位/极弱文字 | `text-slate-400`（深色 `dark:text-slate-500`） |
| 边框 | `border-slate-200` / `border-slate-300`（深色 `dark:border-slate-600` / `dark:border-slate-700`） |
| 强调色（主按钮/聚焦） | `sky` 系列：`bg-sky-600`、`border-sky-500`、`text-sky-600` |
| 强调色浅底 | `bg-sky-50`（深色 `dark:bg-sky-950/40`） |
| 危险操作 | `rose` 系列：`bg-rose-600`、`text-rose-600`、`hover:bg-rose-50` |
| 成功 / 警告 | `emerald` / `amber`，仅用于状态提示与 Toast |

**禁止**：引入新的色相；或用「每个组件一个语义变量」这类未被使用的抽象色板
（历史上 `@theme` 里曾声明一批语义色变量但零处引用，已移除）。

## 组件复用

共享原语位于 `src/components/ui/`，**先查这里再动手写**：

| 组件 | 用途 |
|------|------|
| `Button` | 所有按钮。`variant`: primary / secondary / ghost / subtle / danger；`size`: sm / md / lg / icon / icon-sm；支持 `loading`、`icon` |
| `Modal` | 所有对话框。portal 渲染、锁定滚动、Esc 分层关闭、`footer` 插槽；`size`: sm / md / lg |
| `Menu` | 右键菜单与「更多操作」浮层，自动避让视口 |
| `Field` / `Input` / `Textarea` | 表单字段；`Field` 负责 label + hint 版式 |
| `Switch` / `Segmented` | 开关与分段控件 |
| `Favicon` | 网站图标，失败时回退为首字母色块 |
| `Icons.tsx` | 全部图标出口，按语义命名（`PlusIcon`、`TrashIcon`…） |

图标**必须**从 `./Icons` 导入，不要直接从 `lucide-react` 引入。

## 输入框

统一样式由 `ui/Field.tsx` 的 `baseField` 常量提供，勿手写：

```
w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm
focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500
dark:border-slate-600 dark:bg-black
```

> ⚠️ 输入类元素**不要**再叠全局 `outline`——那会出现「双框」。
> 全局 `:focus-visible` 已排除 `input/textarea/select`，焦点由边框变色 + 淡 ring 表达。

## 圆角

| 元素 | class |
|------|------|
| 对话框、大图标方块 | `rounded-2xl` |
| 卡片、面板、列表容器、命令栏 | `rounded-xl` |
| 按钮、菜单项、输入框 | `rounded-lg` |
| 标签块、小方块图标、菜单项内小控件 | `rounded-md` |
| 头像、计数徽标、FAB | `rounded-full` |

## 间距

| 用途 | class |
|------|-------|
| 页面容器 | `mx-auto w-full max-w-6xl px-4 py-5` |
| 顶栏 | `px-3 py-3 sm:px-4` |
| 卡片网格 | `gap-2.5` |
| 卡片内边距 | `p-3.5` |
| 面板内边距 | `p-4` / `px-5 py-4`（Modal） |
| 表单字段间距 | `space-y-4` |
| 区块（Section）间距 | `space-y-8`，内部 `space-y-3` |
| 管理台内容区 | `max-w-4xl px-4 py-5 sm:px-6` |

## 层级（z-index）

| 层 | 值 |
|----|----|
| 吸顶顶栏 | `z-30` |
| 搜索建议面板 | `z-40` |
| 移动端 FAB | `z-20` |
| 管理台整屏 | `z-[9980]` |
| 右键菜单 / 浮层 | `z-[9990]` |
| 模态框 | `z-[9995]` |
| Toast | `z-[9999]` |

## 动效

- 入场动画统一用 `index.css` 中的 `animate-fade-in` / `animate-rise` / `animate-pop`。
- 颜色、边框、阴影过渡用 `transition-colors` 或 `transition-[border-color,box-shadow]`，
  时长默认 150ms。
- 全局已尊重 `prefers-reduced-motion`，无需在组件内单独处理。
- **不要**为纯装饰添加动画。

## 响应式

- 断点只用 Tailwind 默认值，最常用 `sm:`(640) 与 `lg:`(1024)。
- 移动端优先：先写窄屏样式，再用 `sm:`/`lg:` 增强。
- 收藏网格列数：移动端 2 列 → `lg` 3 列 → `xl` 4 列（移动端保持两列以确保信息密度）。
- 顶栏在窄屏收敛：`+` 按钮隐藏（由 FAB 承担），只保留 logo、命令栏、设置、主题。
- 管理台：桌面左导航（`sm:w-56`），移动端顶部横向导航。

## 可访问性

- 仅图标按钮**必须**有 `aria-label`。
- 可点击的 `div` 必须带 `role="button"`、`tabIndex={0}`，并处理 Enter / Space。
- 状态性控件用 `aria-pressed` / `aria-selected` / `aria-current` / `aria-checked`。
- 焦点可见性由全局 `:focus-visible` 提供，不要用 `outline-none` 抹掉而不给替代方案。

## 弹窗

- 一律使用 `ui/Modal`（内部 `createPortal` 到 `document.body`）。
- 打开时锁定 `document.body.style.overflow`（Modal 已处理）。
- 打开时聚焦首个输入框（编辑器场景），由组件在挂载后 `setTimeout` 聚焦。
- **表单重置**不要在 `useEffect` 里 `setState`；采用「打开时才挂载 + `key` 区分编辑对象」，
  见 `BookmarkEditor.tsx`。

## 禁止事项

- ❌ 不在 `index.css` 写组件级自定义 CSS（全局基础样式除外）
- ❌ 不使用 inline `style`（除动态计算的尺寸/色相，如 `Favicon` 的首字母底色）
- ❌ 不引入新的颜色值——只用 Tailwind 默认 `slate / sky / rose / emerald / amber`
- ❌ 不新建共享组件前先检查 `ui/` 是否已有
- ❌ 不把 `hidden` 直接传给 `Button`（基础类的 `inline-flex` 会覆盖它）——
  用外层 `<span className="hidden sm:inline-flex">` 包裹
- ❌ 不从 `lucide-react` 直接导入图标，统一走 `Icons.tsx`
- ❌ 监听 Escape 的新浮层必须接入 `utils/escapeStack.ts`，否则会一次关掉多层
