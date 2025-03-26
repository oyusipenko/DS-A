/*
DIVIDE AND CONQUER PATTERN

Concept:
Divide and Conquer is an algorithmic paradigm that breaks a problem into smaller, similar subproblems,
solves them independently, and then combines their solutions to solve the original problem.

Three Main Steps:
1. Divide: Break the problem into smaller subproblems
2. Conquer: Solve the subproblems recursively
3. Combine: Merge the solutions of subproblems into a solution for the original problem

Applications:
- Sorting algorithms (Merge Sort, Quick Sort)
- Binary Search
- Matrix multiplication (Strassen's algorithm)
- Closest pair of points
- Fast Fourier Transform (FFT)
- Maximum subarray problem

Time Complexity: Usually O(n log n) for efficient implementations
Space Complexity: Varies, often O(n) or O(log n) for recursion stack

Example 1: Merge Sort
*/

function mergeSort(arr) {
  // Base case
  if (arr.length <= 1) return arr;

  // Divide array into halves
  const mid = Math.floor(arr.length / 2);
  const left = arr.slice(0, mid);
  const right = arr.slice(mid);

  // Recursively sort both halves
  const sortedLeft = mergeSort(left);
  const sortedRight = mergeSort(right);

  // Combine: merge the sorted halves
  return merge(sortedLeft, sortedRight);
}

function merge(left, right) {
  let result = [];
  let leftIndex = 0;
  let rightIndex = 0;

  // Compare elements from both arrays and add smaller one to result
  while (leftIndex < left.length && rightIndex < right.length) {
    if (left[leftIndex] < right[rightIndex]) {
      result.push(left[leftIndex]);
      leftIndex++;
    } else {
      result.push(right[rightIndex]);
      rightIndex++;
    }
  }

  // Add remaining elements
  return result.concat(left.slice(leftIndex)).concat(right.slice(rightIndex));
}

/*
Example 2: Quick Sort
*/

function quickSort(arr, left = 0, right = arr.length - 1) {
  if (left < right) {
    // Partition the array and get the pivot index
    const pivotIndex = partition(arr, left, right);

    // Recursively sort the subarrays
    quickSort(arr, left, pivotIndex - 1);
    quickSort(arr, pivotIndex + 1, right);
  }

  return arr;
}

function partition(arr, left, right) {
  const pivot = arr[right]; // Choose rightmost element as pivot
  let i = left - 1; // Index of smaller element

  for (let j = left; j < right; j++) {
    // If current element is smaller than the pivot
    if (arr[j] < pivot) {
      i++;
      // Swap arr[i] and arr[j]
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  // Swap arr[i+1] and arr[right] (pivot)
  [arr[i + 1], arr[right]] = [arr[right], arr[i + 1]];

  return i + 1; // Return the pivot index
}

/*
Example 3: Maximum Subarray Sum using Divide and Conquer
*/

function maxSubarraySum(arr, left = 0, right = arr.length - 1) {
  // Base case: single element
  if (left === right) return arr[left];

  // Find middle point
  const mid = Math.floor((left + right) / 2);

  // Return maximum of:
  // 1. Maximum subarray sum in left half
  // 2. Maximum subarray sum in right half
  // 3. Maximum subarray sum such that the subarray crosses the midpoint
  return Math.max(
    maxSubarraySum(arr, left, mid),
    maxSubarraySum(arr, mid + 1, right),
    maxCrossingSum(arr, left, mid, right)
  );
}

function maxCrossingSum(arr, left, mid, right) {
  // Include elements on left of mid
  let sum = 0;
  let leftSum = Number.NEGATIVE_INFINITY;

  for (let i = mid; i >= left; i--) {
    sum += arr[i];
    leftSum = Math.max(leftSum, sum);
  }

  // Include elements on right of mid
  sum = 0;
  let rightSum = Number.NEGATIVE_INFINITY;

  for (let i = mid + 1; i <= right; i++) {
    sum += arr[i];
    rightSum = Math.max(rightSum, sum);
  }

  // Return sum of elements on left and right of mid
  return leftSum + rightSum;
}

/*
When to Use:
- When a problem can be broken down into similar, smaller subproblems
- When subproblems are independent and don't overlap (unlike dynamic programming)
- When the solution can be built by combining solutions to subproblems
- When the problem size reduces by a factor at each step (e.g., halving)
- When recursive solutions are more natural or efficient
*/ 