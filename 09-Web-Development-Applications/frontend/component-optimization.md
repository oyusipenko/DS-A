# Component Rendering Optimization

**Navigation:** [🏠 Home](../../README.md) > [🌐 Web Development Applications](../README.md) > [💻 Frontend Performance](./README.md) > Component Optimization

## React Component Rendering

### Problem: Inefficient Nested Loops

When rendering hierarchical data, naive implementations often use nested loops, resulting in O(n²) rendering complexity:

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

### Solution: Data Pre-processing

By pre-processing the data to create a mapping before rendering, we can eliminate nested loops over the full dataset:

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

## Virtual DOM and List Virtualization

### Problem: Rendering Large Lists

React's reconciliation algorithm is O(n) where n is the number of elements. Large lists can cause significant performance issues.

### Solution: Windowing / Virtualization

By rendering only visible items, we can reduce the complexity from O(all_items) to O(visible_items):

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

## Memoization and Preventing Re-renders

### Problem: Unnecessary Recalculations

Derived values are often recalculated on every render, even when inputs haven't changed:

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

### Solution: Memoizing Expensive Calculations

Use React's useMemo hook to cache results and only recalculate when dependencies change:

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

## Performance Tips for Component Rendering

1. **Use React.memo for pure components** - Prevents re-renders when props haven't changed

2. **Implement shouldComponentUpdate or React.PureComponent** - For class components to prevent unnecessary renders

3. **Lift state up judiciously** - Don't put all state at the root, which causes cascading re-renders

4. **Use the key prop correctly** - Always use stable, unique keys for list items to optimize reconciliation

5. **Debounce rapidly changing values** - For inputs or other frequently changing values that trigger renders

---

**Navigation**
- [⬅️ Back to Frontend Performance](./README.md)
- [➡️ Next: State Management Optimization](./state-management.md)