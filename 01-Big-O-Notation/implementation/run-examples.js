/**
 * Run Big O Notation Examples
 *
 * This script demonstrates the various time and space complexity examples
 * with sample data and console output for easy learning.
 *
 * Run this file directly with Node.js:
 * node run-examples.js
 */

const {
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
} = require('./complexity-examples');

// Utility function to measure execution time
function measureTime(fn, ...args) {
  const start = process.hrtime();
  const result = fn(...args);
  const [seconds, nanoseconds] = process.hrtime(start);
  const milliseconds = (seconds * 1000) + (nanoseconds / 1000000);
  return { result, time: milliseconds.toFixed(3) };
}

// Create sample data
const smallArray = Array.from({ length: 10 }, (_, i) => i * 2);
const mediumArray = Array.from({ length: 100 }, (_, i) => i);
const largeArray = Array.from({ length: 1000 }, (_, i) => i);

// Random unordered arrays for sorting
const smallUnorderedArray = Array.from({ length: 10 }, () => Math.floor(Math.random() * 100));
const mediumUnorderedArray = Array.from({ length: 100 }, () => Math.floor(Math.random() * 1000));

console.log("====== BIG O NOTATION EXAMPLES ======");
console.log("These examples demonstrate various time and space complexities\n");

// O(1) - Constant Time
console.log("=== O(1) - Constant Time Operation ===");
console.log("Sample Array:", smallArray);
const constResult = constantTimeOperation(smallArray);
console.log("First element:", constResult);
console.log("Note: Access time remains constant regardless of array size\n");

// O(log n) - Logarithmic Time
console.log("=== O(log n) - Binary Search ===");
console.log("Searching for value 16 in array of length", smallArray.length);
let { result, time } = measureTime(binarySearch, smallArray, 16);
console.log(`Found at index: ${result} (took ${time}ms)`);

console.log("Searching for value 50 in array of length", mediumArray.length);
({ result, time } = measureTime(binarySearch, mediumArray, 50));
console.log(`Found at index: ${result} (took ${time}ms)`);

console.log("Searching for value 500 in array of length", largeArray.length);
({ result, time } = measureTime(binarySearch, largeArray, 500));
console.log(`Found at index: ${result} (took ${time}ms)`);
console.log("Note: Each time we multiply array size by 10, search time increases by much less\n");

// O(n) - Linear Time
console.log("=== O(n) - Linear Search ===");
console.log("Searching for value 16 in array of length", smallArray.length);
({ result, time } = measureTime(linearSearch, smallArray, 16));
console.log(`Found at index: ${result} (took ${time}ms)`);

console.log("Searching for value 50 in array of length", mediumArray.length);
({ result, time } = measureTime(linearSearch, mediumArray, 50));
console.log(`Found at index: ${result} (took ${time}ms)`);

console.log("Searching for value 500 in array of length", largeArray.length);
({ result, time } = measureTime(linearSearch, largeArray, 500));
console.log(`Found at index: ${result} (took ${time}ms)`);
console.log("Note: Time increases proportionally with array size\n");

// O(n log n) - Linearithmic Time
console.log("=== O(n log n) - Merge Sort ===");
console.log("Small unordered array:", smallUnorderedArray);
({ result, time } = measureTime(mergeSort, [...smallUnorderedArray]));
console.log(`Sorted result: ${result}`);
console.log(`Time taken for ${smallUnorderedArray.length} elements: ${time}ms`);

console.log(`Time taken for ${mediumUnorderedArray.length} elements: ${measureTime(mergeSort, [...mediumUnorderedArray]).time
  }ms`);
console.log("Note: n log n grows faster than n but slower than n²\n");

// O(n²) - Quadratic Time
console.log("=== O(n²) - Bubble Sort ===");
({ result, time } = measureTime(bubbleSort, [...smallUnorderedArray]));
console.log(`Sorted result of ${smallUnorderedArray.length} elements: ${result}`);
console.log(`Time taken: ${time}ms`);

console.log(`Time taken for ${mediumUnorderedArray.length} elements: ${measureTime(bubbleSort, [...mediumUnorderedArray]).time
  }ms`);
console.log("Note: Notice how much more bubble sort time increases as array size grows\n");

// O(2^n) - Exponential Time
console.log("=== O(2^n) - Fibonacci (naive recursive) ===");
for (let n of [5, 10, 15, 20, 25]) {
  try {
    ({ result, time } = measureTime(fibonacci, n));
    console.log(`Fibonacci(${n}) = ${result} (took ${time}ms)`);
  } catch (e) {
    console.log(`Fibonacci(${n}) - Too slow or caused stack overflow`);
  }
}
console.log("Note: Very quickly becomes impractical as n increases\n");

// O(n!) - Factorial Time
console.log("=== O(n!) - Generate Permutations ===");
for (let n = 1; n <= 8; n++) {
  const arr = Array.from({ length: n }, (_, i) => i + 1);
  try {
    ({ result, time } = measureTime(generatePermutations, [...arr]));
    console.log(`Permutations of ${n} elements: ${result.length} (took ${time}ms)`);
  } catch (e) {
    console.log(`Permutations of ${n} elements - Too slow or memory error`);
  }
}
console.log("Note: Grows extremely fast, practical only for very small inputs\n");

// Space Complexity Examples
console.log("=== Space Complexity Examples ===");

console.log("--- O(1) Space - Constant Space ---");
({ result } = measureTime(constantSpace, 1000));
console.log(`Sum of numbers 1 to 1000: ${result}`);
console.log("Uses constant extra space regardless of input size\n");

console.log("--- O(n) Space - Linear Space ---");
({ result } = measureTime(linearSpace, 10));
console.log(`Array with 10 elements: ${result}`);
console.log("Space used grows linearly with input\n");

console.log("--- O(n²) Space - Quadratic Space ---");
({ result } = measureTime(quadraticSpace, 3));
console.log(`3x3 Matrix: ${JSON.stringify(result)}`);
console.log("Space used grows quadratically with input\n");

console.log("====== END OF EXAMPLES ======");
console.log("You can modify this file to experiment with different inputs and see how performance scales.");