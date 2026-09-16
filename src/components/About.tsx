import packageJson from '../../package.json';
import { GitHubIcon } from './Icons';

interface Entry {
  version: string;
  items: string[];
}

const CHANGELOG: Entry[] = [
  {
    version: '3.2.0',
    items: [
      '全新的统一命令栏：一个输入框同时完成页内检索与网络搜索',
      '分组改为顶部标签栏，切换无需跳转与返回',
      '收藏卡片改用网站图标与域名，支持悬停操作与右键菜单',
      '管理台改为整屏布局，左侧导航，新增筛选、批量与排序',
      '文字记录改用弹窗阅读/编辑，保留页面上下文',
      '全面重绘图标与视觉，去掉 Material 风格残留',
    ],
  },
  {
    version: '3.1.0',
    items: ['迁移至 Tailwind CSS，移除 Material UI 依赖'],
  },
  {
    version: '2.0.0',
    items: ['迁移至 IndexedDB 存储，支持更大数据量', '新增 PWA 支持，可添加到主屏幕'],
  },
];

export const About: React.FC = () => {
  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">DashMark</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          链接有序，即刻可达。一个安静的起始页：把常用链接收进分组，用键盘快速抵达。
        </p>
        <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">版本 {packageJson.version}</p>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">快捷键</h3>
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 dark:divide-slate-700 dark:border-slate-700">
          {[
            ['Ctrl / ⌘ + K', '聚焦命令栏'],
            ['/', '聚焦命令栏（未在输入时）'],
            ['↑ / ↓', '在搜索结果间移动'],
            ['Enter', '打开选中项'],
            ['Ctrl / ⌘ + Enter', '用搜索引擎搜索当前关键词'],
            ['Esc', '清空搜索 / 关闭弹层'],
          ].map(([keys, desc]) => (
            <li key={keys} className="flex items-center gap-3 px-3 py-2">
              <kbd className="min-w-[7.5rem] rounded border border-slate-200 px-2 py-1 font-sans text-xs font-medium text-slate-500 dark:border-slate-700 dark:text-slate-400">
                {keys}
              </kbd>
              <span className="text-sm text-slate-600 dark:text-slate-300">{desc}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">技术栈</h3>
        <div className="flex flex-wrap gap-2">
          {['React 19', 'TypeScript', 'Tailwind CSS', 'Vite', 'Dexie', 'PWA'].map((tech) => (
            <span
              key={tech}
              className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400"
            >
              {tech}
            </span>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">链接</h3>
        <div className="flex flex-col gap-2 text-sm">
          <a
            href="https://github.com/Gakusyun/Dashmark"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sky-600 hover:underline dark:text-sky-400"
          >
            <GitHubIcon size={16} />
            GitHub 仓库
          </a>
          <a
            href="https://start.gxj62.cn"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-600 hover:underline dark:text-sky-400"
          >
            稳定版 (master)
          </a>
          <a
            href="https://next.gxj62.cn"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-600 hover:underline dark:text-sky-400"
          >
            预览版 (beta)
          </a>
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">更新日志</h3>
        <div className="space-y-4">
          {CHANGELOG.map((entry) => (
            <div key={entry.version}>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                v{entry.version}
              </p>
              <ul className="mt-1 space-y-0.5">
                {entry.items.map((item) => (
                  <li
                    key={item}
                    className="flex gap-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400"
                  >
                    <span className="text-slate-300 dark:text-slate-600">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
