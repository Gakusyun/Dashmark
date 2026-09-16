import packageJson from '../../package.json';
import { GitHubIcon } from './Icons';

function Chip({ label, outlined = false }: { label: string; outlined?: boolean }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs ${
        outlined
          ? 'border border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-300'
          : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
      }`}
    >
      {label}
    </span>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mt-4 mb-2 text-base font-semibold text-slate-900 dark:text-white">{children}</h3>
  );
}

export const About: React.FC = () => {
  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">关于 DashMark</h2>

      <div className="mb-4">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          DashMark
          是一个专注于分组书签的极简起始页应用。它安静、迅速、不打扰，只在你需要时，将你带到正确的地方。
          <br />
          <a
            href="https://start.gxj62.cn"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            master分支
          </a>
          <br />
          <a
            href="https://next.gxj62.cn"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            beta分支
          </a>
        </p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          版本 {packageJson.version}
        </p>
      </div>

      <hr className="my-4 border-slate-200 dark:border-slate-700" />

      <SectionTitle>核心功能</SectionTitle>
      <div className="mb-4 flex flex-wrap gap-2">
        <Chip label="📁 分组管理" />
        <Chip label="🔍 快速搜索" />
        <Chip label="🌙 深色主题" />
        <Chip label="💾 数据备份" />
        <Chip label="🔖 自定义搜索引擎" />
      </div>

      <hr className="my-4 border-slate-200 dark:border-slate-700" />

      <SectionTitle>技术栈</SectionTitle>
      <div className="mb-4 flex flex-wrap gap-2">
        <Chip label="React 19" outlined />
        <Chip label="TypeScript" outlined />
        <Chip label="Tailwind CSS" outlined />
        <Chip label="Vite" outlined />
      </div>

      <hr className="my-4 border-slate-200 dark:border-slate-700" />

      <SectionTitle>相关链接</SectionTitle>
      <div className="mb-4 flex flex-col gap-2">
        <a
          href="https://github.com/Gakusyun/Dashmark"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          <GitHubIcon size={16} />
          GitHub 仓库
        </a>
      </div>

      <hr className="my-4 border-slate-200 dark:border-slate-700" />

      <SectionTitle>更新日志</SectionTitle>
      <div className="flex flex-col gap-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        <p>3.1.0</p>
        <p>迁移至 Tailwind CSS，移除 Material UI 依赖</p>
        <p>2.2.0</p>
        <p>修复 TypeScript 编译错误（MUI v9 兼容、未使用导入）</p>
        <p>修复搜索引擎删除后默认切换不一致</p>
        <p>修复文字记录编辑后内容不刷新</p>
        <p>修复 storage-v2 硬编码版本号和默认搜索引擎</p>
        <p>修复 updateBookmark 可能丢失字段的问题</p>
        <p>新增搜索框清除按钮</p>
        <p>优化拼音库动态加载，避免重复请求</p>
        <p>2.1.0</p>
        <p>修复搜索占位符模板解析、全选切换、状态变异等问题</p>
        <p>新增文字记录全屏编辑功能</p>
        <p>修复 MUI v9 图标兼容性问题</p>
        <p>清理冗余代码，优化构建产物</p>
        <p>2.0.0</p>
        <p>迁移至 IndexedDB 存储，支持更大数据量</p>
        <p>新增 PWA 支持，可添加到主屏幕</p>
        <p>修复已知 Bug</p>
        <p>1.4.0</p>
        <p>新增App离线可用，防止服务器问题到处资料无法取回</p>
        <p>修复已知 Bug</p>
        <p>1.3.0</p>
        <p>新增页内查找功能</p>
        <p>修复已知 Bug</p>
      </div>
    </div>
  );
};
