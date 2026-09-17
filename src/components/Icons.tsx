/**
 * 图标统一导出
 *
 * 全部基于 lucide-react，按"语义"命名而非按 MUI 旧名命名。
 * 组件只从这里导入，便于将来整体替换图标方案。
 */
export {
  // 导航 / 结构
  Settings as SettingsIcon,
  Bookmark as BookmarkTabIcon,
  FolderClosed as GroupTabIcon,
  Info as AboutTabIcon,
  ChevronLeft as BackIcon,
  ChevronDown as CaretDownIcon,
  ChevronRight as CaretRightIcon,
  LayoutGrid as GridIcon,
  List as ListIcon,
  Layers as AllIcon,

  // 动作
  Plus as PlusIcon,
  X as CloseIcon,
  Search as SearchIcon,
  Pencil as EditIcon,
  Trash2 as TrashIcon,
  Copy as CopyIcon,
  Check as CheckIcon,
  CheckCheck as CheckAllIcon,
  GripVertical as DragHandleIcon,
  Save as SaveIcon,
  CornerDownLeft as EnterIcon,
  ExternalLink as OpenExternalIcon,
  MoreHorizontal as MoreIcon,
  MoreVertical as MoreVerticalIcon,
  Filter as FilterIcon,
  ArrowUpDown as SortIcon,

  // 状态 / 反馈
  AlertTriangle as WarningIcon,
  CircleAlert as ErrorIcon,
  CircleCheck as SuccessIcon,
  Info as InfoIcon,
  Loader2 as SpinnerIcon,

  // 内容类型
  Link2 as LinkIcon,
  FileText as TextIcon,
  Globe as GlobeIcon,
  Lock as LockIcon,

  // 数据
  Download as ExportIcon,
  Upload as ImportIcon,
  Database as DataIcon,
  Palette as ThemeIcon,
  Keyboard as KeyboardIcon,

  // 云同步
  Cloud as CloudIcon,
  RefreshCw as SyncIcon,
  History as HistoryIcon,
} from 'lucide-react';

/** GitHub 官方图标（lucide 不含品牌图标） */
export const GitHubIcon = ({ size = 20, className }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    className={className}
  >
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
  </svg>
);
