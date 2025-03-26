# Algorithm Analysis Techniques

**Navigation:** [🏠 Home](../../README.md) > [📚 Big O Notation](../README.md) > [📖 Theory](./00-index.md) > Analysis Techniques

## Analyzing Algorithms

### Steps to Determine Big O:

1. Break down the algorithm into basic operations
2. Identify loops and recursive calls
3. Calculate how operations scale with input size
4. Apply simplification rules
5. Consider best, average, and worst cases

### Example Analysis:

```javascript
function findDuplicates(array) {
  const duplicates = [];                   // O(1) space
  const seen = {};                         // O(n) space in worst case

  for (let i = 0; i < array.length; i++) { // O(n) time
    const current = array[i];
    if (seen[current]) {                   // O(1) lookup
      duplicates.push(current);            // O(1) operation
    } else {
      seen[current] = true;                // O(1) operation
    }
  }

  return duplicates;                       // O(1) operation
}
```

**Time Complexity Analysis:**
- One loop iterating through each array element: O(n)
- All operations inside the loop are O(1)
- Total: O(n)

**Space Complexity Analysis:**
- `duplicates` array could contain all elements in worst case: O(n)
- `seen` object could store all elements: O(n)
- Total: O(n)

## Time Complexity Analysis Process

### 1. Identify the Basic Operations

First, break down your algorithm into its fundamental operations:

- **Variable assignments**: `x = 5` (usually O(1))
- **Arithmetic operations**: `a + b`, `c * d` (usually O(1))
- **Comparisons**: `a > b`, `x == y` (usually O(1))
- **Array/object access**: `arr[i]`, `obj.property` (usually O(1))
- **Function calls**: Depends on the function being called

```javascript
function example(n) {
  let sum = 0;           // Assignment: O(1)
  for (let i = 0; i < n; i++) {
    sum += i * 2;        // Arithmetic operations: O(1)
  }
  return sum;            // Return: O(1)
}
```

### 2. Identify Control Flow Structures

Look for loops, conditionals, and recursive calls that determine how many times operations are executed:

- **Simple statements**: Execute once (O(1))
- **Loops**: Execute their body n times (often O(n))
- **Nested loops**: Multiply the iterations of each loop (often O(n²))
- **Recursive calls**: Analyze the recurrence relation (varies)

### 3. Count Iterations

For each control structure, determine how many times its body executes:

- **For loop from 0 to n-1**: n iterations
- **While loop that divides by 2 each time**: log(n) iterations
- **Recursive function with two recursive calls**: Often 2^n complexity

### 4. Combine Complexities

Sum up or multiply complexities based on whether operations are sequential or nested:

- **Sequential operations**: Add their complexities
- **Nested operations**: Multiply their complexities

### 5. Apply Simplification Rules

Finally, simplify using these rules:

- **Drop constants**: O(2n) → O(n)
- **Drop lower-order terms**: O(n² + n) → O(n²)
- **Keep only the highest-order term**: O(n³ + n² + n) → O(n³)

### 6. Analyze Different Cases

Consider the best, average, and worst-case scenarios:

- **Best case**: Minimum time required (Big Ω notation)
- **Average case**: Expected time for random input (Big Θ notation)
- **Worst case**: Maximum possible time (Big O notation)

## Common Pitfalls

### Hidden Loops
```javascript
function countUniqueValues(array) {
  return new Set(array).size; // Hidden O(n) operation to create the Set
}
```

### String Operations
```javascript
function concatenateRepeatedly(str, times) {
  let result = "";
  for (let i = 0; i < times; i++) {
    result += str; // String concatenation is O(n) operation in many languages
  }
  return result;
}
// Total time: O(n²) due to string concatenation
```

### Array Methods
```javascript
array.filter(x => x > 5).map(x => x * 2); // Two O(n) operations = O(2n) = O(n)

array.indexOf("needle"); // O(n) operation
```

## Analyzing Recursive Algorithms

For recursive algorithms, we often use the **Master Theorem** or **Recurrence Relations**.

A common pattern is:
```
T(n) = aT(n/b) + f(n)
```

Where:
- T(n) is the time complexity function
- a is the number of recursive calls
- n/b is the input size reduction factor
- f(n) is the work done outside the recursive calls

## Big O vs. Big Ω (Omega) vs. Big Θ (Theta)

- **Big O**: Upper bound (worst-case)
- **Big Ω**: Lower bound (best-case)
- **Big Θ**: Tight bound (average-case)

In practice, we usually focus on Big O to prepare for the worst-case scenario.

## Amortized Analysis

Some operations have different costs depending on how often they're performed. Amortized analysis considers the average cost over time.

Example: JavaScript array's `push()` method is usually O(1), but occasionally O(n) when the array needs to be resized.

## Additional Examples

### Example 1: Analyze a Two-Pointer Algorithm

```javascript
function isPalindrome(str) {
  let left = 0;
  let right = str.length - 1;

  while (left < right) {
    if (str[left] !== str[right]) {
      return false;
    }
    left++;
    right--;
  }

  return true;
}
```

**Analysis Process**:
1. This function uses two pointers that move toward each other
2. The loop runs at most n/2 times (where n is string length)
3. Each iteration does constant time operations (comparisons and increments)
4. No additional data structures are created based on input size

**Time Complexity**: O(n) - We examine at most half the characters, but drop the constant
**Space Complexity**: O(1) - We only use two pointer variables regardless of input size

### Example 2: Analyze Nested Loops with Different Bounds

```javascript
function sumTriangular(n) {
  let sum = 0;

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < i; j++) {
      sum += i * j;
    }
  }

  return sum;
}
```

**Analysis Process**:
1. The outer loop runs n times
2. The inner loop runs i times for each iteration of the outer loop
3. Total number of iterations: 0 + 1 + 2 + ... + (n-1) = n(n-1)/2

**Time Complexity**: O(n²) - The sum of the first n-1 integers is n(n-1)/2, which simplifies to O(n²)
**Space Complexity**: O(1) - We only use a sum variable and loop counters

### Example 3: Analyze a Divide and Conquer Algorithm

```javascript
function findMax(arr, start = 0, end = arr.length - 1) {
  // Base case
  if (start === end) {
    return arr[start];
  }

  // Divide
  const mid = Math.floor((start + end) / 2);

  // Conquer
  const leftMax = findMax(arr, start, mid);
  const rightMax = findMax(arr, mid + 1, end);

  // Combine
  return Math.max(leftMax, rightMax);
}
```

**Analysis Process**:
1. The algorithm divides the array in half each time
2. It makes two recursive calls on halves of the array
3. The recurrence relation is T(n) = 2T(n/2) + O(1)
4. Using the Master Theorem, this gives us O(n)

**Time Complexity**: O(n) - While there are 2ⁿ leaf nodes in the recursion tree, the total work at each level is proportional to n
**Space Complexity**: O(log n) - Maximum recursion depth for the call stack

### Example 4: Analyzing a Hash Table Construction

```javascript
function countFrequency(array) {
  const frequency = {};

  // Build frequency counter
  for (const item of array) {
    frequency[item] = (frequency[item] || 0) + 1;
  }

  // Find the most frequent item
  let maxItem = null;
  let maxCount = 0;

  for (const item in frequency) {
    if (frequency[item] > maxCount) {
      maxCount = frequency[item];
      maxItem = item;
    }
  }

  return { item: maxItem, count: maxCount };
}
```

**Analysis Process**:
1. First loop iterates through the array once (n iterations)
2. Second loop iterates through unique keys in the frequency object (at most n iterations)
3. All operations inside the loops are O(1)

**Time Complexity**: O(n) - Two sequential loops, each O(n)
**Space Complexity**: O(n) - The frequency object could contain up to n keys in the worst case

### Example 5: Analyzing Algorithms with Multiple Data Structures

```javascript
function findIntersection(arr1, arr2) {
  const set = new Set(arr1);  // O(n) time and space
  const result = [];

  for (const item of arr2) {  // O(m) time
    if (set.has(item)) {      // O(1) time
      result.push(item);      // O(1) time
    }
  }

  return result;
}
```

**Analysis Process**:
1. Creating the Set from arr1 takes O(n) time and space
2. The loop iterates through arr2, which has m elements
3. Set lookups are O(1) operations
4. The result array could contain at most min(n, m) elements

**Time Complexity**: O(n + m) - Where n and m are the lengths of the input arrays
**Space Complexity**: O(n + min(n, m)) - For the set and result array, which simplifies to O(n)

### Example 6: Analyzing an Event Loop Callback

```javascript
function processDataInChunks(data, chunkSize) {
  let index = 0;

  function processNextChunk() {
    const chunk = data.slice(index, index + chunkSize);

    // Process current chunk
    for (const item of chunk) {
      console.log(item);
    }

    index += chunkSize;

    // Schedule next chunk if needed
    if (index < data.length) {
      setTimeout(processNextChunk, 0);
    }
  }

  processNextChunk();
}
```

**Analysis Process**:
1. The function processes data in chunks of size chunkSize
2. Each chunk processing is O(chunkSize) work
3. Total number of chunks is ceil(n/chunkSize) where n is data length
4. The slice operation is O(chunkSize) for each chunk

**Time Complexity**: O(n) - Total work across all chunks
**Space Complexity**: O(chunkSize) - For each chunk created by slice
**Temporal Complexity**: O(n/chunkSize) - Event loop cycles required

### Example 7: Analyzing a React Component Rendering Pattern

```javascript
function RenderList({ items }) {
  // Derive computed values
  const processedItems = items.map(item => ({
    ...item,
    displayName: `${item.firstName} ${item.lastName}`,
    isActive: item.status === 'active'
  }));

  // Filter items
  const activeItems = processedItems.filter(item => item.isActive);

  // Sort items
  const sortedItems = [...activeItems].sort((a, b) =>
    a.displayName.localeCompare(b.displayName)
  );

  return (
    <ul>
      {sortedItems.map(item => (
        <li key={item.id}>{item.displayName}</li>
      ))}
    </ul>
  );
}
```

**Analysis Process**:
1. First map operation is O(n) time
2. Filter operation is O(n) time
3. Sort operation is O(k log k) time where k is the number of active items
4. Final map for rendering is O(k) time
5. Creating new arrays requires O(n) space for the initial map, O(k) for filtered items, and O(k) for the sorted array

**Time Complexity**: O(n + k log k) - Dominated by the sorting operation when k is large
**Space Complexity**: O(n) - For all the derived arrays
**Rendering Complexity**: O(k) - DOM nodes created

This component could be optimized by using memoization (React.useMemo) to prevent recalculations on every render.
```

---

**Navigation**
- [⬅️ Previous: Space Complexity](./03-space-complexity.md)
- [⬆️ Up to Theory Index](./00-index.md)
- [➡️ Next: Practical Examples](./05-practical-examples.md)