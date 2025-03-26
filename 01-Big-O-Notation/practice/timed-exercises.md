# Big O Notation: Timed Exercises

**Navigation:** [🏠 Home](../../README.md) > [📚 Big O Notation](../README.md) > [🏋️ Practice](./README.md) > Timed Exercises

This document contains timed exercises designed to help you practice analyzing algorithms under interview-like conditions. Set a timer for each exercise according to the recommended time to simulate real interview pressure.

## How to Use These Exercises

1. Set a timer for the recommended duration
2. Try to determine the time and space complexity before the timer expires
3. Write down your analysis and reasoning
4. Check your answer against the provided solution
5. Review your approach regardless of whether you got it right

## Quick-Analysis Exercises (2-3 minutes each)

### Exercise 1: Simple Loop

```javascript
function sumArray(arr) {
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i];
  }
  return sum;
}
```

**Time Limit: 2 minutes**

<details>
<summary>Solution</summary>

**Time Complexity: O(n)**
- Single loop iterating through each element once
- Number of operations scales linearly with array size

**Space Complexity: O(1)**
- Only uses a fixed amount of extra space regardless of input size
</details>

## Quick Analysis Exercises (2-3 minutes each)

For each of the following code snippets, determine the time and space complexity. Aim to solve each within 2-3 minutes.

### Exercise 1
```javascript
function mystery1(array) {
  let sum = 0;
  for (let i = 0; i < array.length; i++) {
    sum += array[i];
  }
  return sum;
}
```

### Exercise 2
```javascript
function mystery2(array) {
  let result = [];
  for (let i = 0; i < array.length; i++) {
    for (let j = 0; j < array.length; j++) {
      if (i !== j && array[i] === array[j]) {
        result.push(array[i]);
        break;
      }
    }
  }
  return [...new Set(result)];
}
```

### Exercise 3
```javascript
function mystery3(n) {
  if (n <= 1) return n;
  return mystery3(n-1) + mystery3(n-2);
}
```

### Exercise 4
```javascript
function mystery4(array) {
  if (array.length <= 1) return array;

  const pivot = array[0];
  const left = array.slice(1).filter(x => x < pivot);
  const right = array.slice(1).filter(x => x >= pivot);

  return [...mystery4(left), pivot, ...mystery4(right)];
}
```

### Exercise 5
```javascript
function mystery5(array, target) {
  let left = 0;
  let right = array.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (array[mid] === target) return mid;
    if (array[mid] < target) left = mid + 1;
    else right = mid - 1;
  }

  return -1;
}
```

## Medium-Difficulty Exercises (5 minutes each)

For the following exercises, determine the time and space complexity and explain your reasoning. Aim to complete each within 5 minutes.

### Exercise 6
```javascript
function mystery6(strings) {
  const result = {};

  for (const str of strings) {
    const sorted = str.split('').sort().join('');
    if (!result[sorted]) {
      result[sorted] = [];
    }
    result[sorted].push(str);
  }

  return Object.values(result);
}
```

### Exercise 7
```javascript
function mystery7(matrix) {
  const n = matrix.length;
  const result = Array(n).fill().map(() => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      for (let k = 0; k < n; k++) {
        result[i][j] += matrix[i][k] * matrix[k][j];
      }
    }
  }

  return result;
}
```

### Exercise 8
```javascript
function mystery8(array) {
  if (array.length <= 1) return array;

  const mid = Math.floor(array.length / 2);
  const left = mystery8(array.slice(0, mid));
  const right = mystery8(array.slice(mid));

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

### Exercise 9
```javascript
function mystery9(array) {
  const seen = new Set();
  let max = 0;

  for (let i = 0; i < array.length; i++) {
    let j = i;
    let count = 0;
    let num = array[j];

    while (!seen.has(num) && j < array.length) {
      seen.add(num);
      count++;
      j++;
      num = array[j];
    }

    max = Math.max(max, count);
  }

  return max;
}
```

### Exercise 10
```javascript
function mystery10(n) {
  const memo = {};

  function helper(remaining, last) {
    const key = `${remaining}-${last}`;
    if (memo[key]) return memo[key];

    if (remaining === 0) return 1;
    if (remaining < 0) return 0;

    let ways = 0;
    for (let i = 1; i <= last; i++) {
      ways += helper(remaining - i, i);
    }

    memo[key] = ways;
    return ways;
  }

  return helper(n, n);
}
```

## Complex Analysis Exercises (10 minutes each)

These exercises require deeper analysis. Take up to 10 minutes for each.

### Exercise 11
Analyze both time and space complexity of this algorithm for finding all subsets of an array:

```javascript
function findAllSubsets(nums) {
  const results = [[]];

  for (const num of nums) {
    const newSubsets = [];
    for (const subset of results) {
      newSubsets.push([...subset, num]);
    }
    results.push(...newSubsets);
  }

  return results;
}
```

### Exercise 12
This function finds the longest increasing subsequence in an array. Analyze its time and space complexity:

```javascript
function longestIncreasingSubsequence(nums) {
  if (nums.length === 0) return 0;

  const dp = Array(nums.length).fill(1);

  for (let i = 1; i < nums.length; i++) {
    for (let j = 0; j < i; j++) {
      if (nums[i] > nums[j]) {
        dp[i] = Math.max(dp[i], dp[j] + 1);
      }
    }
  }

  return Math.max(...dp);
}
```

### Exercise 13
Analyze the following code that implements the Floyd-Warshall algorithm for finding shortest paths in a weighted graph:

```javascript
function floydWarshall(graph) {
  const dist = [...graph.map(row => [...row])];
  const V = graph.length;

  for (let k = 0; k < V; k++) {
    for (let i = 0; i < V; i++) {
      for (let j = 0; j < V; j++) {
        if (dist[i][k] + dist[k][j] < dist[i][j]) {
          dist[i][j] = dist[i][k] + dist[k][j];
        }
      }
    }
  }

  return dist;
}
```

### Exercise 14
This function checks if a string matches a pattern with wildcards. Analyze its complexity:

```javascript
function isMatch(s, p) {
  const dp = Array(s.length + 1).fill().map(() => Array(p.length + 1).fill(false));
  dp[0][0] = true;

  for (let j = 1; j <= p.length; j++) {
    if (p[j-1] === '*') {
      dp[0][j] = dp[0][j-1];
    }
  }

  for (let i = 1; i <= s.length; i++) {
    for (let j = 1; j <= p.length; j++) {
      if (p[j-1] === '*') {
        dp[i][j] = dp[i][j-1] || dp[i-1][j];
      } else if (p[j-1] === '?' || p[j-1] === s[i-1]) {
        dp[i][j] = dp[i-1][j-1];
      }
    }
  }

  return dp[s.length][p.length];
}
```

### Exercise 15
Analyze this function that solves the "Word Break" problem using dynamic programming:

```javascript
function wordBreak(s, wordDict) {
  const wordSet = new Set(wordDict);
  const dp = Array(s.length + 1).fill(false);
  dp[0] = true;

  for (let i = 1; i <= s.length; i++) {
    for (let j = 0; j < i; j++) {
      if (dp[j] && wordSet.has(s.substring(j, i))) {
        dp[i] = true;
        break;
      }
    }
  }

  return dp[s.length];
}
```

## Real-World Scenario Exercises (10-15 minutes each)

For these exercises, analyze the overall time and space complexity and suggest optimizations. Take 10-15 minutes for each.

### Exercise 16: API Request Processing

```javascript
function processApiRequest(users, filters, sort, pagination) {
  // Step 1: Filter users
  let filteredUsers = users;
  for (const [field, value] of Object.entries(filters)) {
    filteredUsers = filteredUsers.filter(user => user[field] === value);
  }

  // Step 2: Sort results
  filteredUsers.sort((a, b) => {
    if (a[sort.field] < b[sort.field]) return sort.asc ? -1 : 1;
    if (a[sort.field] > b[sort.field]) return sort.asc ? 1 : -1;
    return 0;
  });

  // Step 3: Paginate
  const { page, limit } = pagination;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Step 4: Calculate total pages
  const totalPages = Math.ceil(filteredUsers.length / limit);

  return {
    data: paginatedUsers,
    pagination: {
      total: filteredUsers.length,
      totalPages,
      currentPage: page
    }
  };
}
```

### Exercise 17: Rendering a Tree View Component

```jsx
function renderTreeView(data) {
  // Helper function to create DOM elements for the tree
  function createTreeNodes(items, depth = 0) {
    // Create DOM elements for each item
    const elements = [];

    for (const item of items) {
      // Create item element
      const itemElement = document.createElement('div');
      itemElement.className = 'tree-item';
      itemElement.style.paddingLeft = `${depth * 20}px`;

      // Create label
      const label = document.createElement('span');
      label.textContent = item.name;
      itemElement.appendChild(label);

      elements.push(itemElement);

      // Recursively create children if any
      if (item.children && item.children.length > 0) {
        const childElements = createTreeNodes(item.children, depth + 1);
        elements.push(...childElements);
      }
    }

    return elements;
  }

  // Create container
  const container = document.createElement('div');
  container.className = 'tree-view';

  // Create and append all nodes
  const nodes = createTreeNodes(data);
  for (const node of nodes) {
    container.appendChild(node);
  }

  return container;
}
```

### Exercise 18: Database Query Builder

```javascript
function buildQuery(table, conditions, fields = ['*'], joins = [], orderBy = null, limit = null) {
  // Start with base query
  let query = `SELECT ${fields.join(', ')} FROM ${table}`;

  // Add joins
  for (const join of joins) {
    query += ` JOIN ${join.table} ON ${join.on}`;
  }

  // Add WHERE conditions
  if (conditions && Object.keys(conditions).length > 0) {
    query += ' WHERE ';
    const whereClauses = [];

    for (const [field, value] of Object.entries(conditions)) {
      if (Array.isArray(value)) {
        whereClauses.push(`${field} IN (${value.map(v => `'${v}'`).join(', ')})`);
      } else {
        whereClauses.push(`${field} = '${value}'`);
      }
    }

    query += whereClauses.join(' AND ');
  }

  // Add ORDER BY
  if (orderBy) {
    query += ` ORDER BY ${orderBy.field} ${orderBy.dir}`;
  }

  // Add LIMIT
  if (limit) {
    query += ` LIMIT ${limit}`;
  }

  return query;
}
```

## Multiple Choice Speed Round (30 seconds each)

For each of the following questions, quickly identify the correct time complexity. Try to answer each within 30 seconds.

1. What's the time complexity of finding an element in a sorted array using binary search?
   - A. O(1)
   - B. O(log n)
   - C. O(n)
   - D. O(n log n)

2. The space complexity of a recursive function that makes n nested calls before reaching the base case is:
   - A. O(1)
   - B. O(log n)
   - C. O(n)
   - D. O(n²)

3. Given a hash table with n elements, the average time complexity for insertion is:
   - A. O(1)
   - B. O(log n)
   - C. O(n)
   - D. O(n log n)

4. Bubble sort has a worst-case time complexity of:
   - A. O(n)
   - B. O(n log n)
   - C. O(n²)
   - D. O(2ⁿ)

5. The time complexity of accessing an element in an array by index is:
   - A. O(1)
   - B. O(log n)
   - C. O(n)
   - D. Depends on the implementation

6. What's the time complexity of inserting an element at the beginning of an array?
   - A. O(1)
   - B. O(log n)
   - C. O(n)
   - D. O(n²)

7. The space complexity of an adjacency matrix for a graph with V vertices is:
   - A. O(1)
   - B. O(V)
   - C. O(E) where E is the number of edges
   - D. O(V²)

8. The time complexity of the JavaScript Array.prototype.map() method is:
   - A. O(1)
   - B. O(log n)
   - C. O(n)
   - D. O(n²)

9. The time complexity of quicksort in the average case is:
   - A. O(n)
   - B. O(n log n)
   - C. O(n²)
   - D. O(n³)

10. For a min-heap data structure, the time complexity of finding the minimum element is:
    - A. O(1)
    - B. O(log n)
    - C. O(n)
    - D. O(n log n)

## Answers

Check your answers only after completing the exercises. Compare your analysis with these solutions to identify areas for further study.

### Quick-Analysis Exercises
1. Mystery1: Time - O(n), Space - O(1)
2. Mystery2: Time - O(n²), Space - O(n)
3. Mystery3: Time - O(2ⁿ), Space - O(n)
4. Mystery4: Time - O(n²), Space - O(n log n)
5. Mystery5: Time - O(log n), Space - O(1)

### Medium-Difficulty Exercises
6. Mystery6: Time - O(n * k log k) where k is max string length, Space - O(n)
7. Mystery7: Time - O(n³), Space - O(n²)
8. Mystery8: Time - O(n log n), Space - O(n)
9. Mystery9: Time - O(n²) worst case, Space - O(n)
10. Mystery10: Time - O(n²), Space - O(n²)

### Complex Analysis Exercises
11. FindAllSubsets: Time - O(n * 2ⁿ), Space - O(n * 2ⁿ)
12. LongestIncreasingSubsequence: Time - O(n²), Space - O(n)
13. FloydWarshall: Time - O(V³), Space - O(V²)
14. IsMatch: Time - O(m * n), Space - O(m * n)
15. WordBreak: Time - O(n² * m) where m is max word length, Space - O(n)

### Multiple Choice Speed Round
1. B. O(log n)
2. C. O(n)
3. A. O(1)
4. C. O(n²)
5. A. O(1)
6. C. O(n)
7. D. O(V²)
8. C. O(n)
9. B. O(n log n)
10. A. O(1)

---

**Navigation**
- [⬅️ Previous: Solutions](./basic-solutions.md)
- [⬆️ Up to Practice Index](./README.md)
- [➡️ Next: Interview Questions](./interview-questions.md)