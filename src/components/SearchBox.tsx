import React, { useState } from 'react';
import { Box, TextField, Button, InputAdornment } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { useData } from '../contexts/DataContext';
import { getAllSearchEngines } from '../utils/storage';

export const SearchBox: React.FC = () => {
  const { data } = useData();
  const [searchQuery, setSearchQuery] = useState('');

  const allEngines = getAllSearchEngines();
  const currentEngine = allEngines.find(e => e.id === data.settings.searchEngine);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    if (currentEngine) {
      const url = currentEngine.url + encodeURIComponent(searchQuery);
      window.open(url, '_blank');
      setSearchQuery('');
    }
  };

  return (
    <Box component="form" onSubmit={handleSearch} sx={{ maxWidth: 800, mx: 'auto', mb: 4 }}>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="输入搜索内容..."
          sx={{ flex: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <Button type="submit" variant="contained" size="large">
          搜索
        </Button>
      </Box>
    </Box>
  );
};
