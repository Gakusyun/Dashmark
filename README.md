# Dashmark - 极简起始页

一个极简、高性能的起始页网页应用，专注于快速访问收藏的网站。

## 功能特性

- **收藏夹系统**：分组（单层，无嵌套）+ 链接模型，一个链接可属于多个分组
- **搜索功能**：快速跳转到搜索引擎，支持预设和自定义
- **本地存储**：所有数据存储在浏览器 localStorage 中
- **数据备份**：支持导出/导入 JSON 数据文件
- **深色模式**：支持跟随系统或手动切换
- **响应式设计**：支持桌面和移动端
- **模块化架构**：清晰的代码组织和功能分离
- **零依赖**：纯原生 HTML/CSS/JavaScript，无第三方库

## 技术栈

- **构建工具**: Vite
- **HTML5**
- **CSS3**（自定义 CSS 变量实现主题切换，模块化样式）
- **Vanilla JavaScript**（原生 JavaScript，ES 模块）

## 项目结构

```
dashmark/
├── src/
│   ├── app.js                    # 主应用入口
│   ├── storage.js                # 数据存储层（localStorage 操作）
│   ├── modules/                  # 功能模块
│   │   ├── theme.js              # 主题管理
│   │   ├── search.js             # 搜索功能
│   │   ├── bookmarks.js          # 书签展示
│   │   ├── managePanel.js        # 管理面板
│   │   ├── modals.js             # 模态框管理
│   │   ├── linkManager.js        # 链接管理
│   │   ├── groupManager.js       # 分组管理
│   │   └── searchEngineManager.js # 搜索引擎管理
│   └── styles/                   # 样式模块
│       ├── variables.css         # CSS 变量（主题定义）
│       ├── base.css              # 基础样式
│       ├── components.css        # 组件样式
│       ├── layout.css            # 布局样式
│       ├── manage-panel.css      # 管理面板样式
│       ├── modal.css             # 模态框样式
│       └── responsive.css        # 响应式样式
├── dist/                         # 构建输出目录
├── index.html                    # HTML 入口文件
├── package.json                  # 项目配置
└── README.md                     # 项目说明
```

## 开发

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

启动开发服务器，默认地址为 `http://localhost:5173`

### 生产构建

```bash
npm run build
```

构建输出到 `dist/` 目录

### 预览生产构建

```bash
npm run preview
```

### 直接打开

1. 克隆或下载此项目
2. 在浏览器中打开 `index.html`（需确保样式文件路径正确）

## 核心功能使用说明

## 核心功能使用说明

### 模块说明

- **storage.js**: 数据持久化层，提供所有 CRUD 操作
- **modules/theme.js**: 主题切换逻辑（浅色/深色/跟随系统）
- **modules/search.js**: 搜索功能实现
- **modules/bookmarks.js**: 书签展示和交互
- **modules/managePanel.js**: 管理面板整体逻辑
- **modules/modals.js**: 模态框通用功能
- **modules/linkManager.js**: 链接的增删改查
- **modules/groupManager.js**: 分组的增删改查
- **modules/searchEngineManager.js**: 搜索引擎配置管理

### 添加分组和链接

1. 点击页面顶部的 "Dashmark" 打开管理面板
2. 切换到"分组"标签，点击"添加分组"
3. 切换到"链接"标签，点击"添加链接"
4. 在添加链接时，至少选择一个分组（可多选）

### 搜索

1. 在搜索框中输入关键词
2. 点击"搜索"按钮或按 Enter 键跳转
3. 默认搜索引擎在"设置"标签中配置

### 深色模式

- 在管理面板的"设置"标签中切换主题模式
- 默认跟随系统主题

### 自定义搜索引擎

1. 打开管理面板，切换到"设置"标签
2. 在"搜索引擎设置"区域选择默认搜索引擎
3. 点击"添加搜索引擎"自定义新的搜索引擎
4. URL 中使用 `{q}` 作为搜索关键词占位符

### 数据备份

1. 打开管理面板，切换到"数据"标签
2. 点击"导出数据"下载 JSON 备份文件
3. 点击"导入数据"选择备份文件恢复数据

### 分组全屏展示

- 点击分组标题或分组区域可全屏查看该分组的所有链接
- 点击"← 返回全部"返回主页面

## 数据结构

数据以 JSON 格式存储在 localStorage 中：

```json
{
  "groups": [
    {
      "id": "分组ID",
      "name": "分组名称",
      "order": 0
    }
  ],
  "links": [
    {
      "id": "链接ID",
      "title": "链接标题",
      "url": "https://example.com",
      "groupIds": ["分组ID1", "分组ID2"],
      "order": 0
    }
  ],
  "searchEngines": [
    {
      "id": "自定义ID",
      "name": "搜索引擎名称",
      "url": "https://example.com/search?q={q}"
    }
  ],
  "settings": {
    "searchEngine": "google",
    "darkMode": "auto"
  }
}
```

## 浏览器兼容性

- Chrome/Edge (推荐)
- Firefox
- Safari
- 现代浏览器（支持 CSS Grid 和 CSS 变量）

## 设计原则

- **极简**：界面简洁，无多余元素
- **快速**：加载快、交互快、无复杂动画
- **本地优先**：数据存储在本地，不依赖云端
- **零依赖**：不使用任何第三方库
- **开源**：代码清晰，易于理解和扩展

## 许可证

MIT License
