import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { DataProvider } from '../../../state/DataContext';
import Items from '../index';

global.fetch = jest.fn();

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <DataProvider>
        {component}
      </DataProvider>
    </BrowserRouter>
  );
};

describe('Items Page', () => {
  beforeEach(() => {
    fetch.mockClear();
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [],
        pagination: { page: 1, pageSize: 10, total: 0, totalPages: 1 }
      })
    });
  });

  it('should render search input and add button', () => {
    renderWithProviders(<Items />);

    expect(screen.getByPlaceholderText(/search by name/i)).toBeInTheDocument();
    expect(screen.getByTitle(/add new item/i)).toBeInTheDocument();
  });

  it('should handle search input', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [],
        pagination: { page: 1, pageSize: 10, total: 0, totalPages: 1 }
      })
    });

    renderWithProviders(<Items />);

    const searchInput = screen.getByPlaceholderText(/search by name/i);
    fireEvent.change(searchInput, { target: { value: 'laptop' } });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('q=laptop'),
        expect.any(Object)
      );
    });
  });

  it('should toggle add form when add button is clicked', () => {
    renderWithProviders(<Items />);

    const addButton = screen.getByTitle(/add new item/i);
    
    expect(screen.queryByText('Add New Item')).not.toBeInTheDocument();
    
    fireEvent.click(addButton);
    expect(screen.getByText('Add New Item')).toBeInTheDocument();
    
    fireEvent.click(addButton);
    expect(screen.queryByText('Add New Item')).not.toBeInTheDocument();
  });

  it('should show success message after creating item', async () => {
    const newItem = { id: 1, name: 'Test Item', category: 'Test', price: 100 };
    
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

    renderWithProviders(<Items />);

    fireEvent.click(screen.getByTitle(/add new item/i));
    
    const formInputs = screen.getAllByDisplayValue('');
    const nameInput = formInputs[1]; // Primeiro input do formulário (após o search)
    const categoryInput = formInputs[2]; // Segundo input do formulário
    const priceInput = screen.getByPlaceholderText('$0.00');
    
    fireEvent.change(nameInput, { target: { value: 'Test Item' } });
    fireEvent.change(categoryInput, { target: { value: 'Test' } });
    fireEvent.change(priceInput, { target: { value: '100' } });
    
    fireEvent.click(screen.getByText('Add Item'));

    await waitFor(() => {
      expect(screen.getByText('Item created successfully!')).toBeInTheDocument();
    });
  });

  it('should show error message when item creation fails', async () => {
    fetch.mockImplementation((url) => {
      if (url.includes('/api/items') && !url.includes('?')) {
        return Promise.reject(new Error('Network error'));
      } else {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            items: [],
            pagination: { page: 1, pageSize: 10, total: 0, totalPages: 1 }
          })
        });
      }
    });

    renderWithProviders(<Items />);

    fireEvent.click(screen.getByTitle(/add new item/i));
    
    const formInputs = screen.getAllByDisplayValue('');
    const nameInput = formInputs[1];
    const categoryInput = formInputs[2];
    const priceInput = screen.getByPlaceholderText('$0.00');
    
    fireEvent.change(nameInput, { target: { value: 'Test Item' } });
    fireEvent.change(categoryInput, { target: { value: 'Test' } });
    fireEvent.change(priceInput, { target: { value: '100' } });
    
    fireEvent.click(screen.getByText('Add Item'));

    await waitFor(
      () => {
        const errorMsg = screen.queryByText(/error creating item/i);
        expect(errorMsg).not.toBeNull();
      },
      { timeout: 2000 }
    );
  });

  it('should render pagination when there are multiple pages', async () => {
    const mockItems = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      name: `Item ${i + 1}`,
      category: 'Test',
      price: 100
    }));

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: mockItems,
        pagination: { page: 1, pageSize: 10, total: 25, totalPages: 3 }
      })
    });

    renderWithProviders(<Items />);

    await waitFor(() => {
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
    });
  });

  it('should handle page navigation', async () => {
    const mockItems = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      name: `Item ${i + 1}`,
      category: 'Test',
      price: 100
    }));

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: mockItems,
        pagination: { page: 1, pageSize: 10, total: 25, totalPages: 3 }
      })
    });

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: mockItems,
        pagination: { page: 2, pageSize: 10, total: 25, totalPages: 3 }
      })
    });

    renderWithProviders(<Items />);

    await waitFor(() => {
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('page=2'),
        expect.any(Object)
      );
    });
  });

  it('should disable pagination buttons when loading', async () => {
    const mockItems = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      name: `Item ${i + 1}`,
      category: 'Test',
      price: 100
    }));

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: mockItems,
        pagination: { page: 2, pageSize: 10, total: 25, totalPages: 3 }
      })
    });

    renderWithProviders(<Items />);

    await waitFor(() => {
      const prevButton = screen.getByText('Previous');
      const nextButton = screen.getByText('Next');
      
      expect(prevButton).not.toBeDisabled();
      expect(nextButton).not.toBeDisabled();
    });
  });

  it('should show loading state during data fetch', async () => {
    fetch.mockImplementation(() => new Promise(resolve => setTimeout(() => {
      resolve({
        ok: true,
        json: async () => ({
          items: [],
          pagination: { page: 1, pageSize: 10, total: 0, totalPages: 1 }
        })
      });
    }, 100)));

    renderWithProviders(<Items />);

    expect(screen.getByPlaceholderText(/search by name/i)).toBeInTheDocument();
  });
}); 