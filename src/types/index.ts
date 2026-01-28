export interface SearchEngine {
  id: string;
  name: string;
  url: string;
}

export interface Settings {
  searchEngine: string;
  darkMode: 'light' | 'dark' | 'auto';
}

export interface Group {
  id: string;
  name: string;
  order: number;
}

export interface Link {
  id: string;
  title: string;
  url: string;
  groupIds: string[];
  order: number;
}

export interface Data {
  groups: Group[];
  links: Link[];
  searchEngines: SearchEngine[];
  settings: Settings;
}

export interface LinkWithGroups extends Link {
  groups: Group[];
}
