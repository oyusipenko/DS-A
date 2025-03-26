# Practical Examples and Optimization Tips

**Navigation:** [🏠 Home](../../README.md) > [📚 Big O Notation](../README.md) > [📖 Theory](./00-index.md) > Practical Examples

## Practical Examples

Let's analyze a real-world example step by step:

```javascript
function processUserData(users) {
  // Step 1: Filter active users
  const activeUsers = users.filter(user => user.active);  // O(n) time, O(n) space

  // Step 2: Group by role
  const usersByRole = {};  // O(k) space where k is number of roles
  for (const user of activeUsers) {  // O(n) time
    if (!usersByRole[user.role]) {
      usersByRole[user.role] = [];
    }
    usersByRole[user.role].push(user);  // O(1) operation
  }

  // Step 3: Calculate stats for each role
  const stats = {};  // O(k) space
  for (const role in usersByRole) {  // O(k) time
    const usersInRole = usersByRole[role];
    let totalAge = 0;

    for (const user of usersInRole) {  // O(n) time in worst case
      totalAge += user.age;
    }

    stats[role] = {
      count: usersInRole.length,
      averageAge: totalAge / usersInRole.length
    };
  }

  return stats;
}
```

Step-by-step analysis:
1. First filter: O(n) time, O(n) space
2. Grouping loop: O(n) time, O(k) additional space
3. Stats calculation: O(k) * O(n) = O(n) time in worst case
4. Total: O(n) time (all steps are O(n)) and O(n) space

## Common Patterns to Recognize

### Time Complexity Patterns

- **O(1)**: Direct access, simple calculations, fixed-size operations
- **O(log n)**: Divide and conquer, binary search, balanced tree operations
- **O(n)**: Linear scan, single loop through data
- **O(n log n)**: Efficient sorting (merge sort, quicksort average case)
- **O(n²)**: Nested loops, comparing all pairs
- **O(2ⁿ)**: Recursive solutions without memoization

### Space Complexity Patterns

- **O(1)**: Fixed variables, in-place algorithms
- **O(log n)**: Recursive divide and conquer with balanced splitting
- **O(n)**: Linear data structures, recursion with n depth
- **O(n²)**: Matrices, storing all pairs

## Practical Tips for Optimization

1. **Prefer hash maps** for lookups over arrays when appropriate
2. **Cache results** of expensive operations
3. **Avoid unnecessary nested loops** when possible
4. **Use efficient algorithms** for common operations (sorting, searching)
5. **Be mindful of hidden costs** in library functions
6. **Trade space for time** when memory is available
7. **Consider early termination** conditions for loops

## Practical Tips for Analysis

- **Visualize operations**: Draw out what happens at each step
- **Count iterations precisely**: Be careful with loop bounds
- **Watch for hidden operations**: String concatenation, object cloning
- **Identify reused computations**: Caching can change complexity
- **Analyze each part separately**: Then combine for the full algorithm

## Conclusion

Big O notation helps us reason about algorithm efficiency and make informed decisions about which approaches to use. As a web developer, you'll encounter scenarios with varying scale requirements, and understanding Big O will help you choose appropriate solutions for each context.

By following the structured approaches outlined in this guide, you can accurately determine the time and space complexity of any algorithm, enabling you to make informed decisions about efficiency and scalability in your code.

---

**Navigation**
- [⬅️ Previous: Analysis Techniques](./04-analysis-techniques.md)
- [⬆️ Up to Theory Index](./00-index.md)
- [➡️ Next: Data Structures Complexity](./06-data-structures-complexity.md)