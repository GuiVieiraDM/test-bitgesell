import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ItemDetail from './index';

global.fetch = jest.fn();

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: '1' })
}));

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('ItemDetail', () => {
  beforeEach(() => {
    fetch.mockClear();
    mockNavigate.mockClear();
  });

  it('should render loading skeleton initially', () => {
    fetch.mockImplementation(() => new Promise(() => {}));

    renderWithRouter(<ItemDetail />);

    expect(screen.getByText('← Back to Items')).toBeInTheDocument();
    
    const skeletons = document.querySelectorAll('[class*="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should render item details when data is loaded', async () => {
    const mockItem = {
      id: 1,
      name: 'Laptop Pro',
      category: 'Electronics',
      price: 2499
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockItem
    });

    renderWithRouter(<ItemDetail />);

    await waitFor(() => {
      expect(screen.getByText('Laptop Pro')).toBeInTheDocument();
      expect(screen.getByText('Electronics')).toBeInTheDocument();
      expect(screen.getByText('$2,499.00')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  it('should format price correctly', async () => {
    const mockItem = {
      id: 1,
      name: 'Test Item',
      category: 'Test',
      price: 1234.56
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockItem
    });

    renderWithRouter(<ItemDetail />);

    await waitFor(() => {
      expect(screen.getByText('$1,234.56')).toBeInTheDocument();
    });
  });

  it('should render back button as a link', async () => {
    const mockItem = {
      id: 1,
      name: 'Test Item',
      category: 'Test',
      price: 100
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockItem
    });

    renderWithRouter(<ItemDetail />);

    await waitFor(() => {
      const backButton = screen.getByText('← Back to Items');
      expect(backButton).toHaveAttribute('href', '/');
    });
  });

  it('should handle item not found', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 404
    });

    renderWithRouter(<ItemDetail />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('should handle network error', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    renderWithRouter(<ItemDetail />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('should show item not found message when item is null', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => null
    });

    renderWithRouter(<ItemDetail />);

    await waitFor(() => {
      expect(screen.getByText('Item not found')).toBeInTheDocument();
      expect(screen.getByText("The item you're looking for doesn't exist.")).toBeInTheDocument();
    });
  });

  it('should render all detail rows correctly', async () => {
    const mockItem = {
      id: 1,
      name: 'Test Item',
      category: 'Electronics',
      price: 999.99
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockItem
    });

    renderWithRouter(<ItemDetail />);

    await waitFor(() => {
      expect(screen.getByText('Category:')).toBeInTheDocument();
      expect(screen.getByText('Price:')).toBeInTheDocument();
      expect(screen.getByText('ID:')).toBeInTheDocument();
      
      expect(screen.getByText('Electronics')).toBeInTheDocument();
      expect(screen.getByText('$999.99')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  it('should handle different item IDs', async () => {
    jest.doMock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate,
      useParams: () => ({ id: '42' })
    }));

    const mockItem = {
      id: 42,
      name: 'Another Item',
      category: 'Books',
      price: 29.99
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockItem
    });

    renderWithRouter(<ItemDetail />);

    await waitFor(() => {
      expect(screen.getByText('Another Item')).toBeInTheDocument();
      expect(screen.getByText('Books')).toBeInTheDocument();
      expect(screen.getByText('$29.99')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
    });
  });
}); 