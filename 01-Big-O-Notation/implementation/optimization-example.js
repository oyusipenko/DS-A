/**
 * Big O Notation - Optimization Examples
 *
 * This script demonstrates optimizing algorithms by comparing
 * inefficient vs. optimized implementations of the same problems.
 *
 * Run with: node optimization-example.js
 */

// Utility function to measure execution time
function measureTime(fn, ...args) {
  const start = process.hrtime();
  const result = fn(...args);
  const [seconds, nanoseconds] = process.hrtime(start);
  const milliseconds = (seconds * 1000) + (nanoseconds / 1000000);
  return { result, time: milliseconds.toFixed(3) };
}

// Generate test data
function generateTestData(size) {
  return Array.from({ length: size }, () => Math.floor(Math.random() * size * 10));
}

// Test with various input sizes
const INPUT_SIZES = [10, 100, 1000, 10000];

console.log("====== ALGORITHM OPTIMIZATION EXAMPLES ======\n");

// ========================
// Example 1: Finding duplicates in an array
// ========================
console.log("EXAMPLE 1: FINDING DUPLICATES IN ARRAY");

// Inefficient solution: O(n²) time
function findDuplicatesInefficient(arr) {
  const duplicates = [];

  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] === arr[j] && !duplicates.includes(arr[i])) {
        duplicates.push(arr[i]);
      }
    }
  }

  return duplicates;
}

// Optimized solution: O(n) time
function findDuplicatesOptimized(arr) {
  const seen = new Set();
  const duplicates = new Set();

  for (const num of arr) {
    if (seen.has(num)) {
      duplicates.add(num);
    } else {
      seen.add(num);
    }
  }

  return Array.from(duplicates);
}

console.log("\nComparison of duplicate finding algorithms:");
console.log("------------------------------------------");
console.log("| Input Size | Inefficient (ms) | Optimized (ms) | Speedup |");
console.log("|------------|------------------|---------------|---------|");

for (const size of INPUT_SIZES.slice(0, 3)) { // Skip largest for inefficient version
  // Create array with some duplicates
  const testArray = generateTestData(size);
  // Add duplicates
  for (let i = 0; i < size * 0.1; i++) {
    const randomIndex = Math.floor(Math.random() * size);
    testArray.push(testArray[randomIndex]);
  }

  const { time: inefficientTime } = measureTime(findDuplicatesInefficient, testArray);
  const { time: optimizedTime } = measureTime(findDuplicatesOptimized, testArray);

  const speedup = (parseFloat(inefficientTime) / parseFloat(optimizedTime)).toFixed(1);

  console.log(`| ${size.toString().padEnd(10)} | ${inefficientTime.padEnd(16)} | ${optimizedTime.padEnd(13)} | ${speedup}x    |`);
}

// Test largest size only with optimized version
const largeArray = generateTestData(INPUT_SIZES[3]);
// Add duplicates
for (let i = 0; i < INPUT_SIZES[3] * 0.1; i++) {
  const randomIndex = Math.floor(Math.random() * INPUT_SIZES[3]);
  largeArray.push(largeArray[randomIndex]);
}

console.log(`| ${INPUT_SIZES[3].toString().padEnd(10)} | Too slow        | ${measureTime(findDuplicatesOptimized, largeArray).time.padEnd(13)} | N/A     |`);
console.log("------------------------------------------");
console.log("Explanation: The inefficient algorithm uses nested loops (O(n²)), while the optimized version uses a Set for O(1) lookups, resulting in O(n) time complexity.\n");

// ========================
// Example 2: Fibonacci Sequence
// ========================
console.log("\nEXAMPLE 2: FIBONACCI SEQUENCE");

// Inefficient recursive solution: O(2ⁿ) time
function fibonacciRecursive(n) {
  if (n <= 1) return n;
  return fibonacciRecursive(n - 1) + fibonacciRecursive(n - 2);
}

// Optimized memoized solution: O(n) time
function fibonacciMemoized(n, memo = {}) {
  if (n <= 1) return n;
  if (memo[n]) return memo[n];

  memo[n] = fibonacciMemoized(n - 1, memo) + fibonacciMemoized(n - 2, memo);
  return memo[n];
}

// Optimized iterative solution: O(n) time and O(1) space
function fibonacciIterative(n) {
  if (n <= 1) return n;

  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) {
    const temp = a + b;
    a = b;
    b = temp;
  }

  return b;
}

console.log("\nComparison of Fibonacci algorithms:");
console.log("------------------------------------------");
console.log("| n  | Recursive (ms) | Memoized (ms) | Iterative (ms) |");
console.log("|-----|----------------|---------------|----------------|");

for (const n of [10, 20, 30, 40]) {
  let recursiveTime = "N/A";
  if (n <= 20) { // Only test recursive for small n
    const { time } = measureTime(fibonacciRecursive, n);
    recursiveTime = time;
  }

  const { time: memoizedTime } = measureTime(fibonacciMemoized, n);
  const { time: iterativeTime } = measureTime(fibonacciIterative, n);

  console.log(`| ${n.toString().padEnd(3)} | ${recursiveTime.padEnd(14)} | ${memoizedTime.padEnd(13)} | ${iterativeTime.padEnd(14)} |`);
}
console.log("------------------------------------------");
console.log("Explanation:");
console.log("1. The recursive solution has O(2ⁿ) time complexity, making it impractical for n > 30");
console.log("2. Memoization optimizes the recursive solution to O(n) time complexity but uses O(n) space");
console.log("3. The iterative solution maintains O(n) time complexity but reduces space complexity to O(1)\n");

// ========================
// Example 3: Searching in a sorted array
// ========================
console.log("\nEXAMPLE 3: SEARCHING IN SORTED ARRAYS");

// Linear search: O(n) time
function linearSearch(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) return i;
  }
  return -1;
}

// Binary search: O(log n) time
function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }

  return -1;
}

console.log("\nComparison of search algorithms on sorted arrays:");
console.log("------------------------------------------");
console.log("| Array Size | Linear (ms) | Binary (ms) | Speed Ratio |");
console.log("|------------|-------------|-------------|-------------|");

for (const size of INPUT_SIZES) {
  const sortedArray = Array.from({ length: size }, (_, i) => i * 2); // Even numbers
  const target = size * 2 - 2; // Search for last element

  const { time: linearTime } = measureTime(linearSearch, sortedArray, target);
  const { time: binaryTime } = measureTime(binarySearch, sortedArray, target);

  const speedup = (parseFloat(linearTime) / parseFloat(binaryTime)).toFixed(1);

  console.log(`| ${size.toString().padEnd(10)} | ${linearTime.padEnd(11)} | ${binaryTime.padEnd(11)} | ${speedup}x        |`);
}
console.log("------------------------------------------");
console.log("Explanation: As the array size increases, binary search (O(log n)) becomes dramatically faster than linear search (O(n)). Note how the speed ratio increases with larger inputs.\n");

console.log("\n====== CONCLUSION ======");
console.log("These examples demonstrate how algorithmic optimization can lead to substantial performance improvements.");
console.log("Key takeaways:");
console.log("1. The impact of efficiency becomes more pronounced as input sizes grow");
console.log("2. Space-time tradeoffs (like memoization) can be worthwhile for performance-critical operations");
console.log("3. Choosing the right algorithm based on input characteristics (like using binary search for sorted data) is essential");
console.log("4. Big O notation helps us predict and compare algorithm performance at scale\n");