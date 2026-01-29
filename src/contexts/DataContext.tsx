import React, { createContext, useContext, useState, type ReactNode } from 'react';
import type { Data, Settings, Group } from '../types';
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

  const refreshData = () => {
    setData(storage.loadData());
  };

  // 分组操作
  const addGroup = (name: string): Group => {
    const newGroup = storage.addGroup(name);
    refreshData();
    return newGroup;
  };

  const updateGroup = (id: string, name: string) => {
    storage.updateGroup(id, name);
    refreshData();
  };

  const deleteGroup = (id: string) => {
    storage.deleteGroup(id);
    refreshData();
  };

  // 链接操作
  const addLink = (title: string, url: string, groupIds: string[]) => {
    storage.addLink(title, url, groupIds);
    refreshData();
  };

  const updateLink = (id: string, title: string, url: string, groupIds: string[]) => {
    storage.updateLink(id, title, url, groupIds);
    refreshData();
  };

  const deleteLink = (id: string) => {
    storage.deleteLink(id);
    refreshData();
  };

  const batchDeleteLinks = (ids: string[]) => {
    storage.batchDeleteLinks(ids);
    refreshData();
  };

  // 设置操作
  const updateSettings = (settings: Partial<Settings>) => {
    storage.updateSettings(settings);
    refreshData();
  };

  // 搜索引擎操作
  const addSearchEngine = (name: string, url: string) => {
    storage.addSearchEngine(name, url);
    refreshData();
  };

  const updateSearchEngine = (id: string, name: string, url: string) => {
    storage.updateSearchEngine(id, name, url);
    refreshData();
  };

  const deleteSearchEngine = (id: string) => {
    storage.deleteSearchEngine(id);
    refreshData();
  };

  // 导入导出
  const exportData = () => {
    storage.exportData();
  };

  const importData = (file: File, onSuccess: () => void, onError: (error: Error) => void) => {
    storage.importData(
      file,
      () => {
        refreshData();
        onSuccess();
      },
      onError
    );
  };

  return (
    <DataContext.Provider
      value={{
        data,
        refreshData,
        addGroup,
        updateGroup,
        deleteGroup,
        addLink,
        updateLink,
        deleteLink,
        batchDeleteLinks,
        updateSettings,
        addSearchEngine,
        updateSearchEngine,
        deleteSearchEngine,
        exportData,
        importData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};
