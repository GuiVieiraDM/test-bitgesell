const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();
const DATA_PATH = path.join(__dirname, '../../../data/items.json');

// Utility to read data (intentionally sync to highlight blocking issue) ✅
async function readData() {
  try {
    const raw = await fs.readFile(DATA_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Error to read data: ${error.message}`)
  }
}

async function writeData(data) {
  try {
    await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    throw new Error(`Error to write data: ${error.message}`)
  }
}

// GET /api/items
router.get('/', async (req, res, next) => {
  try {
    const data = await readData();
    const { q, page = 1, limit = 10 } = req.query;
    let results = data;

    if (q) {
      results = results.filter(item =>
        item.name.toLowerCase().includes(q.toLowerCase())
      );
    }

    const pageInt = parseInt(page, 10);
    const limitInt = parseInt(limit, 10);
    const startIndex = (pageInt - 1) * limitInt;
    const endIndex = startIndex + limitInt;
    const paginatedResults = results.slice(startIndex, endIndex);

    res.json({
      items: paginatedResults,
      pagination: {
        page: pageInt,
        pageSize: limitInt,
        total: results.length,
        totalPages: Math.ceil(results.length / limitInt)
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/items/:id
router.get('/:id', async (req, res, next) => {
  try {
    const data = await readData();
    const item = data.find(i => i.id === parseInt(req.params.id));
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// POST /api/items
router.post('/', async (req, res, next) => {
  try {
    // Validação simples (pode melhorar depois)
    const { name, category, price } = req.body;
    if (!name || !category || typeof price !== 'number') {
      return res.status(400).json({ error: 'Invalid data' });
    }

    // Aguarde a leitura dos dados
    const data = await readData();
    const maxId = data.length > 0 ? Math.max(...data.map(i => i.id)) : 0;
    const item = { id: maxId + 1, name, category, price };
    data.push(item);

    // Escreva de forma assíncrona
    await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
    res.status(201).json(item);
  } catch (err) {
    console.error('POST /api/items error:', err);
     next(err);
  }
});

module.exports = router;