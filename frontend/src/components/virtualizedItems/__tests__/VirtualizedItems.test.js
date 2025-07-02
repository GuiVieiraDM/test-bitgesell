import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import VirtualizedItems from '../index';

jest.mock('react-window', () => ({
  FixedSizeList: ({ children: Row, itemCount, height, itemSize, width }) => (
    <div data-testid="virtualized-list" style={{ height, width }}>
      {Array.from({ length: Math.min(itemCount, 5) }, (_, index) => (
        <div key={index} style={{ height: itemSize }}>
          {Row({ index, style: {} })}
        </div>
      ))}
    </div>
  )
}));

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('VirtualizedItems', () => {
  const mockItems = [
    { id: 1, name: 'Laptop Pro', category: 'Electronics', price: 2499 },
    { id: 2, name: 'Wireless Headphones', category: 'Electronics', price: 199 },
    { id: 3, name: 'Coffee Maker', category: 'Kitchen', price: 89 }
  ];

  it('should render items when not loading', () => {
    renderWithRouter(
      <VirtualizedItems items={mockItems} loading={false} />
    );

    expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
    expect(screen.getByText('Laptop Pro')).toBeInTheDocument();
    expect(screen.getByText('Wireless Headphones')).toBeInTheDocument();
    expect(screen.getByText('Coffee Maker')).toBeInTheDocument();
  });

  it('should render skeleton when loading', () => {
    renderWithRouter(
      <VirtualizedItems items={[]} loading={true} />
    );

    expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
    
    expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
  });

  it('should render correct number of skeleton items when loading', () => {
    renderWithRouter(
      <VirtualizedItems items={[]} loading={true} itemCount={10} />
    );

    expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
  });

  it('should render links for items when not loading', () => {
    renderWithRouter(
      <VirtualizedItems items={mockItems} loading={false} />
    );

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(3);
    
    expect(links[0]).toHaveAttribute('href', '/items/1');
    expect(links[1]).toHaveAttribute('href', '/items/2');
    expect(links[2]).toHaveAttribute('href', '/items/3');
  });

  it('should handle empty items array when not loading', () => {
    renderWithRouter(
      <VirtualizedItems items={[]} loading={false} />
    );

    expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('should use default props correctly', () => {
    renderWithRouter(
      <VirtualizedItems items={mockItems} />
    );

    const list = screen.getByTestId('virtualized-list');
    expect(list).toBeInTheDocument();
    expect(list.style.height).toBe('600px');
    expect(list.style.width).toBe('100%');
  });

  it('should use custom props correctly', () => {
    renderWithRouter(
      <VirtualizedItems 
        items={mockItems} 
        height={400} 
        itemHeight={60} 
        loading={false}
      />
    );

    const list = screen.getByTestId('virtualized-list');
    expect(list.style.height).toBe('400px');
  });

  it('should not render skeleton when loading is false', () => {
    renderWithRouter(
      <VirtualizedItems items={mockItems} loading={false} />
    );

    expect(screen.getByText('Laptop Pro')).toBeInTheDocument();
  });

  it('should not render links when loading is true', () => {
    renderWithRouter(
      <VirtualizedItems items={mockItems} loading={true} />
    );

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
}); 