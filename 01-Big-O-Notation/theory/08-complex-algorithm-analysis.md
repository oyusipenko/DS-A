# Complex Algorithm Analysis

**Navigation:** [🏠 Home](../../README.md) > [📚 Big O Notation](../README.md) > [📖 Theory](./00-index.md) > Complex Algorithm Analysis

This document provides in-depth analysis of sophisticated algorithms that frequently appear in technical interviews, with a focus on their Big O complexity and implementation considerations.

## Dynamic Programming

### 1. Fibonacci with Memoization

```javascript
function fibonacci(n, memo = {}) {
  if (n <= 1) return n;
  if (memo[n]) return memo[n];

  memo[n] = fibonacci(n-1, memo) + fibonacci(n-2, memo);
  return memo[n];
}
```

**Time Complexity**: O(n)
**Space Complexity**: O(n)

**Analysis**:
- Without memoization, the time complexity would be O(2^n) due to the exponential branching of recursive calls.
- With memoization, each value is calculated exactly once, resulting in O(n) time complexity.
- The recursive call stack and the memo object both require O(n) space.
- This is a classic example of trading space for time.

### 2. Knapsack Problem

```javascript
function knapsack(weights, values, capacity) {
  const n = weights.length;
  const dp = Array(n + 1).fill().map(() => Array(capacity + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let w = 0; w <= capacity; w++) {
      if (weights[i-1] <= w) {
        dp[i][w] = Math.max(
          values[i-1] + dp[i-1][w-weights[i-1]],
          dp[i-1][w]
        );
      } else {
        dp[i][w] = dp[i-1][w];
      }
    }
  }

  return dp[n][capacity];
}
```

**Time Complexity**: O(n * W) where n is the number of items and W is the capacity
**Space Complexity**: O(n * W)

**Analysis**:
- Each cell in the dp table is computed once, resulting in n * (W+1) operations.
- The solution uses bottom-up dynamic programming to avoid the overhead of recursion.
- This is pseudo-polynomial time, as the complexity depends on the numeric value of W.
- For large capacities, this can be prohibitively expensive.

### 3. Longest Common Subsequence

```javascript
function longestCommonSubsequence(text1, text2) {
  const m = text1.length;
  const n = text2.length;
  const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (text1[i-1] === text2[j-1]) {
        dp[i][j] = 1 + dp[i-1][j-1];
      } else {
        dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]);
      }
    }
  }

  return dp[m][n];
}
```

**Time Complexity**: O(m * n) where m and n are the lengths of the input strings
**Space Complexity**: O(m * n)

**Analysis**:
- The algorithm builds a table of size (m+1) x (n+1), with each cell computation taking O(1) time.
- The nested loops iterate through all possible combinations of characters.
- Space complexity can be optimized to O(min(m, n)) by only keeping track of the current and previous rows.
- This is a foundational dynamic programming problem that appears in many variations.

## Graph Algorithms

### 1. Depth-First Search (DFS)

```javascript
function dfs(graph, start) {
  const visited = new Set();
  const result = [];

  function traverse(vertex) {
    visited.add(vertex);
    result.push(vertex);

    for (const neighbor of graph[vertex]) {
      if (!visited.has(neighbor)) {
        traverse(neighbor);
      }
    }
  }

  traverse(start);
  return result;
}
```

**Time Complexity**: O(V + E) where V is the number of vertices and E is the number of edges
**Space Complexity**: O(V)

**Analysis**:
- Each vertex is visited exactly once, and each edge is considered exactly once.
- The space complexity is dominated by the recursive call stack and the visited set.
- In the worst case (a complete graph), the recursive call stack could reach a depth of O(V).
- DFS can be used to detect cycles, find connected components, and solve many graph-related problems.

### 2. Breadth-First Search (BFS)

```javascript
function bfs(graph, start) {
  const visited = new Set([start]);
  const queue = [start];
  const result = [];

  while (queue.length > 0) {
    const vertex = queue.shift();
    result.push(vertex);

    for (const neighbor of graph[vertex]) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  return result;
}
```

**Time Complexity**: O(V + E)
**Space Complexity**: O(V)

**Analysis**:
- Similar to DFS, each vertex and edge is processed once.
- The space complexity is dominated by the queue and visited set.
- BFS finds the shortest path in an unweighted graph.
- It's often preferred for level-by-level traversal or finding the shortest path.

### 3. Dijkstra's Algorithm

```javascript
function dijkstra(graph, start) {
  const distances = {};
  const priorityQueue = new MinHeap();
  const previous = {};

  // Initialize distances
  for (const vertex in graph) {
    distances[vertex] = Infinity;
    previous[vertex] = null;
  }
  distances[start] = 0;

  priorityQueue.add(start, 0);

  while (!priorityQueue.isEmpty()) {
    const { value: current, priority: currentDistance } = priorityQueue.extractMin();

    if (currentDistance > distances[current]) continue;

    for (const [neighbor, weight] of graph[current]) {
      const distance = distances[current] + weight;

      if (distance < distances[neighbor]) {
        distances[neighbor] = distance;
        previous[neighbor] = current;
        priorityQueue.add(neighbor, distance);
      }
    }
  }

  return { distances, previous };
}
```

**Time Complexity**: O((V + E) log V) with a binary heap implementation
**Space Complexity**: O(V)

**Analysis**:
- The time complexity is dominated by the operations on the priority queue.
- Each vertex is extracted from the queue once (O(V log V)) and each edge is processed once (O(E log V)).
- Dijkstra's algorithm finds the shortest paths from a start vertex to all other vertices in a weighted graph with non-negative weights.
- It cannot handle negative edge weights (for that, use Bellman-Ford).

## Tree Algorithms

### 1. Binary Tree Traversals

```javascript
// Inorder traversal
function inorderTraversal(root) {
  const result = [];

  function traverse(node) {
    if (!node) return;
    traverse(node.left);
    result.push(node.val);
    traverse(node.right);
  }

  traverse(root);
  return result;
}

// Preorder traversal
function preorderTraversal(root) {
  const result = [];

  function traverse(node) {
    if (!node) return;
    result.push(node.val);
    traverse(node.left);
    traverse(node.right);
  }

  traverse(root);
  return result;
}

// Postorder traversal
function postorderTraversal(root) {
  const result = [];

  function traverse(node) {
    if (!node) return;
    traverse(node.left);
    traverse(node.right);
    result.push(node.val);
  }

  traverse(root);
  return result;
}
```

**Time Complexity**: O(n) where n is the number of nodes
**Space Complexity**: O(h) where h is the height of the tree (worst case O(n))

**Analysis**:
- Each node is visited exactly once, resulting in O(n) time complexity.
- The space complexity is determined by the maximum depth of the recursive call stack.
- In a balanced tree, the height is log n, making the space complexity O(log n).
- In a skewed tree (worst case), the height is n, making the space complexity O(n).
- Different traversal orders are useful for different problems and highlight the versatility of recursive approaches.

### 2. Binary Search Tree Operations

```javascript
class TreeNode {
  constructor(val) {
    this.val = val;
    this.left = null;
    this.right = null;
  }
}

// Insert into BST
function insert(root, val) {
  if (!root) return new TreeNode(val);

  if (val < root.val) {
    root.left = insert(root.left, val);
  } else if (val > root.val) {
    root.right = insert(root.right, val);
  }

  return root;
}

// Search in BST
function search(root, val) {
  if (!root) return null;

  if (root.val === val) {
    return root;
  } else if (val < root.val) {
    return search(root.left, val);
  } else {
    return search(root.right, val);
  }
}

// Delete from BST
function deleteNode(root, key) {
  if (!root) return null;

  if (key < root.val) {
    root.left = deleteNode(root.left, key);
  } else if (key > root.val) {
    root.right = deleteNode(root.right, key);
  } else {
    // Node with only one child or no child
    if (!root.left) return root.right;
    if (!root.right) return root.left;

    // Node with two children: Find inorder successor
    root.val = findMin(root.right);
    root.right = deleteNode(root.right, root.val);
  }

  return root;
}

function findMin(node) {
  let current = node;
  while (current.left) {
    current = current.left;
  }
  return current.val;
}
```

**Time Complexity**:
- Average case (balanced tree): O(log n) for all operations
- Worst case (skewed tree): O(n) for all operations

**Space Complexity**: O(h) where h is the height of the tree

**Analysis**:
- BST operations follow a path from the root to a target node, taking time proportional to the height of the tree.
- The efficiency of BST operations depends critically on the tree's balance.
- Deletion is the most complex operation, especially when removing a node with two children.
- Many interview questions involve BST properties and operations.

### 3. Balanced Binary Search Trees (AVL)

```javascript
class AVLNode {
  constructor(val) {
    this.val = val;
    this.left = null;
    this.right = null;
    this.height = 1;
  }
}

function getHeight(node) {
  return node ? node.height : 0;
}

function getBalanceFactor(node) {
  return node ? getHeight(node.left) - getHeight(node.right) : 0;
}

function updateHeight(node) {
  node.height = Math.max(getHeight(node.left), getHeight(node.right)) + 1;
}

function rightRotate(y) {
  const x = y.left;
  const T2 = x.right;

  // Rotation
  x.right = y;
  y.left = T2;

  // Update heights
  updateHeight(y);
  updateHeight(x);

  return x;
}

function leftRotate(x) {
  const y = x.right;
  const T2 = y.left;

  // Rotation
  y.left = x;
  x.right = T2;

  // Update heights
  updateHeight(x);
  updateHeight(y);

  return y;
}

function insertAVL(node, val) {
  // Standard BST insert
  if (!node) return new AVLNode(val);

  if (val < node.val) {
    node.left = insertAVL(node.left, val);
  } else if (val > node.val) {
    node.right = insertAVL(node.right, val);
  } else {
    // Duplicate value - do nothing
    return node;
  }

  // Update height
  updateHeight(node);

  // Get balance factor
  const balance = getBalanceFactor(node);

  // Left Left Case
  if (balance > 1 && val < node.left.val) {
    return rightRotate(node);
  }

  // Right Right Case
  if (balance < -1 && val > node.right.val) {
    return leftRotate(node);
  }

  // Left Right Case
  if (balance > 1 && val > node.left.val) {
    node.left = leftRotate(node.left);
    return rightRotate(node);
  }

  // Right Left Case
  if (balance < -1 && val < node.right.val) {
    node.right = rightRotate(node.right);
    return leftRotate(node);
  }

  return node;
}
```

**Time Complexity**: O(log n) for all operations (guaranteed)
**Space Complexity**: O(log n) for the recursive call stack

**Analysis**:
- AVL trees maintain balance by ensuring that the height difference between left and right subtrees is at most 1.
- The rebalancing is done through single or double rotations.
- The height of an AVL tree is always O(log n), ensuring logarithmic time complexity for all operations.
- The space overhead for maintaining height information is constant per node.
- AVL trees are preferable when reads are more frequent than writes.

## String Algorithms

### 1. Knuth-Morris-Pratt (KMP) Algorithm

```javascript
function computeLPS(pattern) {
  const lps = [0];
  let len = 0;
  let i = 1;

  while (i < pattern.length) {
    if (pattern[i] === pattern[len]) {
      len++;
      lps[i] = len;
      i++;
    } else {
      if (len !== 0) {
        len = lps[len - 1];
      } else {
        lps[i] = 0;
        i++;
      }
    }
  }

  return lps;
}

function kmpSearch(text, pattern) {
  if (pattern.length === 0) return 0;

  const lps = computeLPS(pattern);
  const results = [];

  let i = 0; // text index
  let j = 0; // pattern index

  while (i < text.length) {
    if (pattern[j] === text[i]) {
      i++;
      j++;
    }

    if (j === pattern.length) {
      results.push(i - j);
      j = lps[j - 1];
    } else if (i < text.length && pattern[j] !== text[i]) {
      if (j !== 0) {
        j = lps[j - 1];
      } else {
        i++;
      }
    }
  }

  return results;
}
```

**Time Complexity**: O(n + m) where n is the text length and m is the pattern length
**Space Complexity**: O(m)

**Analysis**:
- KMP avoids rechecking characters that are known to match, making it more efficient than naive string matching.
- The preprocessing step computes the "longest proper prefix which is also suffix" (LPS) array.
- The algorithm never moves the pointer for the main text backwards, ensuring linear time complexity.
- KMP is particularly efficient when the pattern contains repeating subpatterns.

### 2. Trie (Prefix Tree)

```javascript
class TrieNode {
  constructor() {
    this.children = {};
    this.isEndOfWord = false;
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  insert(word) {
    let current = this.root;

    for (const char of word) {
      if (!current.children[char]) {
        current.children[char] = new TrieNode();
      }
      current = current.children[char];
    }

    current.isEndOfWord = true;
  }

  search(word) {
    let current = this.root;

    for (const char of word) {
      if (!current.children[char]) {
        return false;
      }
      current = current.children[char];
    }

    return current.isEndOfWord;
  }

  startsWith(prefix) {
    let current = this.root;

    for (const char of prefix) {
      if (!current.children[char]) {
        return false;
      }
      current = current.children[char];
    }

    return true;
  }
}
```

**Time Complexity**:
- Insert: O(m) where m is the length of the word
- Search: O(m)
- StartsWith: O(m)

**Space Complexity**: O(n * m) where n is the number of words and m is the average word length

**Analysis**:
- Tries excel at prefix-based operations and are commonly used for autocomplete features.
- Each node can have up to 26 children (for lowercase English letters), making space usage a concern.
- Tries provide fast lookups but require more memory than some alternatives.
- Compressed tries (like radix trees) can reduce the space overhead.

## Sorting Algorithms

### 1. QuickSort

```javascript
function quickSort(arr, low = 0, high = arr.length - 1) {
  if (low < high) {
    const pivotIndex = partition(arr, low, high);
    quickSort(arr, low, pivotIndex - 1);
    quickSort(arr, pivotIndex + 1, high);
  }

  return arr;
}

function partition(arr, low, high) {
  const pivot = arr[high];
  let i = low - 1;

  for (let j = low; j < high; j++) {
    if (arr[j] <= pivot) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
  return i + 1;
}
```

**Time Complexity**:
- Average case: O(n log n)
- Worst case: O(n²) (when the array is already sorted or nearly sorted)

**Space Complexity**: O(log n) for the recursive call stack

**Analysis**:
- QuickSort's performance depends heavily on the pivot selection strategy.
- The worst-case scenario occurs when the smallest or largest element is consistently chosen as the pivot.
- Randomized pivot selection can mitigate the worst-case scenario.
- QuickSort is often faster in practice than other O(n log n) sorting algorithms due to its cache efficiency.

### 2. MergeSort

```javascript
function mergeSort(arr) {
  if (arr.length <= 1) return arr;

  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));

  return merge(left, right);
}

function merge(left, right) {
  const result = [];
  let i = 0, j = 0;

  while (i < left.length && j < right.length) {
    if (left[i] < right[j]) {
      result.push(left[i]);
      i++;
    } else {
      result.push(right[j]);
      j++;
    }
  }

  return [...result, ...left.slice(i), ...right.slice(j)];
}
```

**Time Complexity**: O(n log n) (in all cases)
**Space Complexity**: O(n)

**Analysis**:
- MergeSort guarantees O(n log n) time complexity regardless of the input.
- The space complexity is a disadvantage compared to in-place sorting algorithms.
- MergeSort is stable (preserves the relative order of equal elements).
- It's particularly efficient for linked lists, as it doesn't require random access to elements.

### 3. HeapSort

```javascript
function heapSort(arr) {
  const n = arr.length;

  // Build max heap
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    heapify(arr, n, i);
  }

  // Extract elements from the heap
  for (let i = n - 1; i > 0; i--) {
    [arr[0], arr[i]] = [arr[i], arr[0]];
    heapify(arr, i, 0);
  }

  return arr;
}

function heapify(arr, n, i) {
  let largest = i;
  const left = 2 * i + 1;
  const right = 2 * i + 2;

  if (left < n && arr[left] > arr[largest]) {
    largest = left;
  }

  if (right < n && arr[right] > arr[largest]) {
    largest = right;
  }

  if (largest !== i) {
    [arr[i], arr[largest]] = [arr[largest], arr[i]];
    heapify(arr, n, largest);
  }
}
```

**Time Complexity**: O(n log n) (in all cases)
**Space Complexity**: O(1)

**Analysis**:
- HeapSort combines the best features of selection sort and merge sort.
- It sorts in-place (O(1) extra space) while guaranteeing O(n log n) time complexity.
- The algorithm has two phases: building the heap and extracting elements.
- HeapSort is not stable and has poorer cache locality than QuickSort.

## Advanced Data Structures

### 1. Disjoint Set (Union-Find)

```javascript
class DisjointSet {
  constructor(size) {
    this.parent = Array(size).fill().map((_, i) => i);
    this.rank = Array(size).fill(0);
  }

  find(x) {
    if (this.parent[x] !== x) {
      this.parent[x] = this.find(this.parent[x]); // Path compression
    }
    return this.parent[x];
  }

  union(x, y) {
    const rootX = this.find(x);
    const rootY = this.find(y);

    if (rootX === rootY) return;

    // Union by rank
    if (this.rank[rootX] < this.rank[rootY]) {
      this.parent[rootX] = rootY;
    } else if (this.rank[rootX] > this.rank[rootY]) {
      this.parent[rootY] = rootX;
    } else {
      this.parent[rootY] = rootX;
      this.rank[rootX]++;
    }
  }

  isConnected(x, y) {
    return this.find(x) === this.find(y);
  }
}
```

**Time Complexity**:
- Find: O(α(n)) amortized (where α is the inverse Ackermann function, which grows extremely slowly)
- Union: O(α(n)) amortized
- IsConnected: O(α(n)) amortized

**Space Complexity**: O(n)

**Analysis**:
- Union-Find is extremely efficient for grouping elements and determining connectivity.
- The inverse Ackermann function α(n) is less than 5 for any practical value of n, making operations effectively constant time.
- Path compression and union by rank are crucial optimizations that achieve this near-constant time complexity.
- Union-Find is commonly used in Kruskal's algorithm for minimum spanning trees and cycle detection.

### 2. Segment Tree

```javascript
class SegmentTree {
  constructor(arr) {
    this.arr = arr;
    this.n = arr.length;
    // Size of segment tree will be about 4 * n
    this.tree = Array(4 * this.n).fill(0);
    this.build(0, 0, this.n - 1);
  }

  build(node, start, end) {
    if (start === end) {
      this.tree[node] = this.arr[start];
    } else {
      const mid = Math.floor((start + end) / 2);
      this.build(2 * node + 1, start, mid);
      this.build(2 * node + 2, mid + 1, end);
      this.tree[node] = this.tree[2 * node + 1] + this.tree[2 * node + 2];
    }
  }

  update(index, val, node = 0, start = 0, end = this.n - 1) {
    if (start === end) {
      this.arr[index] = val;
      this.tree[node] = val;
    } else {
      const mid = Math.floor((start + end) / 2);
      if (index <= mid) {
        this.update(index, val, 2 * node + 1, start, mid);
      } else {
        this.update(index, val, 2 * node + 2, mid + 1, end);
      }
      this.tree[node] = this.tree[2 * node + 1] + this.tree[2 * node + 2];
    }
  }

  query(left, right, node = 0, start = 0, end = this.n - 1) {
    if (right < start || left > end) {
      return 0;
    }
    if (left <= start && end <= right) {
      return this.tree[node];
    }

    const mid = Math.floor((start + end) / 2);
    const leftSum = this.query(left, right, 2 * node + 1, start, mid);
    const rightSum = this.query(left, right, 2 * node + 2, mid + 1, end);
    return leftSum + rightSum;
  }
}
```

**Time Complexity**:
- Build: O(n)
- Update: O(log n)
- Query: O(log n)

**Space Complexity**: O(n)

**Analysis**:
- Segment Trees efficiently support range queries and point updates.
- They can be adapted for various types of range queries (sum, min, max, etc.).
- The structure allows for O(log n) operations on ranges, which is much faster than O(n) naive approaches.
- Segment Trees are particularly useful for problems involving many range queries, such as finding the sum of elements in a range.

## Comparison and Selection Guide

When choosing between algorithms during an interview, consider these factors:

1. **Problem Constraints**:
   - Input size limitations
   - Time complexity requirements
   - Space complexity constraints
   - Need for stability in sorting

2. **Data Characteristics**:
   - Is the data sorted or nearly sorted?
   - Are there many duplicates?
   - Is the data distributed randomly or in a pattern?

3. **Operation Frequency**:
   - Are reads more common than writes?
   - Are range queries needed?
   - Will the structure need frequent updates?

### Time and Space Complexity Comparison

| Algorithm | Time Complexity (Average) | Time Complexity (Worst) | Space Complexity |
|:----------|:--------------------------|:------------------------|:-----------------|
| **Sorting** |
| QuickSort | O(n log n) | O(n²) | O(log n) |
| MergeSort | O(n log n) | O(n log n) | O(n) |
| HeapSort | O(n log n) | O(n log n) | O(1) |
| **Graph** |
| DFS | O(V + E) | O(V + E) | O(V) |
| BFS | O(V + E) | O(V + E) | O(V) |
| Dijkstra's | O((V + E) log V) | O((V + E) log V) | O(V) |
| **Dynamic Programming** |
| Fibonacci (memoized) | O(n) | O(n) | O(n) |
| Knapsack | O(n * W) | O(n * W) | O(n * W) |
| LCS | O(m * n) | O(m * n) | O(m * n) |
| **Tree** |
| BST Operations (balanced) | O(log n) | O(n) | O(h) |
| AVL Tree Operations | O(log n) | O(log n) | O(log n) |
| **String** |
| KMP | O(n + m) | O(n + m) | O(m) |
| Trie Operations | O(m) | O(m) | O(n * m) |
| **Advanced** |
| Union-Find | O(α(n)) | O(α(n)) | O(n) |
| Segment Tree | O(log n) | O(log n) | O(n) |

## Interview Insights

When discussing complex algorithms in interviews:

1. **Start with the naive approach** before jumping to the optimized solution. This shows your problem-solving process.

2. **Explain your reasoning** for choosing a particular algorithm. Mention the trade-offs involved.

3. **Consider edge cases** like empty inputs, single elements, or very large inputs.

4. **Be prepared to optimize further** if asked. Think about constant factor improvements even within the same Big O complexity.

5. **Relate to real-world applications** where these algorithms might be used.

6. **Discuss implementation challenges** such as potential stack overflow in recursive implementations.

7. **Be honest about limitations** in your knowledge. It's better to acknowledge when you're unsure than to guess incorrectly.

Remember that interviewers are often more interested in your problem-solving approach and understanding of algorithmic principles than in your ability to recite algorithms from memory.

---

**Navigation**
- [⬅️ Previous: Algorithm Selection Guide](./07-algorithm-selection-guide.md)
- [⬆️ Up to Theory Index](./00-index.md)
- [➡️ Next: Practice Resources](../practice/README.md)