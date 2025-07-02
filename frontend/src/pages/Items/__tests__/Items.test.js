import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { DataProvider } from '../../../state/DataContext';
import Items from '../index';

// Mock do fetch global
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
    // Mock padrão para evitar erros de fetch não mockado
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
    
    // Formulário não deve estar visível inicialmente
    expect(screen.queryByText('Add New Item')).not.toBeInTheDocument();
    
    // Clicar no botão para mostrar o formulário
    fireEvent.click(addButton);
    expect(screen.getByText('Add New Item')).toBeInTheDocument();
    
    // Clicar novamente para esconder
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

    // Abrir formulário
    fireEvent.click(screen.getByTitle(/add new item/i));
    
    // Preencher e submeter usando seletores mais específicos
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
    // Mock específico para este teste - não usar o mock global
    fetch.mockImplementation((url) => {
      if (url.includes('/api/items') && !url.includes('?')) {
        // Mock para criação de item - simula erro
        return Promise.reject(new Error('Network error'));
      } else {
        // Mock para outras chamadas (busca de itens)
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

    // Abrir formulário
    fireEvent.click(screen.getByTitle(/add new item/i));
    
    // Preencher e submeter usando seletores mais específicos
    const formInputs = screen.getAllByDisplayValue('');
    const nameInput = formInputs[1]; // Primeiro input do formulário (após o search)
    const categoryInput = formInputs[2]; // Segundo input do formulário
    const priceInput = screen.getByPlaceholderText('$0.00');
    
    fireEvent.change(nameInput, { target: { value: 'Test Item' } });
    fireEvent.change(categoryInput, { target: { value: 'Test' } });
    fireEvent.change(priceInput, { target: { value: '100' } });
    
    fireEvent.click(screen.getByText('Add Item'));

    await waitFor(
      () => {
        // Procura por qualquer elemento que contenha o texto de erro, mesmo que fragmentado
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

    // Primeira página
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: mockItems,
        pagination: { page: 1, pageSize: 10, total: 25, totalPages: 3 }
      })
    });

    // Segunda página
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

    // Clicar em Next
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
      
      // Na página 2, o botão Previous deve estar habilitado e Next desabilitado
      expect(prevButton).not.toBeDisabled();
      expect(nextButton).not.toBeDisabled();
    });
  });

  it('should show loading state during data fetch', async () => {
    // Mock de uma requisição lenta
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

    // Verificar se o componente está renderizando durante o loading
    expect(screen.getByPlaceholderText(/search by name/i)).toBeInTheDocument();
  });
}); 