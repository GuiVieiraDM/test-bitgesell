# SOLUTION.md

## 🔧 Backend (Node.js)

### 1. Refactor blocking I/O
**Requirement:**  
`src/routes/items.js` uses `fs.readFileSync`. Replace with non-blocking async operations.

**Solution:**  
I refactored all file operations in `src/routes/items.js` to use the asynchronous `fs.promises` API. This ensures that the server does not block the event loop while reading or writing files, improving scalability and responsiveness under load.

---

### 2. Performance: Stats Endpoint
**Requirement:**  
GET `/api/stats` recalculates stats on every request. Cache results, watch file changes, or introduce a smarter strategy.

**Solution:**  
I implemented a simple in-memory cache for the stats endpoint. The stats are recalculated only when the underlying `items.json` file changes, using `fs.watch` to invalidate the cache. This significantly reduces unnecessary computation and improves response times for repeated requests.

---

### 3. Testing: Items Routes
**Requirement:**  
Add unit tests (Jest) for items routes (happy path + error cases).

**Solution:**  
I created comprehensive Jest tests for the items routes, covering both successful operations and error scenarios (e.g., file not found, invalid input). The tests mock file system operations to ensure reliability and speed, and can be run with `npm test` in the backend directory.

---

## 💻 Frontend (React)

### 4. Memory Leak in Items.js
**Requirement:**  
`Items.js` leaks memory if the component unmounts before fetch completes. Fix it.

**Solution:**  
I fixed the memory leak by using an `AbortController` in the `useEffect` that fetches items. The fetch is aborted in the cleanup function if the component unmounts, preventing state updates on unmounted components.

---

### 5. Pagination & Search
**Requirement:**  
Implement paginated list with server-side search (`q` param). Contribute to both client and server.

**Solution:**  
I implemented server-side pagination and search by supporting `page`, `limit`, and `q` query parameters in the backend. On the frontend, the Items page now includes a search input and paginated navigation, sending the appropriate parameters to the API and updating the UI accordingly.

---

### 6. Performance: List Virtualization
**Requirement:**  
The list can grow large. Integrate virtualization (e.g., react-window) to keep UI smooth.

**Solution:**  
I integrated `react-window` in the Items list component to virtualize rendering. Only visible items are rendered to the DOM, which keeps the UI fast and responsive even with large datasets.

---

### 7. UI/UX Polish
**Requirement:**  
Enhance styling, accessibility, and add loading/skeleton states.

**Solution:**  
I improved the UI with better styling and accessibility (semantic HTML, proper labels, keyboard navigation). Loading and skeleton states were added to provide feedback during data fetches, resulting in a more polished and user-friendly experience.

---

## 📦 What We Expect

- **Idiomatic, clean code:**  
  All code was refactored for readability, maintainability, and follows best practices. Only essential comments are included.

- **Solid error handling and edge-case consideration:**  
  Both backend and frontend handle errors gracefully, with user feedback and robust fallback logic.

- **Tests that pass via `npm test` in both frontend and backend:**  
  All tests are passing and cover both typical and edge cases.

---

**Trade-offs:**  
- The in-memory cache for stats is simple and resets on server restart. For production, a more persistent or distributed cache may be preferable.
- File watching is used for cache invalidation, which is efficient for small-scale apps but may need tuning for larger deployments. 