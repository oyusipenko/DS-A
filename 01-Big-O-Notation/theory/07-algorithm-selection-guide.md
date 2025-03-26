# Algorithm Selection Guide

**Navigation:** [🏠 Home](../../README.md) > [📚 Big O Notation](../README.md) > [📖 Theory](./00-index.md) > Algorithm Selection Guide

This guide will help you choose the most appropriate algorithm based on your specific requirements and constraints. Understanding Big O helps you make informed decisions about algorithm selection.

## Searching Algorithms

| Algorithm | Time Complexity | Space Complexity | Best For | Avoid When |
|-----------|----------------|------------------|----------|------------|
| **Linear Search** | O(n) | O(1) | Unsorted data<br>Small datasets | Large sorted datasets |
| **Binary Search** | O(log n) | O(1) iterative<br>O(log n) recursive | Sorted data<br>Large datasets | Unsorted data<br>Frequent updates |
| **Hash-based Search** | O(1) average | O(n) | Frequent lookups<br>Key-value pairs | Order matters<br>Memory constrained |
| **Breadth-First Search** | O(V+E) | O(V) | Shortest path<br>Level-by-level traversal | Deep graphs<br>Memory constraints |
| **Depth-First Search** | O(V+E) | O(h) where h is height | Path existence<br>Maze solving<br>Deep graphs | Shortest path<br>Level order needed |

### Decision Tree for Searching

```
Is your data sorted?
├── Yes → Do you need to find an exact match?
│       ├── Yes → Use Binary Search O(log n)
│       └── No → Do you need to find closest value?
│             ├── Yes → Use Binary Search with modification
│             └── No → Do you need range queries?
│                   ├── Yes → Consider B-Tree or similar O(log n)
│                   └── No → Binary Search probably sufficient
│
└── No → Can you afford to sort first?
        ├── Yes → Sort + Binary Search: O(n log n) + O(log n)
        └── No → Do you have unique keys?
              ├── Yes → Hash Table O(1) average
              └── No → Linear Search O(n)
```

## Sorting Algorithms

| Algorithm | Time Complexity | Space Complexity | Stable | Best For | Avoid When |
|-----------|----------------|------------------|--------|----------|------------|
| **Bubble Sort** | O(n²) | O(1) | Yes | Educational purposes<br>Nearly sorted data<br>Tiny arrays | Performance matters<br>Large arrays |
| **Insertion Sort** | O(n²) | O(1) | Yes | Small datasets<br>Nearly sorted data<br>Online (streaming) | Large unsorted arrays |
| **Selection Sort** | O(n²) | O(1) | No | Simple implementation<br>Minimizing writes | Large arrays<br>When stability matters |
| **Merge Sort** | O(n log n) | O(n) | Yes | Guaranteed performance<br>Linked lists<br>External sorting<br>Stability needed | Memory constraints<br>Simple cases |
| **Quick Sort** | O(n log n) average<br>O(n²) worst | O(log n) | No* | In-place sorting<br>Average performance<br>Cache efficiency | Stability required<br>Worst case unacceptable |
| **Heap Sort** | O(n log n) | O(1) | No | Memory constraints<br>Guaranteed performance | Stability required |
| **Counting Sort** | O(n+k) | O(n+k) | Yes | Small range of integers<br>k << n | Large range of values<br>Non-integer data |
| **Radix Sort** | O(d(n+k)) | O(n+k) | Yes | Large integers<br>Strings | When comparisons are cheap |

### Decision Tree for Sorting

```
How much data are you sorting?
├── Small amount (n < 50)
│     ├── Is the data nearly sorted? → Insertion Sort
│     └── Random data → Any sort works, Insertion often fast in practice
│
├── Medium amount
│     ├── Is stability required?
│     │     ├── Yes → Merge Sort
│     │     └── No → Quick Sort (with good pivot selection)
│     │
│     └── Memory constrained?
│           ├── Yes → Heap Sort
│           └── No → Merge Sort or Quick Sort
│
└── Large amount
      ├── Are elements integers in small range?
      │     ├── Yes → Counting Sort or Radix Sort
      │     └── No → Continue...
      │
      ├── External sorting needed?
      │     ├── Yes → Merge Sort based external sort
      │     └── No → Continue...
      │
      ├── Is stability required?
      │     ├── Yes → Merge Sort
      │     └── No → Quick Sort or Heap Sort
      │
      └── Memory constrained?
            ├── Yes → Heap Sort
            └── No → Merge Sort or Quick Sort
```

## Graph Algorithms

| Algorithm | Time Complexity | Space Complexity | Best For | Avoid When |
|-----------|----------------|------------------|----------|------------|
| **Breadth-First Search** | O(V+E) | O(V) | Shortest path (unweighted)<br>Connected components<br>Level order traversal | Memory constraints<br>Deep graphs |
| **Depth-First Search** | O(V+E) | O(V) | Path finding<br>Topological sorting<br>Cycle detection | Shortest path needed<br>Wide graphs |
| **Dijkstra's Algorithm** | O(V²) or O((V+E)log V) with heap | O(V) | Single-source shortest path<br>Positive weights only | Negative edges<br>All pairs needed |
| **Bellman-Ford** | O(V·E) | O(V) | Single-source shortest path<br>Can handle negative edges | Performance critical<br>No negative cycles expected |
| **Floyd-Warshall** | O(V³) | O(V²) | All-pairs shortest paths<br>Dense graphs | Very large graphs<br>Sparse graphs |
| **Kruskal's Algorithm** | O(E log E) | O(V) | Minimum spanning tree<br>Sparse graphs | Dense graphs |
| **Prim's Algorithm** | O(V²) or O(E log V) with heap | O(V) | Minimum spanning tree<br>Dense graphs | Very sparse graphs |
| **Topological Sort** | O(V+E) | O(V) | Dependency ordering<br>Task scheduling | Cyclic graphs |

### Decision Tree for Graph Problems

```
What type of graph problem are you solving?
├── Finding a path
│     ├── Shortest path?
│     │     ├── Unweighted graph → BFS
│     │     └── Weighted graph
│     │           ├── Negative weights?
│     │           │     ├── Yes → Bellman-Ford
│     │           │     └── No → Dijkstra's Algorithm
│     │           │
│     │           └── Need all pairs?
│     │                 ├── Yes → Floyd-Warshall
│     │                 └── No → Dijkstra's Algorithm
│     │
│     └── Just any path? → DFS usually simpler
│
├── Traversal order matters?
│     ├── Level order/breadth → BFS
│     └── Deep exploration → DFS
│
├── Finding minimum spanning tree
│     ├── Dense graph → Prim's Algorithm
│     └── Sparse graph → Kruskal's Algorithm
│
├── Finding cycles → DFS with cycle detection
│
└── Dependency ordering → Topological Sort (DFS)
```

## Dynamic Programming vs. Greedy Algorithms

| Characteristic | Dynamic Programming | Greedy Algorithm |
|----------------|---------------------|------------------|
| **Approach** | Breaks problem into subproblems and stores results | Makes locally optimal choice at each step |
| **Optimality** | Guarantees optimal solution | May not find optimal solution |
| **Time Complexity** | Often polynomial, depends on state space | Usually more efficient than DP |
| **Use When** | Overlapping subproblems<br>Optimal substructure<br>Finding all solutions | Making local choices leads to global optimum<br>Performance critical<br>Approximate solution acceptable |
| **Examples** | Knapsack, Longest Common Subsequence, Edit Distance | Huffman coding, Dijkstra's, Interval scheduling |

### Decision Tree for Optimization Problems

```
Does the problem have optimal substructure?
├── Yes → Does it have overlapping subproblems?
│        ├── Yes → Dynamic Programming
│        └── No → Consider divide and conquer
│
└── No → Can locally optimal choices lead to global optimum?
         ├── Yes → Greedy Algorithm
         └── No → May need other approaches (backtracking, branch and bound)
```

## String Algorithms

| Algorithm | Time Complexity | Space Complexity | Best For | Avoid When |
|-----------|----------------|------------------|----------|------------|
| **Naive String Matching** | O(n·m) | O(1) | Short strings<br>Simple cases | Performance critical<br>Long texts |
| **KMP Algorithm** | O(n+m) | O(m) | Single pattern matching<br>No preprocessing overhead | Multiple patterns |
| **Rabin-Karp** | O(n+m) average<br>O(n·m) worst | O(1) | Multiple pattern matching | Worst case unacceptable |
| **Boyer-Moore** | O(n/m) best<br>O(n·m) worst | O(k) k=alphabet size | Long patterns<br>Large alphabets | Small patterns<br>Preprocessing overhead |
| **Suffix Tree/Array** | O(n) construction<br>O(m) search | O(n) | Multiple searches on same text<br>Substring problems | Memory constraints<br>Single search |
| **Trie** | O(m) search/insert | O(ALPHABET_SIZE·KEY_LENGTH·n) | Prefix matching<br>Autocomplete | Memory constraints<br>Infrequent lookups |

### Decision Tree for String Problems

```
What's your string problem?
├── Pattern matching
│     ├── Single search on text?
│     │     ├── Short pattern → Naive might be sufficient
│     │     └── Longer pattern → KMP or Boyer-Moore
│     │
│     └── Multiple searches on same text?
│           ├── Memory available → Build Suffix Tree/Array
│           └── Memory constrained → Rabin-Karp
│
├── Dictionary operations?
│     ├── Exact matches → Hash Table
│     └── Prefix matching/autocomplete → Trie
│
└── Edit distance/similarity?
      └── Dynamic Programming approaches
```

## General Selection Guidelines

1. **Start simple**: Don't overengineer - use the simplest algorithm that meets requirements

2. **Consider constraints**:
   - Time complexity requirements
   - Memory limitations
   - Data characteristics (sorted, nearly sorted, range of values)
   - Expected input sizes
   - Frequency of operations

3. **Evaluate tradeoffs**:
   - Time vs. space complexity
   - Implementation complexity vs. performance gain
   - Average case vs. worst case
   - Code readability vs. optimization

4. **Remember constants matter**:
   - For small inputs, asymptotically slower algorithms may be faster
   - Cache performance and hardware considerations affect real-world performance
   - Modern language optimizations can change theoretical predictions

5. **Profile and measure**:
   - Theoretical analysis is a starting point
   - Real-world performance may differ
   - Different inputs can change algorithm behavior

## Web Development Specific Considerations

### Frontend Algorithm Selection

1. **UI Rendering and Animation**:
   - Prefer O(1) or O(log n) algorithms for frame-rate sensitive operations
   - Consider Web Workers for O(n) or slower operations
   - Virtual lists/windowing for large data sets

2. **State Management**:
   - Use normalized data with O(1) lookups for frequent updates
   - Consider immutable data structures for change detection
   - Balance memory usage against lookup speed

3. **Form Validation and Processing**:
   - Progressive validation for better UX over batch processing
   - Consider debouncing/throttling for expensive validations

### Backend Algorithm Selection

1. **API Design**:
   - Pagination/cursor-based iteration for large collections
   - Efficient indexing strategies for database queries
   - Caching for repeated computations

2. **Data Processing**:
   - Stream processing for large datasets
   - Batch processing for expensive operations
   - Consider parallelization for independent tasks

3. **Authentication/Security**:
   - Constant-time comparisons for sensitive data
   - Space-time tradeoffs for hashing/encryption

---

**Navigation**
- [⬅️ Previous: Data Structures Complexity](./06-data-structures-complexity.md)
- [⬆️ Up to Theory Index](./00-index.md)
- [➡️ Next: Complex Algorithm Analysis](./08-complex-algorithm-analysis.md)