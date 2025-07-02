import React, { useEffect, useState } from 'react';
import { useData } from '../../state/DataContext';
import { Link } from 'react-router-dom';
import VirtualizedItems from '../../components/virtualizedItems/index';
import styles from './Items.module.css';
import ItemForm from '../../components/ItemForm';

function Items() {
  const { items, fetchItems, pagination, createItem } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    setPage(pagination.page);
  }, [pagination.page]);

  useEffect(() => {
    setLoading(true);
    const controller = new AbortController();
    const fetchData = async () => {
      try {
        await fetchItems(controller.signal, searchTerm, page, limit);
      } catch (error) {
        console.error('Error fetching items:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    return () => controller.abort();
  }, [fetchItems, searchTerm, page, limit]);

  const handleAddItem = async (itemData) => {
    try {
      setFormError('');
      await createItem(itemData);
      setShowAddForm(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      setFormError('Error creating item: ' + error.message);
      setTimeout(() => setFormError(''), 5000);
    }
  };

  const handlePageChange = (newPage) => {
    setLoading(true);
    setPage(newPage);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <input
          type="text"
          placeholder="Search by name..."
          value={searchTerm}
          onChange={e => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          className={styles.input}
        />
        <button
          onClick={() => setShowAddForm(v => !v)}
          className={styles.addButton}
          title={showAddForm ? 'Close add form' : 'Add new item'}
        >
          {showAddForm ? '\u00d7' : '+'}
        </button>
      </div>

      {showSuccess && (
        <div className={styles.successMessage}>
          <span className={styles.successIcon}>\u2713</span>
          Item created successfully!
        </div>
      )}

      {showAddForm && (
        <ItemForm
          onAdd={handleAddItem}
          formError={formError}
          showAddForm={showAddForm}
          setShowAddForm={setShowAddForm}
        />
      )}

      <VirtualizedItems
        items={items}
        loading={loading}
        emptyMessage={searchTerm ? 'No items found for your search.' : undefined}
      />

      {pagination.totalPages > 1 && (
        <div className={styles.pagination}>
          <button 
            onClick={() => handlePageChange(page - 1)} 
            disabled={page === 1 || loading}
            className={styles.prevButton}
          >
            Previous
          </button>
          <span className={styles.pagnationNavMajor}>
            Page {page} of {pagination.totalPages}
          </span>
          <span className={styles.pagnationNavMinor}>
            {page}/{pagination.totalPages}
          </span>
          <button 
            onClick={() => handlePageChange(page + 1)} 
            disabled={page === pagination.totalPages || loading}
            className={styles.nextButton}
          >
            Next
          </button>
        </div>
      )}

      {!loading && !items.length && (
        <p className={styles.message}>
          {searchTerm ? 'No items found for your search.' : 'No items available.'}
        </p>
      )}
    </div>
  );
}

export default Items;