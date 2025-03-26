# Big O Notation: Introduction

**Navigation:** [🏠 Home](../../README.md) > [📚 Big O Notation](../README.md) > [📖 Theory](./00-index.md) > Introduction

## What is Big O Notation?

Big O Notation is a mathematical notation used to describe the limiting behavior of a function when the input size grows towards infinity. In computer science, we use it to classify algorithms based on their time and space complexity.

The "O" stands for "Order of," which refers to the growth rate of an algorithm's runtime or memory usage as the input size increases.

## Formal Definition

For functions f(n) and g(n), we say that f(n) = O(g(n)) if there exist positive constants c and n₀ such that:

f(n) ≤ c × g(n) for all n ≥ n₀

This means that f(n) grows at most as fast as g(n) for sufficiently large input sizes.

## Simplification Rules

When calculating Big O complexity, we follow these simplification rules:

1. **Drop Constants**: O(2n) → O(n)
2. **Drop Lower-Order Terms**: O(n² + n) → O(n²)
3. **Focus on Dominant Terms**: In nested loops, the innermost loop dominates

---

**Navigation**
- [⬅️ Previous: Theory Index](./00-index.md)
- [⬆️ Up to Big O Overview](../README.md)
- [➡️ Next: Complexity Classes](./02-complexity-classes.md)