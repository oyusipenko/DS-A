/*
BIT MANIPULATION PATTERN

Concept:
Bit manipulation involves directly manipulating the bits of a digital system using
bitwise operations. It utilizes binary representation of numbers to perform operations
at the bit level, which can be much faster than higher-level operations.

Common Bitwise Operators:
- & (AND): Sets each bit to 1 if both bits are 1
- | (OR): Sets each bit to 1 if at least one bit is 1
- ^ (XOR): Sets each bit to 1 if only one bit is 1
- ~ (NOT): Inverts all the bits
- << (Left Shift): Shifts bits left, multiplying by 2
- >> (Right Shift): Shifts bits right, dividing by 2

Applications:
- Optimizing space and performance
- Graphics programming
- Cryptography
- Embedded systems
- Network programming
- Low-level memory manipulation

Time Complexity: Usually O(1) for simple operations
Space Complexity: Usually O(1)

Example 1: Basic Bit Operations
*/

// Check if a number is even or odd
function isEven(n) {
  return (n & 1) === 0;
}

// Get the nth bit of a number
function getBit(num, n) {
  return (num & (1 << n)) !== 0;
}

// Set the nth bit of a number
function setBit(num, n) {
  return num | (1 << n);
}

// Clear the nth bit of a number
function clearBit(num, n) {
  return num & ~(1 << n);
}

// Toggle the nth bit of a number
function toggleBit(num, n) {
  return num ^ (1 << n);
}

/*
Example 2: Counting Bits
*/

// Count number of set bits (1s) in an integer
function countSetBits(num) {
  let count = 0;
  while (num > 0) {
    count += (num & 1);
    num >>>= 1; // Unsigned right shift
  }
  return count;
}

// Brian Kernighan's Algorithm (more efficient)
function countSetBitsOptimized(num) {
  let count = 0;
  while (num > 0) {
    num &= (num - 1); // Clear the least significant set bit
    count++;
  }
  return count;
}

/*
Example 3: Power of Two
*/

// Check if a number is a power of 2
function isPowerOfTwo(n) {
  if (n <= 0) return false;
  return (n & (n - 1)) === 0;
}

/*
Example 4: Finding Single Number
*/

// Find the single number in an array where all other elements appear twice
function singleNumber(nums) {
  let result = 0;
  for (const num of nums) {
    result ^= num; // XOR eliminates duplicates
  }
  return result;
}

/*
Example 5: Bitwise Tricks
*/

// Compute absolute value
function abs(n) {
  const mask = n >> 31; // All 1s if negative, all 0s if positive
  return (n + mask) ^ mask;
}

// Swap two numbers without a temp variable
function swap(a, b) {
  a = a ^ b;
  b = a ^ b;
  a = a ^ b;
  return [a, b];
}

// Multiply by 2^n
function multiplyBy2ToTheN(num, n) {
  return num << n;
}

// Divide by 2^n
function divideBy2ToTheN(num, n) {
  return num >> n;
}

/*
When to Use:
- When optimizing for performance or memory usage
- When working with low-level systems programming
- For mathematical operations that can be simplified with bit manipulation
- When setting/checking/toggling individual flags or options
- In problems involving binary representation directly
- When working with embedded systems or limited resources
*/ 