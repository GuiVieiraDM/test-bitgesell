import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { DataProvider, useData } from '../DataContext';

// Mock do fetch global
global.fetch = jest.fn();

// Componente de teste para acessar o contexto
const TestComponent = () => {
  const { items, pagination, fetchItems, createItem } = useData();
  
  return (
    <div>
      <div data-testid="items-count">{items.length}</div>
      <div data-testid="current-page">{pagination.page}</div>
      <button onClick={() => fetchItems(new AbortController().signal)}>
        Fetch Items
      </button>
      <button onClick={() => createItem({ name: 'Test', category: 'Test', price: 100 })}>
        Create Item
      </button>
    </div>
  );
};

describe('DataContext', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  it('should provide initial state', () => {
    render(
      <DataProvider>
        <TestComponent />
      </DataProvider>
    );

    expect(screen.getByTestId('items-count')).toHaveTextContent('0');
    expect(screen.getByTestId('current-page')).toHaveTextContent('1');
  });

  it('should fetch items successfully', async () => {
    const mockItems = [
      { id: 1, name: 'Test Item', category: 'Test', price: 100 }
    ];
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: mockItems,
        pagination: { page: 1, pageSize: 10, total: 1, totalPages: 1 }
      })
    });

    render(
      <DataProvider>
        <TestComponent />
      </DataProvider>
    );

    screen.getByText('Fetch Items').click();

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/items'),
        expect.objectContaining({
          signal: expect.any(AbortSignal)
        })
      );
    });
  });

  it('should create item successfully', async () => {
    const newItem = { id: 1, name: 'Test', category: 'Test', price: 100 };
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => newItem
    });

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [newItem],
        pagination: { page: 1, pageSize: 10, total: 1, totalPages: 1 }
      })
    });

    render(
      <DataProvider>
        <TestComponent />
      </DataProvider>
    );

    screen.getByText('Create Item').click();

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/items', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test', category: 'Test', price: 100 })
      }));
    });
  });

  it('should handle fetch error gracefully', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <DataProvider>
        <TestComponent />
      </DataProvider>
    );

    await act(async () => {
      screen.getByText('Fetch Items').click();
    });

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });
}); 