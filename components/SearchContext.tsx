import React, { createContext, useContext, useMemo, useState } from "react";

type SearchContextType = {
  isSearchOpen: boolean;
  query: string;
  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;
  setQuery: (value: string) => void;
};

const SearchContext = createContext<SearchContextType | null>(null);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const value = useMemo(
    () => ({
      isSearchOpen,
      query,
      openSearch: () => setIsSearchOpen(true),
      closeSearch: () => {
        setIsSearchOpen(false);
        setQuery("");
      },
      toggleSearch: () => {
        setIsSearchOpen((prev) => {
          const next = !prev;
          if (!next) setQuery("");
          return next;
        });
      },
      setQuery,
    }),
    [isSearchOpen, query]
  );

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("useSearch must be used inside SearchProvider");
  return ctx;
}