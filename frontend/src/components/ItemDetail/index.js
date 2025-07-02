import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import styles from './ItemDetail.module.css';

function ItemDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    fetch('/api/items/' + id)
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(data => {
        setItem(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        navigate('/');
      });
  }, [id, navigate]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Link to="/" className={styles.backButton}>
            ← Back to Items
          </Link>
        </div>
        <div className={styles.card}>
          <div className={styles.skeleton} style={{ height: '32px', marginBottom: '20px' }}></div>
          <div className={styles.skeleton} style={{ width: '60%' }}></div>
          <div className={styles.skeleton} style={{ width: '40%' }}></div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Link to="/" className={styles.backButton}>
            ← Back to Items
          </Link>
        </div>
        <div className={styles.card}>
          <h2 className={styles.title}>Item not found</h2>
          <p>The item you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backButton}>
          ← Back to Items
        </Link>
      </div>
      
      <div className={styles.card}>
        <h1 className={styles.title}>{item.name}</h1>
        
        <div className={styles.detailRow}>
          <span className={styles.label}>Category:</span>
          <span className={styles.value}>{item.category}</span>
        </div>
        
        <div className={styles.detailRow}>
          <span className={styles.label}>Price:</span>
          <span className={styles.price}>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.price)}</span>
        </div>
        
        <div className={styles.detailRow}>
          <span className={styles.label}>ID:</span>
          <span className={styles.value}>{item.id}</span>
        </div>
      </div>
    </div>
  );
}

export default ItemDetail;