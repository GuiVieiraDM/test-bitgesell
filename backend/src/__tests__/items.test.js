const request = require('supertest');
const express = require('express');
const fs = require('fs').promises;

// Mock fs to control file operations in tests
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    stat: jest.fn()
  }
}));

// Import the items router
const itemsRouter = require('../routes/items');

// Create a test app
const app = express();
app.use(express.json());
app.use('/api/items', itemsRouter);

// Sample data for tests
const mockItems = [
  { id: 1, name: "Laptop Pro", category: "Electronics", price: 2499 },
  { id: 2, name: "Noise Cancelling Headphones", category: "Electronics", price: 399 },
  { id: 3, name: "Ultra-Wide Monitor", category: "Electronics", price: 999 }
];

describe('Items Routes', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('GET /api/items', () => {
    it('should return all items when no query parameters are provided', async () => {
      fs.readFile.mockResolvedValue(JSON.stringify(mockItems));
      const response = await request(app)
        .get('/api/items?limit=10')
        .expect(200);
      expect(response.body.items).toEqual(mockItems);
      expect(response.body.pagination).toEqual({
        page: 1,
        pageSize: 10,
        total: 3,
        totalPages: 1
      });
    });

    it('should filter items by search term', async () => {
      fs.readFile.mockResolvedValue(JSON.stringify(mockItems));
      const response = await request(app)
        .get('/api/items?q=laptop')
        .expect(200);
      expect(response.body.items).toHaveLength(1);
      expect(response.body.items[0].name).toBe('Laptop Pro');
    });

    it('should paginate items correctly', async () => {
      fs.readFile.mockResolvedValue(JSON.stringify(mockItems));
      const response = await request(app)
        .get('/api/items?limit=2&page=2')
        .expect(200);
      expect(response.body.items).toHaveLength(1);
      expect(response.body.pagination).toEqual({
        page: 2,
        pageSize: 2,
        total: 3,
        totalPages: 2
      });
    });

    it('should return 500 when file read fails', async () => {
      fs.readFile.mockRejectedValue(new Error('Read error'));
      await request(app)
        .get('/api/items')
        .expect(500);
    });
  });

  describe('GET /api/items/:id', () => {
    it('should return the correct item by id', async () => {
      fs.readFile.mockResolvedValue(JSON.stringify(mockItems));
      const response = await request(app)
        .get('/api/items/1')
        .expect(200);
      expect(response.body).toEqual(mockItems[0]);
    });

    it('should return 404 if item does not exist', async () => {
      fs.readFile.mockResolvedValue(JSON.stringify(mockItems));
      const response = await request(app)
        .get('/api/items/999')
        .expect(404);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /api/items', () => {
    it('should create a new item with valid data', async () => {
      const newItem = { name: 'Test Item', category: 'Test', price: 100 };
      fs.readFile.mockResolvedValue(JSON.stringify(mockItems));
      fs.writeFile.mockResolvedValue();
      const response = await request(app)
        .post('/api/items')
        .send(newItem)
        .expect(201);
      expect(response.body).toMatchObject(newItem);
      expect(response.body.id).toBeDefined();
      expect(fs.writeFile).toHaveBeenCalled();
    });

    it('should return 400 for invalid data (missing name)', async () => {
      const invalidItem = { category: 'Test', price: 100 };
      const response = await request(app)
        .post('/api/items')
        .send(invalidItem)
        .expect(400);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for invalid data (price not a number)', async () => {
      const invalidItem = { name: 'Test Item', category: 'Test', price: '100' };
      const response = await request(app)
        .post('/api/items')
        .send(invalidItem)
        .expect(400);
      expect(response.body.error).toBeDefined();
    });

    it('should return 500 when file write fails', async () => {
      const newItem = { name: 'Test Item', category: 'Test', price: 100 };
      fs.readFile.mockResolvedValue(JSON.stringify(mockItems));
      fs.writeFile.mockRejectedValue(new Error('Write error'));
      await request(app)
        .post('/api/items')
        .send(newItem)
        .expect(500);
    });
  });
});