import React from 'react';
import { FixedSizeList as List } from 'react-window';
import { Link } from 'react-router-dom';
import styles from './VirtualizedItems.module.css';

const VirtualizedItems = ({ items, height = 600, itemHeight = 50, loading = false }) => {
  const itemCount = loading ? 10 : items.length;
  const Row = ({ index, style }) => {
    return (
      <div style={style} className="item">
        {loading ? (
          <div className={styles.skeleton} />
        ) : (
          <Link to={`/items/${items[index].id}`} className={styles.link}>
            {items[index].name}
          </Link>
        )}
      </div>
    );
  };

  return (
    <List
      height={height}
      itemCount={itemCount}
      itemSize={itemHeight}
      width="100%"
      className={styles.list}
    >
      {Row}
    </List>
  );
};

export default VirtualizedItems;