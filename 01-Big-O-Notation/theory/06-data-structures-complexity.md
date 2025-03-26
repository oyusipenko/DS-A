# Data Structures Complexity Reference

**Navigation:** [🏠 Home](../../README.md) > [📚 Big O Notation](../README.md) > [📖 Theory](./00-index.md) > Data Structures Complexity

This document provides a quick reference for time and space complexity of common data structures used in web development.

## Time Complexity Comparison

| Data Structure | Access | Search | Insertion | Deletion | Notes |
|---------------|--------|--------|-----------|----------|-------|
| **Array** | O(1) | O(n) | O(n) | O(n) | Insertions/deletions require shifting elements |
| **Dynamic Array** | O(1) | O(n) | O(1)* | O(n) | *Amortized constant time for append |
| **Linked List** | O(n) | O(n) | O(1)** | O(1)** | **O(1) with reference to node, O(n) to find position |
| **Doubly Linked List** | O(n) | O(n) | O(1)** | O(1)** | Bidirectional traversal possible |
| **Stack** | O(n) | O(n) | O(1) | O(1) | LIFO (Last In First Out) |
| **Queue** | O(n) | O(n) | O(1) | O(1) | FIFO (First In First Out) |
| **Hash Table** | N/A | O(1)* | O(1)* | O(1)* | *Average case, O(n) worst case due to collisions |
| **Binary Search Tree** | O(log n)* | O(log n)* | O(log n)* | O(log n)* | *Average case, O(n) worst case if unbalanced |
| **AVL Tree** | O(log n) | O(log n) | O(log n) | O(log n) | Self-balancing; guaranteed log n operations |
| **Red-Black Tree** | O(log n) | O(log n) | O(log n) | O(log n) | Self-balancing; more efficient rebalancing than AVL |
| **B-Tree** | O(log n) | O(log n) | O(log n) | O(log n) | Commonly used in databases and file systems |
| **Heap** | O(1) for max/min<br>O(n) for others | O(n) | O(log n) | O(log n) | Efficient for priority queues |
| **Trie** | O(k) | O(k) | O(k) | O(k) | k is key length; efficient for string operations |
| **Graph (Adjacency List)** | O(1)* | O(V+E) | O(1) | O(V+E) | *For direct access to vertex, O(V+E) for path finding |
| **Graph (Adjacency Matrix)** | O(1) | O(V) | O(1) | O(V) | Space inefficient for sparse graphs O(V²) |

## Space Complexity

| Data Structure | Space Complexity | Notes |
|---------------|------------------|-------|
| **Array** | O(n) | Contiguous memory allocation |
| **Linked List** | O(n) | Extra space for pointers |
| **Hash Table** | O(n) | Space for key-value pairs and hash buckets |
| **Binary Search Tree** | O(n) | Pointers to child nodes |
| **AVL/Red-Black Tree** | O(n) | Extra space for balance information |
| **Heap** | O(n) | Usually implemented as arrays |
| **Trie** | O(n*k) | k is average key length, heavily dependent on character set |
| **Graph (Adjacency List)** | O(V+E) | Space efficient for sparse graphs |
| **Graph (Adjacency Matrix)** | O(V²) | Fixed size regardless of number of edges |

## JavaScript-Specific Implementation Notes

### JavaScript Array Operations

| Operation | Time Complexity | Notes |
|-----------|----------------|-------|
| **arr[i]** | O(1) | Direct index access |
| **arr.push()** | O(1)* | *Amortized for occasional resize |
| **arr.pop()** | O(1) | Remove from end |
| **arr.shift()** | O(n) | Remove from beginning, requires reindexing |
| **arr.unshift()** | O(n) | Add to beginning, requires reindexing |
| **arr.splice()** | O(n) | Requires shifting elements |
| **arr.slice()** | O(n) | Creates new array |
| **arr.indexOf()** | O(n) | Linear search |
| **arr.concat()** | O(n) | Creates new array |
| **arr.forEach()/map()/filter()/reduce()** | O(n) | Processes all elements |
| **arr.sort()** | O(n log n) | Implementation-dependent |

### JavaScript Object/Map Operations

| Operation | Time Complexity | Notes |
|-----------|----------------|-------|
| **obj[key]** | O(1) average | Hash table lookup |
| **obj[key] = value** | O(1) average | Hash table insertion |
| **key in obj** | O(1) average | Property existence check |
| **delete obj[key]** | O(1) average | Property deletion |
| **Object.keys(obj)** | O(n) | Creates array of all keys |
| **Object.values(obj)** | O(n) | Creates array of all values |
| **Object.entries(obj)** | O(n) | Creates array of [key, value] pairs |
| **Map.get(key)** | O(1) average | Map lookup |
| **Map.set(key, value)** | O(1) average | Map insertion |
| **Map.has(key)** | O(1) average | Key existence check |
| **Map.delete(key)** | O(1) average | Key deletion |

### JavaScript Set Operations

| Operation | Time Complexity | Notes |
|-----------|----------------|-------|
| **new Set(arr)** | O(n) | Create from array |
| **set.add(value)** | O(1) average | Add unique value |
| **set.has(value)** | O(1) average | Check existence |
| **set.delete(value)** | O(1) average | Remove value |
| **set.size** | O(1) | Get size |

## Common Data Structure Selection Guide

### When to use each data structure:

1. **Array**:
   - When you need random access by index
   - When data size is fixed or changes infrequently
   - When memory locality is important for performance

2. **Linked List**:
   - When frequent insertions/deletions are needed
   - When you don't need random access
   - When memory allocation needs to be dynamic

3. **Hash Table** (Object/Map in JavaScript):
   - When you need fast lookups by key
   - When data has unique identifiers
   - When order is not important

4. **Binary Search Tree**:
   - When you need ordered data with fast search/insert/delete
   - When you need to find ranges of values

5. **Heap**:
   - When you need quick access to minimum/maximum value
   - For implementing priority queues
   - For efficient heap sort

6. **Trie**:
   - For prefix-based searches
   - For autocomplete features
   - For spell checking

7. **Graph**:
   - For representing relationships between objects
   - For path finding (e.g., navigation, routing)
   - For network analysis

## Performance Tradeoffs

### Array vs. Linked List
- Arrays have O(1) access but O(n) insertion/deletion
- Linked Lists have O(n) access but O(1) insertion/deletion with a reference
- Arrays have better cache locality
- Linked Lists have no size limitations and no resizing cost

### Hash Table vs. BST
- Hash tables have O(1) average operations but don't maintain order
- BSTs have O(log n) operations but maintain sorted order
- Hash tables may require rehashing when they grow
- BSTs require rebalancing to maintain efficiency

### Adjacency List vs. Adjacency Matrix
- Lists use less space for sparse graphs: O(V+E) vs O(V²)
- Matrices allow O(1) edge lookup
- Lists are better for most real-world graphs
- Matrices are better for dense graphs

## Optimization Strategies

1. **Choose the right data structure** based on the operations you'll perform most frequently
2. **Use specialized data structures** for specific problems (e.g., Trie for prefix search)
3. **Consider memory usage vs. speed tradeoffs** based on your constraints
4. **Understand the constants hidden by Big O** - sometimes a technically "slower" data structure is faster in practice for small inputs
5. **Watch for language-specific optimizations** in implementation

---

**Navigation**
- [⬅️ Previous: Practical Examples](./05-practical-examples.md)
- [⬆️ Up to Theory Index](./00-index.md)
- [➡️ Next: Algorithm Selection Guide](./07-algorithm-selection-guide.md)