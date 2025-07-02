import React, { useState } from 'react';
import styles from '../../pages/Items/Items.module.css';

const formatCurrency = (value) => {
  if (value === '' || isNaN(Number(value))) return '';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value));
};

const ItemForm = ({ onAdd, formError, showAddForm, setShowAddForm }) => {
  const [formData, setFormData] = useState({ name: '', category: '', price: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [displayPrice, setDisplayPrice] = useState('');
  const [isPriceFocused, setIsPriceFocused] = useState(false);

  const handlePriceChange = (e) => {
    const raw = e.target.value.replace(/[^\d.]/g, '');
    setFormData({ ...formData, price: raw });
    setDisplayPrice(raw);
  };

  const handlePriceBlur = () => {
    if (formData.price === '' || isNaN(Number(formData.price))) {
      setDisplayPrice('');
    } else {
      setDisplayPrice(formatCurrency(formData.price));
    }
    setIsPriceFocused(false);
  };

  const handlePriceFocus = () => {
    setDisplayPrice(formData.price);
    setIsPriceFocused(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const item = {
        name: formData.name,
        category: formData.category,
        price: Number(formData.price)
      };
      await onAdd(item);
      setFormData({ name: '', category: '', price: '' });
      setDisplayPrice('');
    } catch (error) {
      // Error is handled in parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.form}>
      <h3 className={styles.formTitle}>Add New Item</h3>
      {formError && (
        <div className={styles.errorMessage}>
          <span className={styles.errorIcon}>⚠</span>
          {formError}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="name">Name:</label>
          <input
            type="text"
            value={formData.name}
            required
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            className={styles.formInput}
            id="name"
            disabled={isSubmitting}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="category">Category:</label>
          <input
            type="text"
            value={formData.category}
            //required // intentionaly not required to test the form handling error
            onChange={e => setFormData({ ...formData, category: e.target.value })}
            className={styles.formInput}
            id="category"
            disabled={isSubmitting}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="price">Price:</label>
          <input
            type="text"
            value={isPriceFocused ? formData.price : displayPrice}
            required
            onChange={handlePriceChange}
            onBlur={handlePriceBlur}
            onFocus={handlePriceFocus}
            className={styles.formInput}
            id="price"
            disabled={isSubmitting}
            inputMode="decimal"
            pattern="^\$?\d+(,\d{3})*(\.\d{0,2})?$"
            placeholder="$0.00"
            autoComplete="off"
          />
        </div>
        <div className={styles.formButtons}>
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={isSubmitting}
          >
            <span className={styles.buttonText}>Add Item</span>
            <span className={styles.loadingText}>Adding...</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAddForm(false)}
            className={styles.cancelButton}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ItemForm; 