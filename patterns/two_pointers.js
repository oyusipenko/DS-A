/*
TWO POINTERS PATTERN

Concept:
The Two Pointers technique uses two pointers that either:
1. Start at opposite ends and move toward each other (common in sorted arrays)
2. Start at the same point and move at different speeds or conditions

Applications:
- Finding pairs in a sorted array (sum, difference)
- Removing duplicates
- Palindrome verification
- Subarray problems with constraints
- Linked list cycle detection

Time Complexity: Usually O(n) - single pass through the data
Space Complexity: Usually O(1) - constant extra space

Example 1: Two Sum in Sorted Array
*/

// Find indices of two numbers that add up to target
function twoSum(nums: number[], target: unknown) {
  let left = 0;
  let right = nums.length - 1;


  while (left < right) {
    const sum = nums[left] + nums[right];

    if (sum == target) {
      return [left, right];
    } else if (sum < target) {
      left++; // Need a larger sum, move left pointer
    } else {
      right--; // Need a smaller sum, move right pointer
    }
  }

  return [-1, -1]; // No solution found
}

/*
Example 2: Remove Duplicates from Sorted Array
*/

function removeDuplicates(nums) {
  if (nums.length === 0) return 0;

  let i = 0; // Slow pointer (position to place next unique element)

  for (let j = 1; j < nums.length; j++) { // Fast pointer
    if (nums[j] !== nums[i]) {
      i++;
      nums[i] = nums[j];
    }
  }

  return i + 1; // Length of unique elements
}


var test = removeDuplicates([1, 1, 2, 3, 4, 4, 5]);
console.log(test);

/*
When to Use:
- When dealing with sorted arrays
- When searching for pairs with certain constraints
- When you need O(n) time complexity and O(1) space complexity
- String/array problems involving palindromes or subarrays
*/ 