# Basic Exercises for Big O Notation

**Navigation:** [🏠 Home](../../README.md) > [📚 Big O Notation](../README.md) > [🏋️ Practice](./README.md) > Basic Exercises

# Big O Notation Exercises

## Exercise 1: Analyze Time Complexity

For each of the following functions, determine the time complexity in Big O notation and explain your reasoning.

```javascript
// Function 1
function sumArray(arr) {
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i];
  }
  return sum;
}

// Function 2
function nestedForLoop(n) {
  let count = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      count++;
    }
  }
  return count;
}

// Function 3
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

// Function 4
function recursiveSum(n) {
  if (n <= 0) {
    return 0;
  }
  return n + recursiveSum(n - 1);
}

// Function 5
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

## Exercise 2: Analyze Space Complexity

For each of the following functions, determine the space complexity in Big O notation and explain your reasoning.

```javascript
// Function 1
function createArray(n) {
  const arr = [];
  for (let i = 0; i < n; i++) {
    arr.push(i);
  }
  return arr;
}

// Function 2
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

// Function 3
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

## Exercise 3: Optimize Code

The following functions have suboptimal time complexity. Rewrite each to improve its efficiency and explain the complexity of both the original and optimized versions.

```javascript
// Function 1: Finding if an array contains a specific value
function containsValue(arr, value) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === value) {
      return true;
    }
  }
  return false;
}

// Function 2: Finding duplicate values in an array
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

// Function 3: Calculating nth Fibonacci number
function fibonacci(n) {
  if (n <= 1) {
    return n;
  }
  return fibonacci(n - 1) + fibonacci(n - 2);
}
```

## Exercise 4: Real-World Web Development Scenarios

Analyze the time and space complexity of the following web development scenarios:

1. Rendering a list of 1000 items in a React component
2. Searching for a user by ID in an array of user objects
3. Sorting a list of products by price
4. Filtering an array of transactions based on a date range
5. Implementing an autocomplete feature that searches as you type

## Exercise 5: Algorithm Design

Design algorithms for the following problems and analyze their time and space complexity:

1. Find the intersection of two arrays (i.e., elements that appear in both arrays)
2. Check if a string is a palindrome (reads the same forwards and backwards)
3. Find the first non-repeating character in a string
4. Merge two sorted arrays into a single sorted array
5. Implement a function to determine if a string has all unique characters

## Exercise 6: Comparative Analysis

For each of the following problems, compare multiple approaches and their respective time and space complexities:

1. **Finding an element in a collection**
   - Linear search (unsorted array)
   - Binary search (sorted array)
   - Hash map lookup

2. **Sorting an array**
   - Bubble Sort
   - Merge Sort
   - Quick Sort
   - JavaScript's built-in sort()

3. **Calculating the sum of numbers from 1 to n**
   - Iterative approach
   - Mathematical formula (n * (n + 1) / 2)
   - Recursive approach

## Exercise 7: Web Performance Optimization

Identify potential performance bottlenecks in the following code snippets and suggest optimizations based on Big O analysis:

```javascript
// Scenario 1: Rendering a large table
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

// Scenario 2: Filtering and sorting data
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

## Challenge Problems

1. **Analyze the complexity of a recursive function with multiple recursive calls**

```javascript
function recursiveFunction(n) {
  if (n <= 1) {
    return 1;
  }
  return recursiveFunction(n - 1) + recursiveFunction(n - 2) + recursiveFunction(n - 3);
}
```

2. **Identify the time complexity of an algorithm with a loop whose bounds change**

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

3. **Complex data processing pipeline**

Analyze the overall time and space complexity of this data processing pipeline:

```javascript
function processData(data) {
  // Step 1: Filter out invalid entries
  const validData = data.filter(item => item.value > 0);

  // Step 2: Transform the data
  const transformedData = validData.map(item => {
    return {
      id: item.id,
      value: item.value * 2,
      category: item.category.toUpperCase()
    };
  });

  // Step 3: Group by category
  const groupedData = {};
  for (const item of transformedData) {
    if (!groupedData[item.category]) {
      groupedData[item.category] = [];
    }
    groupedData[item.category].push(item);
  }

  // Step 4: Sort each category group
  for (const category in groupedData) {
    groupedData[category].sort((a, b) => a.value - b.value);
  }

  return groupedData;
}
```

---

**Navigation**
- [⬅️ Previous: Practice Overview](./README.md)
- [⬆️ Up to Practice Index](./README.md)
- [➡️ Next: Solutions](./basic-solutions.md)