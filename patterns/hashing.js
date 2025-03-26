/*
HASHING PATTERN

Concept:
Hashing uses data structures like hash tables (maps, dictionaries) to store and 
retrieve data efficiently. It maps keys to values, allowing for O(1) average-case 
lookup, insertion, and deletion.

Applications:
- Counting frequency of elements
- Finding duplicates
- Storing and retrieving data by key
- Implementing caches
- Checking if a value exists in a collection
- Finding pairs/combinations with specific properties

Time Complexity: 
- Average: O(1) for lookup, insertion, deletion
- Worst: O(n) in case of hash collisions

Space Complexity: O(n) for storing n elements

Example 1: Two Sum - Find indices of two numbers that add up to target
*/

function twoSum(nums, target) {
  const map = new Map(); // value -> index

  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];

    if (map.has(complement)) {
      return [map.get(complement), i];
    }

    map.set(nums[i], i);
  }

  return [-1, -1]; // No solution found
}

/*
Example 2: Count frequency of elements
*/

function countElements(arr) {
  const frequencyMap = new Map();

  // Count occurrences
  for (const num of arr) {
    frequencyMap.set(num, (frequencyMap.get(num) || 0) + 1);
  }

  return frequencyMap;
}

/*
Example 3: Group Anagrams
*/

function groupAnagrams(strs) {
  const map = new Map();

  for (const str of strs) {
    // Create a character frequency key
    const charCount = new Array(26).fill(0);

    for (const char of str) {
      const index = char.charCodeAt(0) - 'a'.charCodeAt(0);
      charCount[index]++;
    }

    const key = charCount.join('#');

    if (!map.has(key)) {
      map.set(key, []);
    }

    map.get(key).push(str);
  }

  return Array.from(map.values());
}

/*
When to Use:
- When you need fast lookups (O(1))
- When you need to count frequencies
- When you need to check for existence or find duplicates
- When you need to map keys to values
- When you're looking for pairs or combinations with specific properties
- When you need to implement a cache
*/ 