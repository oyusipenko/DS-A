/*
BINARY SEARCH PATTERN

Concept:
Binary Search is a divide-and-conquer algorithm that efficiently finds an element in a sorted collection.
It repeatedly divides the search space in half, eliminating half of the remaining elements at each step.

Applications:
- Searching in sorted arrays
- Finding the first/last occurrence of an element
- Finding insertion positions
- Search in rotated sorted arrays
- Search space reduction problems
- Finding the closest element

Time Complexity: O(log n) - logarithmic time
Space Complexity: O(1) for iterative implementation, O(log n) for recursive

Example 1: Standard Binary Search
*/

function binarySearch(nums, target) {
  let left = 0;
  let right = nums.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (nums[mid] === target) {
      return mid; // Found target
    } else if (nums[mid] < target) {
      left = mid + 1; // Target is in the right half
    } else {
      right = mid - 1; // Target is in the left half
    }
  }

  return -1; // Target not found
}

/*
Example 2: First and Last Position of Element in Sorted Array
*/

function searchRange(nums, target) {
  const findFirst = () => {
    let left = 0;
    let right = nums.length - 1;
    let result = -1;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);

      if (nums[mid] >= target) {
        right = mid - 1;
        if (nums[mid] === target) result = mid;
      } else {
        left = mid + 1;
      }
    }

    return result;
  };

  const findLast = () => {
    let left = 0;
    let right = nums.length - 1;
    let result = -1;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);

      if (nums[mid] <= target) {
        left = mid + 1;
        if (nums[mid] === target) result = mid;
      } else {
        right = mid - 1;
      }
    }

    return result;
  };

  return [findFirst(), findLast()];
}

/*
Example 3: Search in Rotated Sorted Array
*/

function searchRotated(nums, target) {
  let left = 0;
  let right = nums.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (nums[mid] === target) {
      return mid;
    }

    // Check if left half is sorted
    if (nums[left] <= nums[mid]) {
      // Check if target is in the left sorted half
      if (nums[left] <= target && target < nums[mid]) {
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    }
    // Right half is sorted
    else {
      // Check if target is in the right sorted half
      if (nums[mid] < target && target <= nums[right]) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
  }

  return -1;
}

/*
When to Use:
- When the collection is sorted or can be sorted
- When you need to search efficiently in large datasets
- When the problem can be solved by repeatedly dividing the search space
- When you need O(log n) time complexity instead of O(n)
- For optimization problems where binary search can be applied to the answer space
*/ 