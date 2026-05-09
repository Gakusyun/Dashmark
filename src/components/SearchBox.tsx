import React, { useState } from 'react';
import { Box, TextField, Button, IconButton, InputAdornment } from '@mui/material';
import { Search as SearchIcon, Close as CloseIcon } from '@mui/icons-material';
import { useData } from '../contexts/DataContext';

export const SearchBox: React.FC = () => {
  const { data, allSearchEngines } = useData();
  const [searchQuery, setSearchQuery] = useState('');

  const currentEngine = allSearchEngines.find(e => e.id === data.settings.searchEngine);

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
    <Box component="form" onSubmit={handleSearch} sx={{ maxWidth: 800, mx: 'auto', mb: 4 }}>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          id="search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="输入搜索内容..."
          variant="outlined"
          label={currentEngine?.name}
          sx={{ flex: 1 }}
          slotProps={{
            input: {
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />,
              endAdornment: searchQuery ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setSearchQuery('')}
                    aria-label="清除搜索"
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }
          }}
        />
        <Button type="submit" variant="contained" size="large">
          搜索
        </Button>
      </Box>
    </Box>
  );
};
