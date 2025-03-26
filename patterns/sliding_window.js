/*
SLIDING WINDOW PATTERN

Concept:
The Sliding Window technique involves creating a "window" that slides through array/string 
data to track a subset of elements. The window can grow or shrink in size depending on 
the problem constraints.

Applications:
- Finding subarrays/substrings with certain properties
- Maximum/minimum sum subarrays of fixed size
- Longest/shortest substring with certain properties
- String pattern matching problems

Time Complexity: Usually O(n) - linear time
Space Complexity: Usually O(1) or O(k) where k is the window size or alphabet size

Example 1: Maximum Sum Subarray of Size K
*/

function maxSubarraySum(arr, k) {
  if (arr.length < k) return null;

  let maxSum = 0;
  let currentSum = 0;

  // Calculate sum of first window
  for (let i = 0; i < k; i++) {
    currentSum += arr[i];
  }
  maxSum = currentSum;

  // Slide the window and update maxSum
  for (let i = k; i < arr.length; i++) {
    // Add the new element and remove the element leaving the window
    currentSum = currentSum + arr[i] - arr[i - k];
    maxSum = Math.max(maxSum, currentSum);
  }

  return maxSum;
}

/*
Example 2: Longest Substring Without Repeating Characters
*/

function lengthOfLongestSubstring(s) {
  const charMap = new Map();
  let maxLength = 0;
  let windowStart = 0;

  for (let windowEnd = 0; windowEnd < s.length; windowEnd++) {
    const rightChar = s[windowEnd];

    // If character is already in current window, shrink window
    if (charMap.has(rightChar)) {
      // Move window start to position after the first occurrence
      // of the current character, but not before current window start
      windowStart = Math.max(windowStart, charMap.get(rightChar) + 1);
    }

    // Add current character to the window
    charMap.set(rightChar, windowEnd);

    // Update max length
    maxLength = Math.max(maxLength, windowEnd - windowStart + 1);
  }

  return maxLength;
}

/*
When to Use:
- When problem involves subarrays or substrings
- When you need to find the longest/shortest/maximum/minimum subarray or substring
- When you need to calculate something over a running window of data
- When maintaining a set of elements in an ordered way
*/ 