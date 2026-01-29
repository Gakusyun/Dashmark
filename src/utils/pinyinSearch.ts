import { useState, useEffect } from 'react';

// 动态加载 pinyin-pro 库
let pinyinModule: any = null;
let pinyinLoadPromise: Promise<any> | null = null;

async function getPinyin() {
  if (pinyinModule) {
    return pinyinModule;
  }

  if (pinyinLoadPromise) {
    return pinyinLoadPromise;
  }

  pinyinLoadPromise = import('pinyin-pro').then(module => {
    pinyinModule = module;
    return module;
  });

  return pinyinLoadPromise;
}

export function usePinyinSearch() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    getPinyin().then(() => {
      setIsLoaded(true);
    });
  }, []);

  return { isLoaded, getPinyin };
}