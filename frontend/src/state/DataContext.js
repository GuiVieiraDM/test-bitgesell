import React, { createContext, useCallback, useContext, useState } from 'react';

const DataContext = createContext();

export function DataProvider({ children }) {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1
  });

  const fetchItems = useCallback(async (signal, search = '', page = 1, limit = 10) => {
    let url = `/api/items?page=${page}&limit=${limit}`;
    if (search) {
      url += `&q=${encodeURIComponent(search)}`;
    }
    
    try {
      const res = await fetch(url, { signal });
      if (!res.ok) throw new Error('Failed to fetch items');
      const json = await res.json();
      
      setItems(json.items || json);
      if (json.pagination) {
        setPagination(json.pagination);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error(err);
      }
    }
  }, []);

  // AGORA FORA DO fetchItems:
  const createItem = useCallback(async (itemData) => {
    try {
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData)
      });
      if (!response.ok) {
        throw new Error('Failed to create item');
      }
      const newItem = await response.json();
      // Recarrega a lista para mostrar o novo item
      fetchItems(new AbortController().signal, '', 1, 10); // ou use os estados atuais se preferir
      return newItem;
    } catch (error) {
      console.error('Error creating item:', error);
      throw error;
    }
  }, [fetchItems]);

  return (
    <DataContext.Provider value={{ items, fetchItems, pagination, createItem }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);