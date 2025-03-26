/**
 * Big O Notation - Exercise Solutions
 *
 * This file contains runnable implementations of solutions to the exercises
 * in exercises.md, with explanations of time and space complexity.
 *
 * Run with: node exercise-solutions.js
 */

// Utility function to measure execution time
function measureTime(fn, ...args) {
  const start = process.hrtime();
  const result = fn(...args);
  const [seconds, nanoseconds] = process.hrtime(start);
  const milliseconds = (seconds * 1000) + (nanoseconds / 1000000);
  return { result, time: milliseconds.toFixed(3) };
}

console.log("====== BIG O NOTATION EXERCISE SOLUTIONS ======\n");

// Exercise 1: Analyze Time Complexity
console.log("===== EXERCISE 1: ANALYZE TIME COMPLEXITY =====\n");

// Function 1: O(n) - Linear Time
function sumArray(arr) {
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i];
  }
  return sum;
}

console.log("Function 1: sumArray");
console.log("Time Complexity: O(n) - Linear Time");
console.log("Explanation: This function iterates through each element of the array exactly once.");
console.log("The number of operations grows linearly with the size of the input array.\n");

// Test with different array sizes
console.log("Testing with different array sizes:");
[10, 100, 1000, 10000].forEach(size => {
  const testArray = Array.from({ length: size }, () => Math.floor(Math.random() * 100));
  const { time } = measureTime(sumArray, testArray);
  console.log(`Array size ${size}: ${time}ms`);
});
console.log("");

// Function 2: O(n²) - Quadratic Time
function nestedForLoop(n) {
  let count = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      count++;
    }
  }
  return count;
}

console.log("Function 2: nestedForLoop");
console.log("Time Complexity: O(n²) - Quadratic Time");
console.log("Explanation: This function has two nested loops, each running n times.");
console.log("The inner operation (count++) executes n * n = n² times.\n");

// Test with different values of n
console.log("Testing with different values of n:");
[10, 100, 500, 1000].forEach(n => {
  const { time } = measureTime(nestedForLoop, n);
  console.log(`n = ${n}: ${time}ms`);
});
console.log("");

// Function 3: O(n²) - Quadratic Time
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

console.log("Function 3: findDuplicate");
console.log("Time Complexity: O(n²) - Quadratic Time");
console.log("Explanation: This function has nested loops. The outer loop runs n times, and for each iteration,");
console.log("the inner loop runs n-i-1 times. In the worst case (no duplicates found), this approaches n² operations.\n");

// Test with different array sizes
console.log("Testing with different array sizes (arrays with no duplicates - worst case):");
[10, 100, 500, 1000].forEach(size => {
  const testArray = Array.from({ length: size }, (_, i) => i); // Unique elements
  const { time } = measureTime(findDuplicate, testArray);
  console.log(`Array size ${size}: ${time}ms`);
});
console.log("");

// Function 4: O(n) - Linear Time
function recursiveSum(n) {
  if (n <= 0) {
    return 0;
  }
  return n + recursiveSum(n - 1);
}

console.log("Function 4: recursiveSum");
console.log("Time Complexity: O(n) - Linear Time");
console.log("Explanation: This recursive function makes n recursive calls (from n down to 1)");
console.log("with each call doing constant-time work. The recursion depth is n.\n");

// Test with different values of n
console.log("Testing with different values of n:");
[10, 100, 500, 1000].forEach(n => {
  try {
    const { time } = measureTime(recursiveSum, n);
    console.log(`n = ${n}: ${time}ms`);
  } catch (e) {
    console.log(`n = ${n}: Stack overflow (recursion too deep)`);
  }
});
console.log("");

// Function 5: O(log n) - Logarithmic Time
function logarithmicExample(n) {
  let i = n;
  let count = 0;
  while (i > 0) {
    count += i;
    i = Math.floor(i / 2);
  }
  return count;
}

console.log("Function 5: logarithmicExample");
console.log("Time Complexity: O(log n) - Logarithmic Time");
console.log("Explanation: In each iteration, i is divided by 2. Starting from n, the values of i follow:");
console.log("n, n/2, n/4, n/8, ..., 1. The number of iterations to reach 0 is log₂(n).\n");

// Test with different values of n
console.log("Testing with different values of n:");
[10, 100, 1000, 10000, 100000, 1000000].forEach(n => {
  const { time } = measureTime(logarithmicExample, n);
  console.log(`n = ${n}: ${time}ms`);
});
console.log("");

// Exercise 3: Optimize Code
console.log("===== EXERCISE 3: OPTIMIZE CODE =====\n");

// Function 1: Finding if an array contains a specific value

// Original: O(n) time
function containsValue(arr, value) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === value) {
      return true;
    }
  }
  return false;
}

// Optimized: O(1) time after O(n) setup
function optimizedContainsValue(arr, value) {
  // Use built-in method for cleaner code
  return arr.includes(value);
}

// Further optimized for multiple lookups
function createLookupSet(arr) {
  return new Set(arr);
}

function containsValueInSet(set, value) {
  return set.has(value);
}

console.log("Function 1: containsValue");
console.log("Original Time Complexity: O(n)");
console.log("Optimized with Set Time Complexity: O(1) lookup after O(n) setup");

// Test with a large array and multiple lookups
const largeArray = Array.from({ length: 100000 }, (_, i) => i);
const targetValue = 99999; // Worst case for linear search
const lookupSet = createLookupSet(largeArray);

console.log("\nSingle lookup comparison:");
console.log(`Original method: ${measureTime(containsValue, largeArray, targetValue).time}ms`);
console.log(`Optimized method: ${measureTime(optimizedContainsValue, largeArray, targetValue).time}ms`);

console.log("\nMultiple lookups comparison (10 lookups):");
const start1 = process.hrtime();
for (let i = 0; i < 10; i++) {
  containsValue(largeArray, targetValue);
}
const [s1, ns1] = process.hrtime(start1);
const time1 = (s1 * 1000 + ns1 / 1000000).toFixed(3);

const start2 = process.hrtime();
for (let i = 0; i < 10; i++) {
  containsValueInSet(lookupSet, targetValue);
}
const [s2, ns2] = process.hrtime(start2);
const time2 = (s2 * 1000 + ns2 / 1000000).toFixed(3);

console.log(`Original method (10 searches): ${time1}ms`);
console.log(`Set-based method (10 searches): ${time2}ms`);
console.log(`Speedup: ${(parseFloat(time1) / parseFloat(time2)).toFixed(1)}x\n`);

// Function 2: Finding duplicate values in an array

// Original: O(n²) time
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

// Optimized: O(n) time
function hasDuplicatesOptimized(arr) {
  const seen = new Set();

  for (const item of arr) {
    if (seen.has(item)) {
      return true;
    }
    seen.add(item);
  }

  return false;
}

console.log("Function 2: hasDuplicates");
console.log("Original Time Complexity: O(n²)");
console.log("Optimized Time Complexity: O(n)");

// Test with different array sizes
console.log("\nSize comparison (arrays with no duplicates - worst case):");
[10, 100, 1000].forEach(size => {
  const testArray = Array.from({ length: size }, (_, i) => i); // Unique elements

  const { time: originalTime } = measureTime(hasDuplicates, testArray);
  const { time: optimizedTime } = measureTime(hasDuplicatesOptimized, testArray);

  console.log(`Array size ${size}:`);
  console.log(`  Original: ${originalTime}ms`);
  console.log(`  Optimized: ${optimizedTime}ms`);

  if (parseFloat(originalTime) > 0 && parseFloat(optimizedTime) > 0) {
    console.log(`  Speedup: ${(parseFloat(originalTime) / parseFloat(optimizedTime)).toFixed(1)}x`);
  }
});
console.log("");

// Function 3: Calculating nth Fibonacci number

// Original: O(2ⁿ) time
function fibonacci(n) {
  if (n <= 1) {
    return n;
  }
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// Optimized (memoization): O(n) time, O(n) space
function fibonacciMemoized(n, memo = {}) {
  if (n <= 1) {
    return n;
  }

  if (memo[n]) {
    return memo[n];
  }

  memo[n] = fibonacciMemoized(n - 1, memo) + fibonacciMemoized(n - 2, memo);
  return memo[n];
}

// Optimized (iterative): O(n) time, O(1) space
function fibonacciIterative(n) {
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

console.log("Function 3: fibonacci");
console.log("Original Time Complexity: O(2ⁿ) - Exponential Time");
console.log("Memoized Time Complexity: O(n) - Linear Time with O(n) Space");
console.log("Iterative Time Complexity: O(n) - Linear Time with O(1) Space");

// Test with different values of n
console.log("\nComparison for different values of n:");
[10, 20, 30, 40].forEach(n => {
  console.log(`n = ${n}:`);

  if (n <= 20) { // Original algorithm becomes too slow beyond this point
    try {
      const { time: originalTime, result: originalResult } = measureTime(fibonacci, n);
      console.log(`  Original: ${originalTime}ms (result: ${originalResult})`);
    } catch (e) {
      console.log(`  Original: Too slow or stack overflow`);
    }
  } else {
    console.log(`  Original: Too slow to run`);
  }

  const { time: memoizedTime, result: memoizedResult } = measureTime(fibonacciMemoized, n);
  console.log(`  Memoized: ${memoizedTime}ms (result: ${memoizedResult})`);

  const { time: iterativeTime, result: iterativeResult } = measureTime(fibonacciIterative, n);
  console.log(`  Iterative: ${iterativeTime}ms (result: ${iterativeResult})`);
});

console.log("\n===== EXERCISE 5: ALGORITHM DESIGN =====\n");

// Problem 1: Find the intersection of two arrays
console.log("Problem 1: Find the intersection of two arrays");

function intersection(arr1, arr2) {
  const set1 = new Set(arr1);
  return arr2.filter(item => set1.has(item));
}

console.log("Time Complexity: O(n + m) where n and m are the lengths of the arrays");
console.log("Space Complexity: O(n + result)");
console.log("Explanation: Creating the Set is O(n), and filtering the second array is O(m) with O(1) lookups");

// Test with sample arrays
const array1 = [1, 2, 3, 4, 5];
const array2 = [3, 4, 5, 6, 7];
console.log(`\nArray 1: [${array1}]`);
console.log(`Array 2: [${array2}]`);
console.log(`Intersection: [${intersection(array1, array2)}]\n`);

// Problem 2: Check if a string is a palindrome
console.log("Problem 2: Check if a string is a palindrome");

function isPalindrome(str) {
  // Remove non-alphanumeric characters and convert to lowercase
  const cleanStr = str.toLowerCase().replace(/[^a-z0-9]/g, '');

  // Compare with reversed string
  return cleanStr === cleanStr.split('').reverse().join('');
}

// Optimized solution with less space
function isPalindromeOptimized(str) {
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

console.log("Solution 1 Time Complexity: O(n)");
console.log("Solution 1 Space Complexity: O(n)");
console.log("Solution 2 Time Complexity: O(n)");
console.log("Solution 2 Space Complexity: O(n) - still need the cleaned string, but no reversed copy");

// Test with sample strings
const testStrings = [
  "racecar",
  "A man, a plan, a canal, Panama!",
  "hello",
  "Was it a car or a cat I saw?"
];

testStrings.forEach(str => {
  console.log(`\nString: "${str}"`);
  console.log(`Is Palindrome (Solution 1): ${isPalindrome(str)}`);
  console.log(`Is Palindrome (Solution 2): ${isPalindromeOptimized(str)}`);
});
console.log("");

// Problem 3: Find the first non-repeating character in a string
console.log("Problem 3: Find the first non-repeating character in a string");

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

console.log("Time Complexity: O(n) where n is the string length");
console.log("Space Complexity: O(k) where k is the size of the character set");
console.log("Explanation: We make two passes through the string, and store counts for each character");

// Test with sample strings
const testStringsForNonRepeating = [
  "leetcode",
  "loveleetcode",
  "aabb"
];

testStringsForNonRepeating.forEach(str => {
  console.log(`\nString: "${str}"`);
  console.log(`First non-repeating character: "${firstNonRepeatingChar(str) || 'None found'}"`);
});
console.log("");

// Problem 4: Merge two sorted arrays into a single sorted array
console.log("Problem 4: Merge two sorted arrays into a single sorted array");

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

console.log("Time Complexity: O(n + m) where n and m are the lengths of the arrays");
console.log("Space Complexity: O(n + m)");
console.log("Explanation: We process each element exactly once, and store all elements in the result array");

// Test with sample arrays
const sortedArray1 = [1, 3, 5, 7, 9];
const sortedArray2 = [2, 4, 6, 8, 10];
console.log(`\nSorted Array 1: [${sortedArray1}]`);
console.log(`Sorted Array 2: [${sortedArray2}]`);
console.log(`Merged Result: [${mergeSortedArrays(sortedArray1, sortedArray2)}]\n`);

// Problem 5: Implement a function to determine if a string has all unique characters
console.log("Problem 5: Implement a function to determine if a string has all unique characters");

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

console.log("Time Complexity: O(n) where n is the string length");
console.log("Space Complexity: O(k) where k is the size of the character set");
console.log("Explanation: We process each character once with O(1) operations");

// Test with sample strings
const testStringsForUnique = [
  "abcdefg",
  "hello",
  "algorithm",
  "unique"
];

testStringsForUnique.forEach(str => {
  console.log(`\nString: "${str}"`);
  console.log(`Has all unique characters: ${hasAllUniqueChars(str)}`);
});

console.log("\n====== END OF EXERCISE SOLUTIONS ======");