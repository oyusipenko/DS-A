# Common Complexity Classes

**Navigation:** [🏠 Home](../../README.md) > [📚 Big O Notation](../README.md) > [📖 Theory](./00-index.md) > Complexity Classes

## O(1) - Constant Time
Operations that execute in the same time regardless of input size.

```javascript
function getFirstElement(array) {
  return array[0]; // Always takes the same amount of time
}
```

## O(log n) - Logarithmic Time
Algorithms that divide the problem in half with each step.

```javascript
function binarySearch(sortedArray, target) {
  let left = 0;
  let right = sortedArray.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (sortedArray[mid] === target) {
      return mid;
    } else if (sortedArray[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return -1; // Not found
}
```

## O(n) - Linear Time
Runtime grows linearly with input size.

```javascript
function findMaximum(array) {
  let max = array[0];

  for (let i = 1; i < array.length; i++) {
    if (array[i] > max) {
      max = array[i];
    }
  }

  return max;
}
```

## O(n log n) - Linearithmic Time
Common in efficient sorting algorithms.

```javascript
function mergeSort(array) {
  if (array.length <= 1) {
    return array;
  }

  const middle = Math.floor(array.length / 2);
  const left = array.slice(0, middle);
  const right = array.slice(middle);

  return merge(mergeSort(left), mergeSort(right));
}

function merge(left, right) {
  let result = [];
  let leftIndex = 0;
  let rightIndex = 0;

  while (leftIndex < left.length && rightIndex < right.length) {
    if (left[leftIndex] < right[rightIndex]) {
      result.push(left[leftIndex]);
      leftIndex++;
    } else {
      result.push(right[rightIndex]);
      rightIndex++;
    }
  }

  return result.concat(left.slice(leftIndex)).concat(right.slice(rightIndex));
}
```

## O(n²) - Quadratic Time
Algorithms with nested iterations over the input.

```javascript
function bubbleSort(array) {
  for (let i = 0; i < array.length; i++) {
    for (let j = 0; j < array.length - i - 1; j++) {
      if (array[j] > array[j + 1]) {
        // Swap elements
        [array[j], array[j + 1]] = [array[j + 1], array[j]];
      }
    }
  }

  return array;
}
```

## O(2ⁿ) - Exponential Time
Often seen in recursive algorithms without memoization.

```javascript
function fibonacci(n) {
  if (n <= 1) {
    return n;
  }

  return fibonacci(n - 1) + fibonacci(n - 2);
}
```

---

**Navigation**
- [⬅️ Previous: Introduction](./01-introduction.md)
- [⬆️ Up to Theory Index](./00-index.md)
- [➡️ Next: Space Complexity](./03-space-complexity.md)