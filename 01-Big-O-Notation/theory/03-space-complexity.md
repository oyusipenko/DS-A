# Space Complexity

**Navigation:** [🏠 Home](../../README.md) > [📚 Big O Notation](../README.md) > [📖 Theory](./00-index.md) > Space Complexity

Space complexity analyses how much additional memory an algorithm needs as the input size grows.

## Examples:

### O(1) Space
Constant space usage regardless of input size.

```javascript
function sum(array) {
  let total = 0;
  for (let i = 0; i < array.length; i++) {
    total += array[i];
  }
  return total;
}
```

### O(n) Space
Space usage grows linearly with input size.

```javascript
function duplicate(array) {
  const result = [];
  for (let i = 0; i < array.length; i++) {
    result.push(array[i]);
  }
  return result;
}
```

## Space Complexity Analysis Process

Space complexity analysis is about measuring how much additional memory an algorithm needs as the input size grows.

### 1. Identify Memory Allocations

Look for:
- **Variable declarations**: Primitives (usually O(1))
- **Data structures**: Arrays, objects, etc. (sizes vary)
- **Call stack usage**: For recursive functions (depth × frame size)

```javascript
function spaceExample(n) {
  const a = 5;                 // O(1)
  const arr = new Array(n);    // O(n)
  return arr;
}
```

### 2. Analyze Growth Pattern

Determine how memory usage scales with input size:

- **Fixed size variables**: O(1) space
- **Arrays/objects proportional to input**: O(n) space
- **2D arrays/matrices**: Often O(n²) space

```javascript
// O(n) space
function createArray(n) {
  const result = [];
  for (let i = 0; i < n; i++) {
    result.push(i * 2);  // Array grows proportionally to n
  }
  return result;
}

// O(n²) space
function createMatrix(n) {
  const matrix = [];
  for (let i = 0; i < n; i++) {
    matrix[i] = [];
    for (let j = 0; j < n; j++) {
      matrix[i][j] = i * j;  // Creates an n×n matrix
    }
  }
  return matrix;
}
```

### 3. Analyze Recursive Memory Usage

For recursive functions, calculate:
- Maximum recursion depth
- Size of each call stack frame

```javascript
// O(n) space due to call stack
function recursiveSum(n) {
  if (n <= 0) return 0;
  return n + recursiveSum(n - 1);  // Creates call stack of depth n
}

// O(n) space with memoization
function fibMemo(n, memo = {}) {
  if (n <= 1) return n;
  if (memo[n]) return memo[n];

  memo[n] = fibMemo(n-1, memo) + fibMemo(n-2, memo);  // Memo object stores up to n values
  return memo[n];
}
```

### 4. Consider Temporary Space

Don't forget temporary allocations:
- Intermediate results
- Temporary variables in loops
- Memory used during sorting/processing

```javascript
function sortAndProcess(array) {
  // Makes a copy for sorting: O(n) space
  const sortedArray = [...array].sort((a, b) => a - b);

  const result = [];
  for (let i = 0; i < sortedArray.length; i++) {
    // Building new result array: O(n) space
    result.push(sortedArray[i] * 2);
  }

  return result;  // Total: O(n) space
}
```

### 5. Apply Simplification Rules

Use the same rules as for time complexity:
- Drop constants
- Keep the highest-order term
- Focus on how space usage scales with input size

---

**Navigation**
- [⬅️ Previous: Complexity Classes](./02-complexity-classes.md)
- [⬆️ Up to Theory Index](./00-index.md)
- [➡️ Next: Analysis Techniques](./04-analysis-techniques.md)