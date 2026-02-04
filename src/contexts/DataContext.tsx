import React, { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import type { Data, Settings, Group, Link, TextRecord, SearchEngine } from '../types';
import * as storage from '../utils/storage';

interface DataContextType {
  data: Data;
  refreshData: () => void;

  // 分组操作
  addGroup: (name: string) => Group;
  updateGroup: (id: string, name: string) => void;
  deleteGroup: (id: string) => void;

  // 链接操作
  addLink: (title: string, url: string, groupIds: string[]) => void;
  updateLink: (id: string, title: string, url: string, groupIds: string[]) => void;
  deleteLink: (id: string) => void;
  batchDeleteLinks: (ids: string[]) => void;

  // 文字记录操作
  addTextRecord: (title: string, content: string, groupIds: string[]) => void;
  updateTextRecord: (id: string, title: string, content: string, groupIds: string[]) => void;
  deleteTextRecord: (id: string) => void;
  batchDeleteTextRecords: (ids: string[]) => void;

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
  const [data, setData] = useState<Data>(() => storage.loadData());

  // 使用 useMemo 优化 data 对象的引用稳定性
  const memoizedData = useMemo(() => data, [data]);

  // 刷新数据（从 localStorage 重新加载）
  const refreshData = useCallback(() => {
    setData(storage.loadData());
  }, []);

  // 保存数据到 localStorage
  const saveData = useCallback((newData: Data) => {
    storage.saveData(newData);
    setData(newData);
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

    // 删除属于该分组的链接（只属于这一个分组的链接）
    const filteredLinks = data.links.filter(link => {
      const belongsToGroup = link.groupIds.includes(id);
      if (belongsToGroup) {
        const newGroupIds = link.groupIds.filter(gid => gid !== id);
        // 如果链接不再属于任何分组，则删除该链接
        return newGroupIds.length > 0;
      }
      return true;
    }).map(link => ({
      ...link,
      groupIds: link.groupIds.filter(gid => gid !== id)
    }));

    // 删除属于该分组的文字记录（只属于这一个分组的文字记录）
    const filteredTextRecords = data.textRecords.filter(record => {
      const belongsToGroup = record.groupIds.includes(id);
      if (belongsToGroup) {
        const newGroupIds = record.groupIds.filter(gid => gid !== id);
        // 如果文字记录不再属于任何分组，则删除该文字记录
        return newGroupIds.length > 0;
      }
      return true;
    }).map(record => ({
      ...record,
      groupIds: record.groupIds.filter(gid => gid !== id)
    }));

    const newData: Data = {
      ...data,
      groups: filteredGroups,
      links: filteredLinks,
      textRecords: filteredTextRecords
    };
    saveData(newData);
  }, [data, saveData]);

  // ==================== 链接操作 ====================

  const addLink = useCallback((title: string, url: string, groupIds: string[]) => {
    const newLink: Link = {
      id: storage.generateId(),
      title: title,
      url: url,
      groupIds: groupIds,
      order: data.links.length
    };
    const newData = {
      ...data,
      links: [...data.links, newLink]
    };
    saveData(newData);
  }, [data, saveData]);

  const updateLink = useCallback((id: string, title: string, url: string, groupIds: string[]) => {
    const newData = {
      ...data,
      links: data.links.map(l =>
        l.id === id ? { ...l, title, url, groupIds } : l
      )
    };
    saveData(newData);
  }, [data, saveData]);

  const deleteLink = useCallback((id: string) => {
    const newData = {
      ...data,
      links: data.links.filter(l => l.id !== id)
    };
    saveData(newData);
  }, [data, saveData]);

  const batchDeleteLinks = useCallback((ids: string[]) => {
    const newData = {
      ...data,
      links: data.links.filter(l => !ids.includes(l.id))
    };
    saveData(newData);
  }, [data, saveData]);

  // ==================== 文字记录操作 ====================

  const addTextRecord = useCallback((title: string, content: string, groupIds: string[]) => {
    const newRecord: TextRecord = {
      id: storage.generateId(),
      title: title,
      content: content,
      groupIds: groupIds,
      order: data.textRecords.length
    };
    const newData = {
      ...data,
      textRecords: [...data.textRecords, newRecord]
    };
    saveData(newData);
  }, [data, saveData]);

  const updateTextRecord = useCallback((id: string, title: string, content: string, groupIds: string[]) => {
    const newData = {
      ...data,
      textRecords: data.textRecords.map(r =>
        r.id === id ? { ...r, title, content, groupIds } : r
      )
    };
    saveData(newData);
  }, [data, saveData]);

  const deleteTextRecord = useCallback((id: string) => {
    const newData = {
      ...data,
      textRecords: data.textRecords.filter(r => r.id !== id)
    };
    saveData(newData);
  }, [data, saveData]);

  const batchDeleteTextRecords = useCallback((ids: string[]) => {
    const newData = {
      ...data,
      textRecords: data.textRecords.filter(r => !ids.includes(r.id))
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
    addLink,
    updateLink,
    deleteLink,
    batchDeleteLinks,
    addTextRecord,
    updateTextRecord,
    deleteTextRecord,
    batchDeleteTextRecords,
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
    addLink,
    updateLink,
    deleteLink,
    batchDeleteLinks,
    addTextRecord,
    updateTextRecord,
    deleteTextRecord,
    batchDeleteTextRecords,
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
