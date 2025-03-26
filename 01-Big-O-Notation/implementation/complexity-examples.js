/**
 * Big O Notation - Implementation Examples
 * This file demonstrates various time and space complexities with JavaScript examples
 */

// O(1) - Constant Time
function constantTimeOperation(arr) {
  console.log("This is O(1) time complexity");
  return arr[0]; // Access first element - always takes the same amount of time
}

// O(log n) - Logarithmic Time
function binarySearch(sortedArray, target) {
  console.log("This is O(log n) time complexity");
  let left = 0;
  let right = sortedArray.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (sortedArray[mid] === target) {
      return mid; // Target found at index mid
    } else if (sortedArray[mid] < target) {
      left = mid + 1; // Search the right half
    } else {
      right = mid - 1; // Search the left half
    }
  }

  return -1; // Target not found
}

// O(n) - Linear Time
function linearSearch(arr, target) {
  console.log("This is O(n) time complexity");
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) {
      return i; // Target found at index i
    }
  }
  return -1; // Target not found
}

// O(n log n) - Linearithmic Time
function mergeSort(arr) {
  console.log("This is O(n log n) time complexity");
  // Base case: arrays with 0 or 1 elements are already sorted
  if (arr.length <= 1) {
    return arr;
  }

  // Split the array into two halves
  const middle = Math.floor(arr.length / 2);
  const leftArr = arr.slice(0, middle);
  const rightArr = arr.slice(middle);

  // Recursively sort both halves
  const leftSorted = mergeSort(leftArr);
  const rightSorted = mergeSort(rightArr);

  // Merge the sorted halves
  return merge(leftSorted, rightSorted);
}

// Helper function for mergeSort
function merge(leftArr, rightArr) {
  const result = [];
  let leftIndex = 0;
  let rightIndex = 0;

  // Compare elements from both arrays and add the smaller one to the result
  while (leftIndex < leftArr.length && rightIndex < rightArr.length) {
    if (leftArr[leftIndex] < rightArr[rightIndex]) {
      result.push(leftArr[leftIndex]);
      leftIndex++;
    } else {
      result.push(rightArr[rightIndex]);
      rightIndex++;
    }
  }

  // Add remaining elements from left array (if any)
  while (leftIndex < leftArr.length) {
    result.push(leftArr[leftIndex]);
    leftIndex++;
  }

  // Add remaining elements from right array (if any)
  while (rightIndex < rightArr.length) {
    result.push(rightArr[rightIndex]);
    rightIndex++;
  }

  return result;
}

// O(n²) - Quadratic Time
function bubbleSort(arr) {
  console.log("This is O(n²) time complexity");
  const n = arr.length;
  let swapped;

  // Outer loop runs n times
  for (let i = 0; i < n; i++) {
    swapped = false;

    // Inner loop runs n-i-1 times (approximately n times for large arrays)
    for (let j = 0; j < n - i - 1; j++) {
      // If current element is greater than next element, swap them
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]]; // ES6 swap
        swapped = true;
      }
    }

    // If no swapping occurred in this pass, array is already sorted
    if (!swapped) {
      break;
    }
  }

  return arr;
}

// O(2^n) - Exponential Time
function fibonacci(n) {
  console.log("This is O(2^n) time complexity");
  if (n <= 1) {
    return n;
  }
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// O(n!) - Factorial Time
function generatePermutations(arr) {
  console.log("This is O(n!) time complexity");
  const result = [];

  function permute(arr, start = 0) {
    if (start === arr.length - 1) {
      result.push([...arr]);
      return;
    }

    for (let i = start; i < arr.length; i++) {
      // Swap elements at indices start and i
      [arr[start], arr[i]] = [arr[i], arr[start]];

      // Recursively generate permutations for the rest of the array
      permute(arr, start + 1);

      // Backtrack: restore the array to its original state
      [arr[start], arr[i]] = [arr[i], arr[start]];
    }
  }

  permute(arr);
  return result;
}

// ===== Space Complexity Examples =====

// O(1) Space Complexity
function constantSpace(n) {
  console.log("This function uses O(1) space complexity");
  let sum = 0;

  for (let i = 1; i <= n; i++) {
    sum += i;
  }

  return sum;
}

// O(n) Space Complexity
function linearSpace(n) {
  console.log("This function uses O(n) space complexity");
  const arr = [];

  for (let i = 0; i < n; i++) {
    arr.push(i * 2);
  }

  return arr;
}

// O(n²) Space Complexity
function quadraticSpace(n) {
  console.log("This function uses O(n²) space complexity");
  const matrix = [];

  for (let i = 0; i < n; i++) {
    const row = [];
    for (let j = 0; j < n; j++) {
      row.push(i * j);
    }
    matrix.push(row);
  }

  return matrix;
}

// ===== Real-World Web Development Examples =====

// Fetching data - O(1) operation but network latency is the real bottleneck
async function fetchUserData(userId) {
  try {
    const response = await fetch(`/api/users/${userId}`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
}

// DOM manipulation - Adding multiple elements can be O(n)
function createListItems(items) {
  const ul = document.createElement('ul');

  // O(n) operation - creating n list items
  items.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    ul.appendChild(li); // DOM operations can be expensive
  });

  return ul;
}

// React component rendering - Avoid nested loops for rendering
function renderTable(data) {
  // Potentially O(n²) operation if data is large
  return `
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Email</th>
        </tr>
      </thead>
      <tbody>
        ${data.map(user => `
          <tr>
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// Optimized search with hash map - O(1) lookup
function optimizedSearch(users, targetId) {
  // O(n) operation to build the map (done once)
  const userMap = {};
  users.forEach(user => {
    userMap[user.id] = user;
  });

  // O(1) lookup operation
  return userMap[targetId] || null;
}

// Export functions for use in exercises
module.exports = {
  constantTimeOperation,
  binarySearch,
  linearSearch,
  mergeSort,
  bubbleSort,
  fibonacci,
  generatePermutations,
  constantSpace,
  linearSpace,
  quadraticSpace
};