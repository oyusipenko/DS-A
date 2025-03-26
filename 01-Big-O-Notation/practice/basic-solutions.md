# Solutions to Big O Notation Exercises

**Navigation:** [🏠 Home](../../README.md) > [📚 Big O Notation](../README.md) > [🏋️ Practice](./README.md) > Solutions

# Big O Notation Exercise Solutions

## Exercise 1: Analyze Time Complexity

### Function 1
```javascript
function sumArray(arr) {
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i];
  }
  return sum;
}
```

**Time Complexity: O(n)**

Explanation: This function iterates through each element of the array exactly once. The number of operations grows linearly with the size of the input array, making it O(n) time complexity.

### Function 2
```javascript
function nestedForLoop(n) {
  let count = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      count++;
    }
  }
  return count;
}
```

**Time Complexity: O(n²)**

Explanation: This function has two nested loops, each running n times. The inner operation (count++) executes n * n = n² times, making this a quadratic time complexity.

### Function 3
```javascript
function findDuplicate(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] === arr[j]) {
        return true;
      }
    }
  }
  return false;
}
```

**Time Complexity: O(n²)**

Explanation: This function has nested loops. The outer loop runs n times, and for each iteration, the inner loop runs n-i-1 times. In the worst case (no duplicates found), this approaches n² operations, giving us O(n²) time complexity.

### Function 4
```javascript
function recursiveSum(n) {
  if (n <= 0) {
    return 0;
  }
  return n + recursiveSum(n - 1);
}
```

**Time Complexity: O(n)**

Explanation: This recursive function makes n recursive calls (from n down to 1) with each call doing constant-time work. The recursion depth is n, making the overall time complexity O(n).

### Function 5
```javascript
function logarithmicExample(n) {
  let i = n;
  let count = 0;
  while (i > 0) {
    count += i;
    i = Math.floor(i / 2);
  }
  return count;
}
```

**Time Complexity: O(log n)**

Explanation: In each iteration, i is divided by 2. Starting from n, the values of i follow: n, n/2, n/4, n/8, ..., 1. The number of iterations to reach 0 is log₂(n), making this O(log n).

## Exercise 2: Analyze Space Complexity

### Function 1
```javascript
function createArray(n) {
  const arr = [];
  for (let i = 0; i < n; i++) {
    arr.push(i);
  }
  return arr;
}
```

**Space Complexity: O(n)**

Explanation: This function creates an array with n elements. The space required grows linearly with the input size n.

### Function 2
```javascript
function createMatrix(n) {
  const matrix = [];
  for (let i = 0; i < n; i++) {
    matrix[i] = [];
    for (let j = 0; j < n; j++) {
      matrix[i][j] = i * j;
    }
  }
  return matrix;
}
```

**Space Complexity: O(n²)**

Explanation: This function creates an n×n matrix, resulting in n² elements. The space required grows quadratically with the input size n.

### Function 3
```javascript
function recursiveFib(n, memo = {}) {
  if (n <= 1) {
    return n;
  }
  if (memo[n]) {
    return memo[n];
  }
  memo[n] = recursiveFib(n - 1, memo) + recursiveFib(n - 2, memo);
  return memo[n];
}
```

**Space Complexity: O(n)**

Explanation: This function uses memoization to store previously calculated Fibonacci numbers. The memo object will store at most n+1 key-value pairs (for values 0 to n). Additionally, the recursion stack will reach a maximum depth of n. Both contribute to O(n) space complexity.

## Exercise 3: Optimize Code

### Function 1: Finding if an array contains a specific value

Original:
```javascript
function containsValue(arr, value) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === value) {
      return true;
    }
  }
  return false;
}
```
**Original Time Complexity: O(n)** - We need to check each element in the worst case.

Optimized:
```javascript
function containsValue(arr, value) {
  return arr.includes(value); // Or use Set for even better performance if needed
}
```
**Optimized Time Complexity: O(n)** - The time complexity remains the same, but the code is cleaner.

For frequent lookups on the same array, we could further optimize:
```javascript
function createLookupSet(arr) {
  return new Set(arr);
}

function containsValue(lookupSet, value) {
  return lookupSet.has(value);
}
```
**Optimized Time Complexity with Set: O(1)** - After creating the Set (O(n) operation done once), each lookup is O(1).

### Function 2: Finding duplicate values in an array

Original:
```javascript
function hasDuplicates(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length; j++) {
      if (i !== j && arr[i] === arr[j]) {
        return true;
      }
    }
  }
  return false;
}
```
**Original Time Complexity: O(n²)** - Nested loops result in quadratic time complexity.

Optimized:
```javascript
function hasDuplicates(arr) {
  const seen = new Set();

  for (const item of arr) {
    if (seen.has(item)) {
      return true;
    }
    seen.add(item);
  }

  return false;
}
```
**Optimized Time Complexity: O(n)** - We iterate through the array once with constant-time operations for each element.

### Function 3: Calculating nth Fibonacci number

Original:
```javascript
function fibonacci(n) {
  if (n <= 1) {
    return n;
  }
  return fibonacci(n - 1) + fibonacci(n - 2);
}
```
**Original Time Complexity: O(2ⁿ)** - The recursive solution has exponential time complexity due to repeated calculations.

Optimized (Dynamic Programming - Memoization):
```javascript
function fibonacci(n, memo = {}) {
  if (n <= 1) {
    return n;
  }

  if (memo[n]) {
    return memo[n];
  }

  memo[n] = fibonacci(n - 1, memo) + fibonacci(n - 2, memo);
  return memo[n];
}
```
**Optimized Time Complexity: O(n)** - Using memoization, we calculate each Fibonacci number only once.

Optimized (Iterative):
```javascript
function fibonacci(n) {
  if (n <= 1) {
    return n;
  }

  let a = 0;
  let b = 1;
  let temp;

  for (let i = 2; i <= n; i++) {
    temp = a + b;
    a = b;
    b = temp;
  }

  return b;
}
```
**Optimized Time Complexity: O(n)** - The iterative solution has linear time complexity and avoids recursion overhead.

## Exercise 4: Real-World Web Development Scenarios

### 1. Rendering a list of 1000 items in a React component

**Time Complexity: O(n)**
- React needs to process each item to create DOM elements
- The number of operations scales linearly with the number of items

**Space Complexity: O(n)**
- Memory is needed to store the rendered components
- Virtual DOM nodes for each item consume memory

**Optimizations:**
- Use virtualization (e.g., `react-window` or `react-virtualized`) to render only visible items: O(visible_items)
- Implement pagination to limit the items shown at once
- Memoize components to prevent unnecessary re-renders

### 2. Searching for a user by ID in an array of user objects

**Using Array.find (default approach):**
**Time Complexity: O(n)**
- In the worst case, the entire array needs to be searched

**Optimized Approach:**
```javascript
// Create a map for O(1) lookups
const userMap = users.reduce((map, user) => {
  map[user.id] = user;
  return map;
}, {});

// Lookup by ID
const user = userMap[userId]; // O(1) time complexity
```

**Optimized Time Complexity: O(1)**
- After initial map creation (O(n)), lookups are constant time

### 3. Sorting a list of products by price

**Time Complexity: O(n log n)**
- JavaScript's built-in sort uses a comparison-based algorithm
- The best comparison-based sorts have O(n log n) complexity

**Space Complexity: O(log n) to O(n)**
- Depends on the specific sorting algorithm used by the JavaScript engine

**Example:**
```javascript
const sortedProducts = products.slice().sort((a, b) => a.price - b.price);
```

### 4. Filtering an array of transactions based on a date range

**Time Complexity: O(n)**
- Each transaction must be checked against the date range
- The filter operation processes all n elements

**Example:**
```javascript
const filteredTransactions = transactions.filter(
  trans => trans.date >= startDate && trans.date <= endDate
);
```

**Optimization:**
- If the data is already sorted by date, a binary search could locate the start and end points: O(log n + k) where k is the number of matching transactions
- For repeated operations, keep an index by date ranges

### 5. Implementing an autocomplete feature that searches as you type

**Naive approach - searching through all records:**
**Time Complexity: O(n * m)** where n is the number of items and m is the average string length

**Optimized approaches:**
1. **Trie Data Structure:**
   - Search complexity: O(k) where k is the length of the search term
   - Build complexity: O(n * m) (one-time cost)
   - Space complexity: O(n * m)

2. **Prefix Index:**
   - Build an index of prefixes pointing to matching items
   - Lookup complexity: O(1) for the index + O(results) to retrieve matching items

3. **Client-side implementation with throttling/debouncing:**
   - Reduce the number of searches while typing
   - Only search after a short delay of inactivity

## Exercise 5: Algorithm Design

### 1. Find the intersection of two arrays

**Solution:**
```javascript
function intersection(arr1, arr2) {
  const set1 = new Set(arr1);
  return arr2.filter(item => set1.has(item));
}
```

**Time Complexity: O(n + m)** where n and m are the lengths of the arrays
- Creating the Set is O(n)
- Filtering the second array is O(m) with O(1) lookups

**Space Complexity: O(n + result)**
- The Set requires O(n) space
- The result array requires space for the intersection elements

### 2. Check if a string is a palindrome

**Solution:**
```javascript
function isPalindrome(str) {
  // Remove non-alphanumeric characters and convert to lowercase
  const cleanStr = str.toLowerCase().replace(/[^a-z0-9]/g, '');

  // Compare with reversed string
  return cleanStr === cleanStr.split('').reverse().join('');
}
```

**Time Complexity: O(n)** where n is the length of the string
- Each character needs to be processed once

**Space Complexity: O(n)**
- We create new strings of similar length to the input

**Optimized solution with less space:**
```javascript
function isPalindrome(str) {
  const cleanStr = str.toLowerCase().replace(/[^a-z0-9]/g, '');

  let left = 0;
  let right = cleanStr.length - 1;

  while (left < right) {
    if (cleanStr[left] !== cleanStr[right]) {
      return false;
    }
    left++;
    right--;
  }

  return true;
}
```

**Optimized Space Complexity: O(n)** (still need the cleaned string, but no reversed copy)

### 3. Find the first non-repeating character in a string

**Solution:**
```javascript
function firstNonRepeatingChar(str) {
  const charCount = {};

  // Count occurrences of each character
  for (const char of str) {
    charCount[char] = (charCount[char] || 0) + 1;
  }

  // Find the first character with count 1
  for (let i = 0; i < str.length; i++) {
    if (charCount[str[i]] === 1) {
      return str[i];
    }
  }

  return null; // No non-repeating character found
}
```

**Time Complexity: O(n)** where n is the string length
- We make two passes through the string

**Space Complexity: O(k)** where k is the size of the character set
- In practice, often O(1) as there's a limited set of characters

### 4. Merge two sorted arrays into a single sorted array

**Solution:**
```javascript
function mergeSortedArrays(arr1, arr2) {
  const result = [];
  let i = 0, j = 0;

  while (i < arr1.length && j < arr2.length) {
    if (arr1[i] < arr2[j]) {
      result.push(arr1[i]);
      i++;
    } else {
      result.push(arr2[j]);
      j++;
    }
  }

  // Add remaining elements
  while (i < arr1.length) {
    result.push(arr1[i]);
    i++;
  }

  while (j < arr2.length) {
    result.push(arr2[j]);
    j++;
  }

  return result;
}
```

**Time Complexity: O(n + m)** where n and m are the lengths of the arrays
- We process each element exactly once

**Space Complexity: O(n + m)**
- The result array contains all elements from both input arrays

### 5. Implement a function to determine if a string has all unique characters

**Solution:**
```javascript
function hasAllUniqueChars(str) {
  const charSet = new Set();

  for (const char of str) {
    if (charSet.has(char)) {
      return false;
    }
    charSet.add(char);
  }

  return true;
}
```

**Time Complexity: O(n)** where n is the string length
- We process each character once with O(1) operations

**Space Complexity: O(k)** where k is the size of the character set
- In practice, often bounded by the size of the alphabet or ASCII/Unicode set

## Exercise 6: Comparative Analysis

### 1. Finding an element in a collection

**Linear Search (unsorted array)**
- Time Complexity: O(n)
- Space Complexity: O(1)
- Best for: Small arrays or single lookups where setup cost matters

**Binary Search (sorted array)**
- Time Complexity: O(log n)
- Space Complexity: O(1) for iterative, O(log n) for recursive implementation
- Best for: Multiple lookups in a sorted array where sorting cost is amortized
- Requires the array to be sorted first (O(n log n))

**Hash Map Lookup**
- Time Complexity: O(1) average case, O(n) worst case (rare with good hash function)
- Space Complexity: O(n)
- Setup Cost: O(n) to build the map
- Best for: Frequent lookups where setup cost is amortized

**Trade-offs:**
- For a single lookup in an unsorted array, linear search is often more efficient due to lower overhead
- For repeated lookups, creating a hash map upfront pays off quickly
- Binary search is a good middle ground if the data is already sorted

### 2. Sorting an array

**Bubble Sort**
- Time Complexity: O(n²) average and worst case, O(n) best case (already sorted)
- Space Complexity: O(1)
- Stable: Yes
- Best for: Very small arrays or nearly sorted data

**Merge Sort**
- Time Complexity: O(n log n) for all cases
- Space Complexity: O(n)
- Stable: Yes
- Best for: Guaranteed performance and stable sorting

**Quick Sort**
- Time Complexity: O(n log n) average, O(n²) worst case
- Space Complexity: O(log n) average for recursion stack
- Stable: No (typical implementations)
- Best for: In-place sorting with good average performance

**JavaScript's built-in sort()**
- Time Complexity: Varies by browser (typically O(n log n))
- Implementation: May use different algorithms (QuickSort, TimSort, etc.)
- Note: Sorts elements as strings by default; needs a comparator for numeric sorting

**Trade-offs:**
- Bubble sort is simple but inefficient for large datasets
- Merge sort guarantees O(n log n) performance but uses extra space
- Quick sort is efficient on average and used in many sorting libraries
- JavaScript's built-in sort() is convenient but needs a comparator for custom sorting

### 3. Calculating the sum of numbers from 1 to n

**Iterative Approach**
```javascript
function sumIterative(n) {
  let sum = 0;
  for (let i = 1; i <= n; i++) {
    sum += i;
  }
  return sum;
}
```
- Time Complexity: O(n)
- Space Complexity: O(1)

**Mathematical Formula**
```javascript
function sumFormula(n) {
  return n * (n + 1) / 2;
}
```
- Time Complexity: O(1)
- Space Complexity: O(1)

**Recursive Approach**
```javascript
function sumRecursive(n) {
  if (n === 1) {
    return 1;
  }
  return n + sumRecursive(n - 1);
}
```
- Time Complexity: O(n)
- Space Complexity: O(n) for the call stack

**Trade-offs:**
- The mathematical formula is clearly superior in both time and space complexity
- The iterative approach is easy to understand and has constant space complexity
- The recursive approach is elegant but inefficient due to stack overhead

## Exercise 7: Web Performance Optimization

### Scenario 1: Rendering a large table

Original:
```javascript
function renderUserTable(users) {
  const tableRows = [];
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const row = document.createElement('tr');

    // Create and append table cells for each user property
    for (const key in user) {
      const cell = document.createElement('td');
      cell.textContent = user[key];
      row.appendChild(cell);
    }

    tableRows.push(row);
  }

  const table = document.getElementById('userTable');
  for (let i = 0; i < tableRows.length; i++) {
    table.appendChild(tableRows[i]);
  }
}
```

**Performance Issues:**
1. **Multiple DOM operations**: Each cell creation and append triggers layout recalculations
2. **Repeated DOM lookups**: `getElementById` is called inside a loop
3. **Inefficient multiple appends**: Adding rows one at a time is inefficient

**Optimized Version:**
```javascript
function renderUserTable(users) {
  const table = document.getElementById('userTable');
  const fragment = document.createDocumentFragment();

  // Define which properties to display (instead of all properties)
  const displayProperties = ['id', 'name', 'email']; // Example properties

  // Create all rows at once
  users.forEach(user => {
    const row = document.createElement('tr');

    // Only create cells for specified properties
    displayProperties.forEach(prop => {
      const cell = document.createElement('td');
      cell.textContent = user[prop] || '';
      row.appendChild(cell);
    });

    fragment.appendChild(row);
  });

  // Single DOM update
  table.appendChild(fragment);
}
```

**Improvements:**
- Uses `DocumentFragment` to batch DOM updates
- Limits property iteration to known display properties
- Reduces DOM operations and reflows
- For very large tables, implement pagination or virtualization

### Scenario 2: Filtering and sorting data

Original:
```javascript
function filterAndSortProducts(products, category, minPrice) {
  // Filter products by category
  const filteredByCategory = [];
  for (let i = 0; i < products.length; i++) {
    if (products[i].category === category) {
      filteredByCategory.push(products[i]);
    }
  }

  // Filter by minimum price
  const filteredByPrice = [];
  for (let i = 0; i < filteredByCategory.length; i++) {
    if (filteredByCategory[i].price >= minPrice) {
      filteredByPrice.push(filteredByCategory[i]);
    }
  }

  // Sort by price (bubble sort)
  for (let i = 0; i < filteredByPrice.length; i++) {
    for (let j = 0; j < filteredByPrice.length - 1 - i; j++) {
      if (filteredByPrice[j].price > filteredByPrice[j + 1].price) {
        const temp = filteredByPrice[j];
        filteredByPrice[j] = filteredByPrice[j + 1];
        filteredByPrice[j + 1] = temp;
      }
    }
  }

  return filteredByPrice;
}
```

**Performance Issues:**
1. **Multiple array iterations**: Separate passes for each filter
2. **Inefficient sorting algorithm**: Bubble sort is O(n²)
3. **Excessive intermediate arrays**: Creates multiple arrays

**Optimized Version:**
```javascript
function filterAndSortProducts(products, category, minPrice) {
  // Combined filtering in a single pass
  const filtered = products.filter(product =>
    product.category === category && product.price >= minPrice
  );

  // Using JavaScript's built-in sort (typically O(n log n))
  return filtered.sort((a, b) => a.price - b.price);
}
```

**Improvements:**
- Single pass filtering with combined conditions: O(n)
- Uses JavaScript's built-in sort: O(n log n)
- More readable and maintainable code
- For frequently accessed data, consider maintaining indexed collections

**Further optimization (for repeated operations):**
```javascript
// Create indexes for common query patterns (on initialization)
function createProductIndexes(products) {
  const categoryIndex = {};

  // Index by category
  products.forEach(product => {
    if (!categoryIndex[product.category]) {
      categoryIndex[product.category] = [];
    }
    categoryIndex[product.category].push(product);
  });

  // Pre-sort each category array by price
  for (const category in categoryIndex) {
    categoryIndex[category].sort((a, b) => a.price - b.price);
  }

  return { categoryIndex };
}

// More efficient lookup using indexes
function filterAndSortProductsOptimized(indexes, category, minPrice) {
  const { categoryIndex } = indexes;

  // Get pre-filtered category (or empty array if category doesn't exist)
  const categoryProducts = categoryIndex[category] || [];

  // Binary search to find the index of the first product >= minPrice
  const startIdx = binarySearchFirstGreaterOrEqual(categoryProducts, minPrice);

  // Return the slice from startIdx to the end (all products >= minPrice)
  return startIdx === -1 ? [] : categoryProducts.slice(startIdx);
}

// Binary search helper
function binarySearchFirstGreaterOrEqual(sortedProducts, minPrice) {
  let left = 0;
  let right = sortedProducts.length - 1;
  let result = -1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (sortedProducts[mid].price >= minPrice) {
      result = mid;
      right = mid - 1;  // Look for an earlier occurrence
    } else {
      left = mid + 1;
    }
  }

  return result;
}
```

**Advanced optimization time complexity:**
- Index creation: O(n log n) (one-time cost)
- Lookup: O(log n) using binary search
- Ideal for repeated queries on the same dataset

## Challenge Problems

### 1. Recursive function with multiple recursive calls

```javascript
function recursiveFunction(n) {
  if (n <= 1) {
    return 1;
  }
  return recursiveFunction(n - 1) + recursiveFunction(n - 2) + recursiveFunction(n - 3);
}
```

**Time Complexity: O(3ⁿ)**

Explanation:
- This is a Tribonacci-like recursive function with three recursive calls
- For each call, we make 3 more calls (except at the base case)
- The recurrence relation is T(n) = T(n-1) + T(n-2) + T(n-3) + O(1)
- This forms a ternary tree of recursive calls with exponential growth
- Without memoization, we recalculate many values repeatedly

**Optimized with memoization: O(n)**

```javascript
function recursiveFunction(n, memo = {}) {
  if (n <= 1) {
    return 1;
  }

  if (memo[n]) {
    return memo[n];
  }

  memo[n] = recursiveFunction(n - 1, memo) +
            recursiveFunction(n - 2, memo) +
            recursiveFunction(n - 3, memo);

  return memo[n];
}
```

### 2. Algorithm with changing loop bounds

```javascript
function mysteryFunction(arr) {
  let result = 0;
  for (let i = 0; i < arr.length; i++) {
    for (let j = i; j < arr.length; j++) {
      result += arr[i] * arr[j];
    }
  }
  return result;
}
```

**Time Complexity: O(n²)**

Explanation:
- The outer loop runs exactly n times (for an array of length n)
- The inner loop runs n times for i=0, n-1 times for i=1, n-2 times for i=2, etc.
- Total number of iterations: n + (n-1) + (n-2) + ... + 1 = n(n+1)/2 = O(n²)
- Each iteration performs constant-time operations

### 3. Complex data processing pipeline

```javascript
function processData(data) {
  // Step 1: Filter out invalid entries - O(n)
  const validData = data.filter(item => item.value > 0);

  // Step 2: Transform the data - O(m) where m is the size of validData
  const transformedData = validData.map(item => {
    return {
      id: item.id,
      value: item.value * 2,
      category: item.category.toUpperCase()
    };
  });

  // Step 3: Group by category - O(m)
  const groupedData = {};
  for (const item of transformedData) {
    if (!groupedData[item.category]) {
      groupedData[item.category] = [];
    }
    groupedData[item.category].push(item);
  }

  // Step 4: Sort each category group - O(m log m) worst case
  for (const category in groupedData) {
    groupedData[category].sort((a, b) => a.value - b.value);
  }

  return groupedData;
}
```

**Overall Time Complexity: O(n + m log m)** where:
- n is the size of the input data
- m is the size of the valid data (m ≤ n)

Breakdown:
1. Filtering: O(n) - We process each input record once
2. Transformation: O(m) - We transform each valid record once
3. Grouping: O(m) - We process each transformed record once
4. Sorting: The worst case is O(m log m) if all items are in a single category
   - Average case with evenly distributed categories would be better

**Space Complexity: O(m)** for storing the transformed and grouped data.

**Optimization opportunities:**
- Combine filter and map operations into a single pass
- Use more efficient data structures for grouping
- Consider if sorting is necessary for all categories

```javascript
function optimizedProcessData(data) {
  const groupedData = {};

  // Combine filter, transform, and group in a single pass
  for (const item of data) {
    if (item.value > 0) {  // Filter condition
      const category = item.category.toUpperCase();

      if (!groupedData[category]) {
        groupedData[category] = [];
      }

      // Transform and store
      groupedData[category].push({
        id: item.id,
        value: item.value * 2,
        category: category
      });
    }
  }

  // Sort each category group
  for (const category in groupedData) {
    groupedData[category].sort((a, b) => a.value - b.value);
  }

  return groupedData;
}
```

This optimization still has the same overall time complexity but reduces constant factors and improves memory usage by avoiding intermediate arrays.

---

**Navigation**
- [⬅️ Previous: Basic Exercises](./basic-exercises.md)
- [⬆️ Up to Practice Index](./README.md)
- [➡️ Next: Timed Exercises](./timed-exercises.md)