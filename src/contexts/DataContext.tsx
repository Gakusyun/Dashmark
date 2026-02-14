import React, { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import type { Data, Settings, Group, SearchEngine, Bookmark } from '../types';
import * as storage from '../utils/storage';
import { getVersion } from '../utils/version';

interface DataContextType {
  data: Data;
  refreshData: () => void;

  // 分组操作
  addGroup: (name: string) => Group;
  updateGroup: (id: string, name: string) => void;
  deleteGroup: (id: string) => void;
  updateGroupOrder: (orderedIds: string[]) => void;

  // 链接操作
  addLink: (title: string, url: string, groupIds: string[]) => void;
  updateLink: (id: string, title: string, url: string, groupIds: string[]) => void;
  deleteLink: (id: string) => void;
  batchDeleteLinks: (ids: string[]) => void;
  updateLinkOrder: (orderedIds: string[]) => void;

  // 文字记录操作
  addTextRecord: (title: string, content: string, groupIds: string[]) => void;
  updateTextRecord: (id: string, title: string, content: string, groupIds: string[]) => void;
  deleteTextRecord: (id: string) => void;
  batchDeleteTextRecords: (ids: string[]) => void;
  updateTextRecordOrder: (orderedIds: string[]) => void;

  // 收藏操作
  addBookmark: (type: 'link' | 'text', title: string, groupIds: string[], url?: string, content?: string) => void;
  updateBookmark: (id: string, type: 'link' | 'text', title: string, groupIds: string[], url?: string, content?: string) => void;
  deleteBookmark: (id: string) => void;
  batchDeleteBookmarks: (ids: string[]) => void;
  updateBookmarkOrder: (orderedIds: string[]) => void;

  // 设置操作
  updateSettings: (settings: Partial<Settings>) => void;

  // 搜索引擎操作
  addSearchEngine: (name: string, url: string) => void;
  updateSearchEngine: (id: string, name: string, url: string) => void;
  deleteSearchEngine: (id: string) => void;

  // 导入导出
  exportData: () => void;
  importData: (file: File, onSuccess: () => void, onError: (error: Error) => void) => void;
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
  const [data, setData] = useState<Data>(() => {
    const loadedData = storage.loadData();
    return loadedData;
  });

  // 使用 useMemo 优化 data 对象的引用稳定性
  const memoizedData = useMemo(() => data, [data]);

  // 刷新数据（从 localStorage 重新加载）
  const refreshData = useCallback(() => {
    const loadedData = storage.loadData();
    setData(loadedData);
  }, []);

  // 保存数据到 localStorage
  const saveData = useCallback((newData: Data) => {
    const dataWithVersion = {
      ...newData,
      version: newData.version || getVersion()
    };
    storage.saveData(dataWithVersion);
    // 从localStorage重新加载数据以确保格式一致
    const savedData = storage.loadData();
    setData(savedData);
  }, []);

  // ==================== 分组操作 ====================

  const addGroup = useCallback((name: string): Group => {
    const newGroup: Group = {
      id: storage.generateId(),
      name: name,
      order: data.groups.length
    };
    const newData = {
      ...data,
      groups: [...data.groups, newGroup]
    };
    saveData(newData);
    return newGroup;
  }, [data, saveData]);

  const updateGroup = useCallback((id: string, name: string) => {
    const newData = {
      ...data,
      groups: data.groups.map(g =>
        g.id === id ? { ...g, name } : g
      )
    };
    saveData(newData);
  }, [data, saveData]);

  const deleteGroup = useCallback((id: string) => {
    // 删除分组
    const filteredGroups = data.groups.filter(g => g.id !== id);

    // 更新属于该分组的收藏的groupIds
    const updatedBookmarks = data.bookmarks.map(bookmark => ({
      ...bookmark,
      groupIds: bookmark.groupIds.filter(gid => gid !== id)
    })).filter(bookmark => bookmark.groupIds.length > 0); // 移除不再属于任何分组的收藏

    const newData: Data = {
      ...data,
      groups: filteredGroups,
      bookmarks: updatedBookmarks
    };
    saveData(newData);
  }, [data, saveData]);

  // 更新分组顺序
  const updateGroupOrder = useCallback((orderedIds: string[]) => {
    const orderedGroups = orderedIds.map((id, index) => {
      const group = data.groups.find(g => g.id === id);
      return group ? { ...group, order: index } : null;
    }).filter(Boolean) as Group[];

    // 添加剩余的分组（不在orderedIds中的分组）
    const remainingGroups = data.groups.filter(g => !orderedIds.includes(g.id)).map((g, index) => ({
      ...g,
      order: orderedGroups.length + index
    }));

    const newData = {
      ...data,
      groups: [...orderedGroups, ...remainingGroups]
    };

    saveData(newData);
  }, [data, saveData]);

  // ==================== 链接操作 ====================

  const addLink = useCallback((title: string, url: string, groupIds: string[]) => {
    const newBookmark: Bookmark = {
      id: storage.generateId(),
      type: 'link',
      title: title,
      url: url,
      groupIds: groupIds,
      order: data.bookmarks.length
    };
    const newData = {
      ...data,
      bookmarks: [...data.bookmarks, newBookmark]
    };
    saveData(newData);
  }, [data, saveData]);

  const updateLink = useCallback((id: string, title: string, url: string, groupIds: string[]) => {
    const newData = {
      ...data,
      bookmarks: data.bookmarks.map(b =>
        b.id === id && b.type === 'link' ? { ...b, title, url, groupIds } : b
      )
    };
    saveData(newData);
  }, [data, saveData]);

  const deleteLink = useCallback((id: string) => {
    const newData = {
      ...data,
      bookmarks: data.bookmarks.filter(b => !(b.id === id && b.type === 'link'))
    };
    saveData(newData);
  }, [data, saveData]);

  const batchDeleteLinks = useCallback((ids: string[]) => {
    const newData = {
      ...data,
      bookmarks: data.bookmarks.filter(b => !(ids.includes(b.id) && b.type === 'link'))
    };
    saveData(newData);
  }, [data, saveData]);

  // 更新链接顺序
  const updateLinkOrder = useCallback((orderedIds: string[]) => {
    const orderedLinks = orderedIds.map((id, index) => {
      const link = data.bookmarks.find(b => b.id === id && b.type === 'link');
      return link ? { ...link, order: index } : null;
    }).filter(Boolean) as Bookmark[];

    // 添加剩余的链接（不在orderedIds中的链接）
    const remainingLinks = data.bookmarks.filter(b => !orderedIds.includes(b.id) && b.type === 'link').map((b, index) => ({
      ...b,
      order: orderedLinks.length + index
    }));

    // 获取未被排序的其他类型收藏
    const otherBookmarks = data.bookmarks.filter(b => !orderedIds.includes(b.id) || b.type !== 'link');

    const newData = {
      ...data,
      bookmarks: [...orderedLinks, ...remainingLinks, ...otherBookmarks]
    };

    saveData(newData);
  }, [data, saveData]);

  // ==================== 文字记录操作 ====================

  const addTextRecord = useCallback((title: string, content: string, groupIds: string[]) => {
    const newBookmark: Bookmark = {
      id: storage.generateId(),
      type: 'text',
      title: title,
      content: content,
      groupIds: groupIds,
      order: data.bookmarks.length
    };
    const newData = {
      ...data,
      bookmarks: [...data.bookmarks, newBookmark]
    };
    saveData(newData);
  }, [data, saveData]);

  const updateTextRecord = useCallback((id: string, title: string, content: string, groupIds: string[]) => {
    const newData = {
      ...data,
      bookmarks: data.bookmarks.map(b =>
        b.id === id && b.type === 'text' ? { ...b, title, content, groupIds } : b
      )
    };
    saveData(newData);
  }, [data, saveData]);

  const deleteTextRecord = useCallback((id: string) => {
    const newData = {
      ...data,
      bookmarks: data.bookmarks.filter(b => !(b.id === id && b.type === 'text'))
    };
    saveData(newData);
  }, [data, saveData]);

  const batchDeleteTextRecords = useCallback((ids: string[]) => {
    const newData = {
      ...data,
      bookmarks: data.bookmarks.filter(b => !(ids.includes(b.id) && b.type === 'text'))
    };
    saveData(newData);
  }, [data, saveData]);

  // 更新文字记录顺序
  const updateTextRecordOrder = useCallback((orderedIds: string[]) => {
    const orderedTextRecords = orderedIds.map((id, index) => {
      const record = data.bookmarks.find(b => b.id === id && b.type === 'text');
      return record ? { ...record, order: index } : null;
    }).filter(Boolean) as Bookmark[];

    // 添加剩余的文字记录（不在orderedIds中的文字记录）
    const remainingTextRecords = data.bookmarks.filter(b => !orderedIds.includes(b.id) && b.type === 'text').map((b, index) => ({
      ...b,
      order: orderedTextRecords.length + index
    }));

    // 获取未被排序的其他类型收藏
    const otherBookmarks = data.bookmarks.filter(b => !orderedIds.includes(b.id) || b.type !== 'text');

    const newData = {
      ...data,
      bookmarks: [...orderedTextRecords, ...remainingTextRecords, ...otherBookmarks]
    };

    saveData(newData);
  }, [data, saveData]);

  // ==================== 设置操作 ====================

  const updateSettings = useCallback((settings: Partial<Settings>) => {
    const newData = {
      ...data,
      settings: {
        ...data.settings,
        ...settings
      }
    };
    saveData(newData);
  }, [data, saveData]);

  // ==================== 搜索引擎操作 ====================

  const addSearchEngine = useCallback((name: string, url: string) => {
    const newEngine: SearchEngine = {
      id: 'custom_' + Date.now(),
      name: name,
      url: url
    };
    const newData = {
      ...data,
      searchEngines: [...data.searchEngines, newEngine]
    };
    saveData(newData);
  }, [data, saveData]);

  const updateSearchEngine = useCallback((id: string, name: string, url: string) => {
    const newData = {
      ...data,
      searchEngines: data.searchEngines.map(e =>
        e.id === id ? { ...e, name, url } : e
      )
    };
    saveData(newData);
  }, [data, saveData]);

  const deleteSearchEngine = useCallback((id: string) => {
    let newSettings = data.settings;

    // 如果删除的是当前使用的搜索引擎，切换到默认的 Google
    if (data.settings.searchEngine === id) {
      newSettings = {
        ...data.settings,
        searchEngine: 'google'
      };
    }

    const newData = {
      ...data,
      settings: newSettings,
      searchEngines: data.searchEngines.filter(e => e.id !== id)
    };
    saveData(newData);
  }, [data, saveData]);

  // ==================== 收藏操作 ====================

  const addBookmark = useCallback((type: 'link' | 'text', title: string, groupIds: string[], url?: string, content?: string) => {
    const newBookmark = {
      id: storage.generateId(),
      type,
      title,
      groupIds,
      order: data.bookmarks ? data.bookmarks.length : 0,
      ...(type === 'link' && url ? { url } : {}),
      ...(type === 'text' && content ? { content } : {})
    };
    const newData = {
      ...data,
      bookmarks: data.bookmarks ? [...data.bookmarks, newBookmark] : [newBookmark]
    };
    saveData(newData);
  }, [data, saveData]);

  const updateBookmark = useCallback((id: string, type: 'link' | 'text', title: string, groupIds: string[], url?: string, content?: string) => {
    const newData = {
      ...data,
      bookmarks: data.bookmarks ? data.bookmarks.map(b =>
        b.id === id ? { ...b, type, title, groupIds, url, content } : b
      ) : []
    };
    saveData(newData);
  }, [data, saveData]);

  const deleteBookmark = useCallback((id: string) => {
    const newData = {
      ...data,
      bookmarks: data.bookmarks ? data.bookmarks.filter(b => b.id !== id) : []
    };
    saveData(newData);
  }, [data, saveData]);

  const batchDeleteBookmarks = useCallback((ids: string[]) => {
    const newData = {
      ...data,
      bookmarks: data.bookmarks ? data.bookmarks.filter(b => !ids.includes(b.id)) : []
    };
    saveData(newData);
  }, [data, saveData]);

  // 更新收藏顺序
  const updateBookmarkOrder = useCallback((orderedIds: string[]) => {
    if (!data.bookmarks) return;

    const orderedBookmarks = orderedIds.map((id, index) => {
      const bookmark = data.bookmarks?.find(b => b.id === id);
      return bookmark ? { ...bookmark, order: index } : null;
    }).filter(Boolean) as Bookmark[];

    // 添加剩余的收藏（不在orderedIds中的收藏）
    const remainingBookmarks = (data.bookmarks || []).filter(b => !orderedIds.includes(b.id)).map((b, index) => ({
      ...b,
      order: orderedBookmarks.length + index
    }));

    const newData = {
      ...data,
      bookmarks: [...orderedBookmarks, ...remainingBookmarks]
    };

    saveData(newData);
  }, [data, saveData]);

  // ==================== 导入导出 ====================

  const exportData = useCallback(() => {
    storage.exportData();
  }, []);

  const importData = useCallback((file: File, onSuccess: () => void, onError: (error: Error) => void) => {
    storage.importData(
      file,
      (importedData) => {
        setData(importedData);
        onSuccess();
      },
      onError
    );
  }, []);

  // 使用 useMemo 优化 context value 的引用稳定性
  const contextValue = useMemo<DataContextType>(() => ({
    data: memoizedData,
    refreshData,
    addGroup,
    updateGroup,
    deleteGroup,
    updateGroupOrder,
    addLink,
    updateLink,
    deleteLink,
    batchDeleteLinks,
    updateLinkOrder,
    addTextRecord,
    updateTextRecord,
    deleteTextRecord,
    batchDeleteTextRecords,
    updateTextRecordOrder,
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
  }), [
    memoizedData,
    refreshData,
    addGroup,
    updateGroup,
    deleteGroup,
    updateGroupOrder,
    addLink,
    updateLink,
    deleteLink,
    batchDeleteLinks,
    updateLinkOrder,
    addTextRecord,
    updateTextRecord,
    deleteTextRecord,
    batchDeleteTextRecords,
    updateTextRecordOrder,
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
  ]);

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
};
