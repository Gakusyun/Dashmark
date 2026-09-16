/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import type { Data, Settings, Group, SearchEngine, Bookmark } from '../types';
import * as storage from '../utils/storage';
import { getVersion } from '../utils/version';

interface DataContextType {
  data: Data;
  loading: boolean;
  allSearchEngines: SearchEngine[];
  refreshData: () => Promise<void>;

  // 分组操作
  addGroup: (name: string) => Promise<Group>;
  updateGroup: (id: string, name: string) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
  updateGroupOrder: (orderedIds: string[]) => Promise<void>;

  // 收藏操作
  addBookmark: (
    type: 'link' | 'text',
    title: string,
    groupIds: string[],
    url?: string,
    content?: string
  ) => Promise<void>;
  updateBookmark: (
    id: string,
    type: 'link' | 'text',
    title: string,
    groupIds: string[],
    url?: string,
    content?: string
  ) => Promise<void>;
  deleteBookmark: (id: string) => Promise<void>;
  batchDeleteBookmarks: (ids: string[]) => Promise<void>;
  updateBookmarkOrder: (orderedIds: string[]) => Promise<void>;

  // 设置操作
  updateSettings: (settings: Partial<Settings>) => Promise<void>;

  // 搜索引擎操作
  addSearchEngine: (name: string, url: string) => Promise<void>;
  updateSearchEngine: (id: string, name: string, url: string) => Promise<void>;
  deleteSearchEngine: (id: string) => Promise<void>;

  // 导入导出
  exportData: () => Promise<void>;
  importData: (
    file: File,
    onSuccess: (warnings: string[]) => void,
    onError: (error: Error) => void,
    merge?: boolean
  ) => void;

  // 清除数据
  clearAllData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
};

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [data, setData] = useState<Data>(storage.DEFAULT_DATA);
  const [loading, setLoading] = useState(true);

  // 从 IndexedDB 加载数据
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        let loadedData = await storage.loadData();
        const currentVersion = getVersion();
        if (loadedData.version !== currentVersion) {
          loadedData = { ...loadedData, version: currentVersion };
          await storage.saveData(loadedData);
        }
        if (!cancelled) {
          setData(loadedData);
          setLoading(false);
        }
      } catch (error) {
        console.error('[DashMark] 数据加载失败:', error);
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  // 合并默认搜索引擎和自定义搜索引擎
  const allSearchEngines = useMemo<SearchEngine[]>(() => {
    return [...storage.DEFAULT_SEARCH_ENGINES, ...data.searchEngines];
  }, [data.searchEngines]);

  // 刷新数据（从 IndexedDB 重新加载）
  const refreshData = useCallback(async () => {
    const loadedData = await storage.loadData();
    setData(loadedData);
  }, []);

  // 保存数据到 IndexedDB
  const saveData = useCallback(async (newData: Data) => {
    const dataWithVersion = {
      ...newData,
      version: newData.version || getVersion(),
    };
    await storage.saveData(dataWithVersion);
    setData(dataWithVersion);
  }, []);

  // ==================== 分组操作 ====================

  const addGroup = useCallback(
    async (name: string): Promise<Group> => {
      const newGroup: Group = {
        id: storage.generateId(),
        name: name,
        order: data.groups.length,
      };
      const newData = {
        ...data,
        groups: [...data.groups, newGroup],
      };
      await saveData(newData);
      return newGroup;
    },
    [data, saveData]
  );

  const updateGroup = useCallback(
    async (id: string, name: string) => {
      const newData = {
        ...data,
        groups: data.groups.map((g) => (g.id === id ? { ...g, name } : g)),
      };
      await saveData(newData);
    },
    [data, saveData]
  );

  const deleteGroup = useCallback(
    async (id: string) => {
      // 删除分组
      const filteredGroups = data.groups.filter((g) => g.id !== id);

      // 更新属于该分组的收藏的groupIds
      const updatedBookmarks = data.bookmarks
        .map((bookmark) => ({
          ...bookmark,
          groupIds: bookmark.groupIds.filter((gid) => gid !== id),
        }))
        .filter((bookmark) => bookmark.groupIds.length > 0); // 移除不再属于任何分组的收藏

      const newData: Data = {
        ...data,
        groups: filteredGroups,
        bookmarks: updatedBookmarks,
      };
      await saveData(newData);
    },
    [data, saveData]
  );

  // 更新分组顺序
  const updateGroupOrder = useCallback(
    async (orderedIds: string[]) => {
      const orderedGroups = orderedIds
        .map((id, index) => {
          const group = data.groups.find((g) => g.id === id);
          return group ? { ...group, order: index } : null;
        })
        .filter(Boolean) as Group[];

      // 添加剩余的分组（不在orderedIds中的分组）
      const remainingGroups = data.groups
        .filter((g) => !orderedIds.includes(g.id))
        .map((g, index) => ({
          ...g,
          order: orderedGroups.length + index,
        }));

      const newData = {
        ...data,
        groups: [...orderedGroups, ...remainingGroups],
      };

      await saveData(newData);
    },
    [data, saveData]
  );

  // ==================== 收藏操作 ====================

  const addBookmark = useCallback(
    async (
      type: 'link' | 'text',
      title: string,
      groupIds: string[],
      url?: string,
      content?: string
    ) => {
      const newBookmark: Bookmark = {
        id: storage.generateId(),
        type,
        title,
        groupIds,
        order: data.bookmarks ? data.bookmarks.length : 0,
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        ...(type === 'link' && url ? { url } : {}),
        ...(type === 'text' && content ? { content } : {}),
      };
      const newData = {
        ...data,
        bookmarks: data.bookmarks ? [...data.bookmarks, newBookmark] : [newBookmark],
      };
      await saveData(newData);
    },
    [data, saveData]
  );

  const updateBookmark = useCallback(
    async (
      id: string,
      type: 'link' | 'text',
      title: string,
      groupIds: string[],
      url?: string,
      content?: string
    ) => {
      const newData = {
        ...data,
        bookmarks: data.bookmarks
          ? data.bookmarks.map((b) =>
              b.id === id
                ? {
                    ...b,
                    type,
                    title,
                    groupIds,
                    updatedAt: Date.now(),
                    ...(url !== undefined ? { url } : {}),
                    ...(content !== undefined ? { content } : {}),
                  }
                : b
            )
          : [],
      };
      await saveData(newData);
    },
    [data, saveData]
  );

  const deleteBookmark = useCallback(
    async (id: string) => {
      const newData = {
        ...data,
        bookmarks: data.bookmarks ? data.bookmarks.filter((b) => b.id !== id) : [],
      };
      await saveData(newData);
    },
    [data, saveData]
  );

  const batchDeleteBookmarks = useCallback(
    async (ids: string[]) => {
      const newData = {
        ...data,
        bookmarks: data.bookmarks ? data.bookmarks.filter((b) => !ids.includes(b.id)) : [],
      };
      await saveData(newData);
    },
    [data, saveData]
  );

  // 更新收藏顺序
  const updateBookmarkOrder = useCallback(
    async (orderedIds: string[]) => {
      if (!data.bookmarks) return;

      const orderedBookmarks = orderedIds
        .map((id, index) => {
          const bookmark = data.bookmarks?.find((b) => b.id === id);
          return bookmark ? { ...bookmark, order: index } : null;
        })
        .filter(Boolean) as Bookmark[];

      // 添加剩余的收藏（不在orderedIds中的收藏）
      const remainingBookmarks = (data.bookmarks || [])
        .filter((b) => !orderedIds.includes(b.id))
        .map((b, index) => ({
          ...b,
          order: orderedBookmarks.length + index,
        }));

      const newData = {
        ...data,
        bookmarks: [...orderedBookmarks, ...remainingBookmarks],
      };

      await saveData(newData);
    },
    [data, saveData]
  );

  // ==================== 设置操作 ====================

  const updateSettings = useCallback(
    async (settings: Partial<Settings>) => {
      const newData = {
        ...data,
        settings: {
          ...data.settings,
          ...settings,
        },
      };
      await saveData(newData);
    },
    [data, saveData]
  );

  // ==================== 搜索引擎操作 ====================

  const addSearchEngine = useCallback(
    async (name: string, url: string) => {
      const newEngine: SearchEngine = {
        id: 'custom_' + Date.now(),
        name: name,
        url: url,
      };
      const newData = {
        ...data,
        searchEngines: [...data.searchEngines, newEngine],
      };
      await saveData(newData);
    },
    [data, saveData]
  );

  const updateSearchEngine = useCallback(
    async (id: string, name: string, url: string) => {
      const newData = {
        ...data,
        searchEngines: data.searchEngines.map((e) => (e.id === id ? { ...e, name, url } : e)),
      };
      await saveData(newData);
    },
    [data, saveData]
  );

  const deleteSearchEngine = useCallback(
    async (id: string) => {
      let newSettings = data.settings;

      // 如果删除的是当前使用的搜索引擎，切换到默认的百度
      if (data.settings.searchEngine === id) {
        newSettings = {
          ...data.settings,
          searchEngine: 'baidu',
        };
      }

      const newData = {
        ...data,
        settings: newSettings,
        searchEngines: data.searchEngines.filter((e) => e.id !== id),
      };
      await saveData(newData);
    },
    [data, saveData]
  );

  // ==================== 导入导出 ====================

  const exportData = useCallback(async () => {
    await storage.exportData();
  }, []);

  const importData = useCallback(
    (
      file: File,
      onSuccess: (warnings: string[]) => void,
      onError: (error: Error) => void,
      merge?: boolean
    ) => {
      storage.importData(
        file,
        (importedData, warnings) => {
          setData(importedData);
          onSuccess(warnings);
        },
        onError,
        merge
      );
    },
    []
  );

  const clearAllData = useCallback(async () => {
    await storage.saveData(storage.DEFAULT_DATA);
    setData(storage.DEFAULT_DATA);
  }, []);

  // 使用 useMemo 优化 context value 的引用稳定性
  const contextValue = useMemo<DataContextType>(
    () => ({
      data,
      loading,
      allSearchEngines,
      refreshData,
      addGroup,
      updateGroup,
      deleteGroup,
      updateGroupOrder,
      addBookmark,
      updateBookmark,
      deleteBookmark,
      batchDeleteBookmarks,
      updateBookmarkOrder,
      updateSettings,
      addSearchEngine,
      updateSearchEngine,
      deleteSearchEngine,
      exportData,
      importData,
      clearAllData,
    }),
    [
      data,
      loading,
      allSearchEngines,
      refreshData,
      addGroup,
      updateGroup,
      deleteGroup,
      updateGroupOrder,
      addBookmark,
      updateBookmark,
      deleteBookmark,
      batchDeleteBookmarks,
      updateBookmarkOrder,
      updateSettings,
      addSearchEngine,
      updateSearchEngine,
      deleteSearchEngine,
      exportData,
      importData,
      clearAllData,
    ]
  );

  return <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>;
};
