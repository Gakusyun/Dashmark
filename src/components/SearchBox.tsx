import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { SearchIcon, CloseIcon } from './Icons';

export const SearchBox: React.FC = () => {
  const { data, allSearchEngines } = useData();
  const [searchQuery, setSearchQuery] = useState('');

  const currentEngine = allSearchEngines.find((e) => e.id === data.settings.searchEngine);

  const handleSearch = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    if (currentEngine) {
      const url = currentEngine.url.includes('{q}')
        ? currentEngine.url.replace('{q}', encodeURIComponent(searchQuery))
        : currentEngine.url + encodeURIComponent(searchQuery);
      window.open(url, '_blank');
      setSearchQuery('');
    }
  };

  return (
    <form onSubmit={handleSearch} className="mx-auto mb-8 flex max-w-[800px] items-center gap-4">
      <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-300 bg-transparent px-3 py-2 transition-colors focus-within:border-blue-500 dark:border-slate-600">
        <SearchIcon size={20} className="shrink-0 text-slate-400" />
        <div className="flex min-w-0 flex-1 flex-col">
          {currentEngine && (
            <span className="text-xs text-slate-400 dark:text-slate-500">{currentEngine.name}</span>
          )}
          <input
            id="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="输入搜索内容..."
            className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
          />
        </div>
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            aria-label="清除搜索"
            className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <CloseIcon size={16} />
          </button>
        )}
      </div>
      <button
        type="submit"
        className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
      >
        搜索
      </button>
    </form>
  );
};
