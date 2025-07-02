import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ItemForm from '../index';

const mockOnAdd = jest.fn();
const mockSetShowAddForm = jest.fn();

const defaultProps = {
  onAdd: mockOnAdd,
  formError: '',
  showAddForm: true,
  setShowAddForm: mockSetShowAddForm
};

describe('ItemForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render form fields', () => {
    render(<ItemForm {...defaultProps} />);

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/price/i)).toBeInTheDocument();
    expect(screen.getByText('Add Item')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('should handle form submission with valid data', async () => {
    render(<ItemForm {...defaultProps} />);

    // Preencher o formulário
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'Test Product' }
    });
    fireEvent.change(screen.getByLabelText(/category/i), {
      target: { value: 'Electronics' }
    });
    fireEvent.change(screen.getByLabelText(/price/i), {
      target: { value: '100.50' }
    });

    // Submeter o formulário
    fireEvent.click(screen.getByText('Add Item'));

    await waitFor(() => {
      expect(mockOnAdd).toHaveBeenCalledWith({
        name: 'Test Product',
        category: 'Electronics',
        price: 100.5
      });
    });
  });

  it('should format price on blur', () => {
    render(<ItemForm {...defaultProps} />);

    const priceInput = screen.getByLabelText(/price/i);
    
    // Digitar preço
    fireEvent.change(priceInput, { target: { value: '100.50' } });
    
    // Focar e desfocar para formatar
    fireEvent.focus(priceInput);
    fireEvent.blur(priceInput);

    expect(priceInput.value).toBe('$100.50');
  });

  it('should show raw price when focused', () => {
    render(<ItemForm {...defaultProps} />);

    const priceInput = screen.getByLabelText(/price/i);
    
    // Digitar preço e formatar
    fireEvent.change(priceInput, { target: { value: '100.50' } });
    fireEvent.blur(priceInput);
    
    // Focar novamente
    fireEvent.focus(priceInput);

    expect(priceInput.value).toBe('100.50');
  });

  it('should display error message when provided', () => {
    const errorMessage = 'Error creating item';
    render(<ItemForm {...defaultProps} formError={errorMessage} />);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByText('⚠')).toBeInTheDocument();
  });

  it('should call setShowAddForm when cancel is clicked', () => {
    render(<ItemForm {...defaultProps} />);

    fireEvent.click(screen.getByText('Cancel'));

    expect(mockSetShowAddForm).toHaveBeenCalledWith(false);
  });

  it('should disable form during submission', async () => {
    mockOnAdd.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<ItemForm {...defaultProps} />);

    // Preencher e submeter
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'Test Product' }
    });
    fireEvent.change(screen.getByLabelText(/category/i), {
      target: { value: 'Electronics' }
    });
    fireEvent.change(screen.getByLabelText(/price/i), {
      target: { value: '100' }
    });

    fireEvent.click(screen.getByText('Add Item'));

    // Verificar se os campos estão desabilitados
    expect(screen.getByLabelText(/name/i)).toBeDisabled();
    expect(screen.getByLabelText(/category/i)).toBeDisabled();
    expect(screen.getByLabelText(/price/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /add item/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
  });

  it('should clear form after successful submission', async () => {
    render(<ItemForm {...defaultProps} />);

    // Preencher o formulário
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'Test Product' }
    });
    fireEvent.change(screen.getByLabelText(/category/i), {
      target: { value: 'Electronics' }
    });
    fireEvent.change(screen.getByLabelText(/price/i), {
      target: { value: '100' }
    });

    // Submeter
    fireEvent.click(screen.getByText('Add Item'));

    await waitFor(() => {
      expect(screen.getByLabelText(/name/i).value).toBe('');
      expect(screen.getByLabelText(/category/i).value).toBe('');
      expect(screen.getByLabelText(/price/i).value).toBe('');
    });
  });

  it('should handle invalid price input', () => {
    render(<ItemForm {...defaultProps} />);

    const priceInput = screen.getByLabelText(/price/i);
    
    // Testar entrada inválida
    fireEvent.change(priceInput, { target: { value: 'abc' } });
    fireEvent.blur(priceInput);

    expect(priceInput.value).toBe('');
  });
}); 