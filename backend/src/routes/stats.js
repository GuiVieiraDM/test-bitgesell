const express = require('express');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const router = express.Router();
const DATA_PATH = path.join(__dirname, '../../data/items.json');

let statsCache = null;
let lastFileModified = null;
let isInitialized = false;

// Calculates statistics from items array
function calculateStats(items) {
  if (!Array.isArray(items) || !items.length) {
    return {
      total: 0,
      averagePrice: 0,
      categories: {},
      priceRange: { min: 0, max: 0 }
    };
  }
  const prices = items.map(item => item.price);
  const categories = items.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});
  return {
    total: items.length,
    averagePrice: Math.round((prices.reduce((a, b) => a + b, 0) / items.length) * 100) / 100,
    categories,
    priceRange: { min: Math.min(...prices), max: Math.max(...prices) }
  };
}

// Updates the cache by reading and processing the data file
async function updateCache() {
  try {
    const raw = await fs.readFile(DATA_PATH, 'utf8');
    let items;
    try {
      items = JSON.parse(raw);
    } catch (parseErr) {
      console.error('Failed to parse items.json:', parseErr);
      throw new Error('Data file is corrupted or not valid JSON.');
    }
    statsCache = calculateStats(items);
    const stats = await fs.stat(DATA_PATH);
    lastFileModified = stats.mtime.getTime();
  } catch (err) {
    console.error('Error updating stats cache:', err);
    // Invalidate cache on error
    statsCache = null;
    lastFileModified = null;
    throw err;
  }
}

// Checks if the cache is still valid by comparing file modification time
async function isCacheValid() {
  try {
    const stats = await fs.stat(DATA_PATH);
    return lastFileModified && stats.mtime.getTime() === lastFileModified;
  } catch (err) {
    // File might not exist or be accessible
    console.error('Error checking file stats:', err);
    return false;
  }
}

// Sets up a file watcher to invalidate the cache on file changes
function setupFileWatcher() {
  if (isInitialized) return;
  try {
    if (fsSync.existsSync(DATA_PATH)) {
      fsSync.watch(DATA_PATH, (eventType) => {
        if (eventType === 'change' || eventType === 'rename') {
          statsCache = null;
          lastFileModified = null;
        }
      });
      isInitialized = true;
    } else {
      console.warn('Data file does not exist. File watcher not started.');
    }
  } catch (err) {
    console.error('Failed to set up file watcher:', err);
  }
}

// GET /api/stats
router.get('/', async (req, res, next) => {
  try {
    setupFileWatcher();
    if (!statsCache || !(await isCacheValid())) {
      await updateCache();
    }
    if (!statsCache) {
      // If cache is still null, something went wrong
      return res.status(500).json({ error: 'Failed to calculate statistics.' });
    }
    res.json(statsCache);
  } catch (err) {
    // Edge-case: file not found, permission denied, corrupted file, etc.
    if (err.code === 'ENOENT') {
      res.status(404).json({ error: 'Data file not found.' });
    } else if (err.message && err.message.includes('Data file is corrupted')) {
      res.status(500).json({ error: 'Data file is corrupted or not valid JSON.' });
    } else {
      res.status(500).json({ error: 'Internal server error.' });
    }
  }
});

module.exports = router;