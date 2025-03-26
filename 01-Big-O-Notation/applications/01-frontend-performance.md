# Frontend Performance

**Navigation:** [🏠 Home](../../README.md) > [📚 Big O Notation](../README.md) > [🌐 Applications](./README.md) > Frontend Performance

This document explores how Big O Notation applies to frontend web development, with practical examples for optimizing JavaScript and React applications.

## Component Rendering

### React Component Rendering Optimization

```jsx
// Inefficient: O(n²) rendering with nested loops
function ProductTable({ products, categories }) {
  return (
    <table>
      <tbody>
        {categories.map(category => (
          <tr key={category.id}>
            <td colSpan="3">{category.name}</td>
            {/* Nested loop creating O(n²) complexity */}
            {products.map(product =>
              product.categoryId === category.id ? (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>{product.price}</td>
                  <td>{product.stock}</td>
                </tr>
              ) : null
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

**Optimized Version: Pre-process data to avoid nested loops**
```jsx
function ProductTable({ products, categories }) {
  // O(n) preprocessing to create a mapping
  const productsByCategory = {};
  products.forEach(product => {
    if (!productsByCategory[product.categoryId]) {
      productsByCategory[product.categoryId] = [];
    }
    productsByCategory[product.categoryId].push(product);
  });

  return (
    <table>
      <tbody>
        {categories.map(category => (
          <React.Fragment key={category.id}>
            <tr>
              <td colSpan="3">{category.name}</td>
            </tr>
            {/* O(n) total rendering with no nested loops over the full dataset */}
            {(productsByCategory[category.id] || []).map(product => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>{product.price}</td>
                <td>{product.stock}</td>
              </tr>
            ))}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  );
}
```

### Virtual DOM and List Virtualization

**Problem: Rendering large lists**
- React's reconciliation algorithm is O(n) where n is the number of elements
- Large lists can cause performance issues

**Solution: Virtualization**
```jsx
import { FixedSizeList } from 'react-window';

// Only renders visible items (O(visible_items) instead of O(all_items))
function VirtualizedList({ items }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      {items[index].name} - {items[index].value}
    </div>
  );

  return (
    <FixedSizeList
      height={500}
      width="100%"
      itemCount={items.length}
      itemSize={35}
    >
      {Row}
    </FixedSizeList>
  );
}
```

## State Management

### Optimizing Re-renders with Memoization

**Inefficient: Unnecessarily recalculating derived data**
```jsx
function UserDashboard({ users }) {
  // O(n) operation performed on every render
  const activeUsers = users.filter(user => user.isActive);
  const totalBalance = users.reduce((sum, user) => sum + user.balance, 0);

  return (
    <div>
      <h2>Active Users: {activeUsers.length}</h2>
      <h2>Total Balance: ${totalBalance}</h2>
      {/* Component body */}
    </div>
  );
}
```

**Optimized: Memoizing expensive calculations**
```jsx
import { useMemo } from 'react';

function UserDashboard({ users }) {
  // O(n) operations only run when users change
  const activeUsers = useMemo(() => {
    return users.filter(user => user.isActive);
  }, [users]);

  const totalBalance = useMemo(() => {
    return users.reduce((sum, user) => sum + user.balance, 0);
  }, [users]);

  return (
    <div>
      <h2>Active Users: {activeUsers.length}</h2>
      <h2>Total Balance: ${totalBalance}</h2>
      {/* Component body */}
    </div>
  );
}
```

## Client-Side Search and Filtering

### Basic vs. Optimized Search Implementation

**Basic Search: O(n * m) where n is items count and m is average string length**
```javascript
function searchProducts(products, query) {
  const lowerQuery = query.toLowerCase();
  return products.filter(product =>
    product.name.toLowerCase().includes(lowerQuery)
  );
}
```

**Optimized: Pre-indexing for O(1) lookup with Trie data structure**
```javascript
class TrieNode {
  constructor() {
    this.children = {};
    this.isEndOfWord = false;
    this.products = [];
  }
}

class ProductSearch {
  constructor(products) {
    this.root = new TrieNode();
    this.buildTrie(products);
  }

  // O(n * m) one-time cost to build the trie
  buildTrie(products) {
    products.forEach(product => {
      const name = product.name.toLowerCase();

      // Index each word in the product name
      name.split(' ').forEach(word => {
        let current = this.root;

        for (const char of word) {
          if (!current.children[char]) {
            current.children[char] = new TrieNode();
          }
          current = current.children[char];
          current.products.push(product);
        }

        current.isEndOfWord = true;
      });
    });
  }

  // O(k + results) where k is query length
  search(query) {
    const lowerQuery = query.toLowerCase();
    let current = this.root;

    for (const char of lowerQuery) {
      if (!current.children[char]) {
        return []; // No matches
      }
      current = current.children[char];
    }

    return current.products;
  }
}

// Usage
const productSearch = new ProductSearch(allProducts);
const results = productSearch.search('phone'); // Fast O(k) lookup
```

## Performance Tips

1. **Avoid nested rendering loops** - They create O(n²) complexity
2. **Use memoization** - Prevent unnecessary recalculations with `useMemo` and `React.memo`
3. **Implement virtualization** for large lists - Only render what's visible
4. **Debounce search inputs** - Limit the frequency of expensive operations
5. **Pre-process data** when possible - Transform data once instead of in each render
6. **Use efficient data structures** - Tries for search, Maps for lookups

---

**Navigation**
- [⬅️ Previous: Applications Overview](./README.md)
- [⬆️ Up to Applications](./README.md)
- [➡️ Next: Backend Systems](./02-backend-systems.md)