/*
DYNAMIC PROGRAMMING PATTERN

Concept:
Dynamic Programming (DP) is a technique that solves complex problems by breaking them down into 
simpler subproblems, solving each subproblem once, and storing the solutions to avoid redundant 
computations (memoization).

Key Components:
1. Optimal Substructure: Optimal solution can be constructed from optimal solutions of subproblems
2. Overlapping Subproblems: Same subproblems are solved multiple times

Approaches:
1. Top-Down (Memoization): Recursive approach with caching
2. Bottom-Up (Tabulation): Iterative approach building from simplest cases

Applications:
- Optimization problems
- Counting problems
- Shortest/longest path problems
- Sequence alignment
- Resource allocation

Time Complexity: Usually O(n²) or O(n*m) where n, m are problem size
Space Complexity: Usually O(n) or O(n*m) for storing solutions

Example 1: Fibonacci Numbers (Classic DP Example)
*/

// Top-Down Approach (Memoization)
function fibMemo(n) {
  const memo = {};

  function fib(n) {
    if (n <= 1) return n;

    // Return cached result if available
    if (memo[n] !== undefined) return memo[n];

    // Calculate and cache result
    memo[n] = fib(n - 1) + fib(n - 2);
    return memo[n];
  }

  return fib(n);
}

// Bottom-Up Approach (Tabulation)
function fibTab(n) {
  if (n <= 1) return n;

  const dp = new Array(n + 1);
  dp[0] = 0;
  dp[1] = 1;

  for (let i = 2; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2];
  }

  return dp[n];
}

// Space-Optimized Bottom-Up
function fibOptimized(n) {
  if (n <= 1) return n;

  let prev2 = 0;
  let prev1 = 1;
  let current;

  for (let i = 2; i <= n; i++) {
    current = prev1 + prev2;
    prev2 = prev1;
    prev1 = current;
  }

  return prev1;
}

/*
Example 2: Longest Increasing Subsequence (LIS)
*/

function lengthOfLIS(nums) {
  if (nums.length === 0) return 0;

  const n = nums.length;
  const dp = new Array(n).fill(1); // Each element is at least a subsequence of length 1

  for (let i = 1; i < n; i++) {
    for (let j = 0; j < i; j++) {
      if (nums[i] > nums[j]) {
        dp[i] = Math.max(dp[i], dp[j] + 1);
      }
    }
  }

  return Math.max(...dp);
}

/*
Example 3: 0/1 Knapsack Problem
*/

function knapsack(values, weights, capacity) {
  const n = values.length;

  // Create DP table
  const dp = Array(n + 1).fill().map(() => Array(capacity + 1).fill(0));

  // Build table bottom-up
  for (let i = 1; i <= n; i++) {
    for (let w = 0; w <= capacity; w++) {
      if (weights[i - 1] <= w) {
        // Max of: (1) including current item, (2) excluding current item
        dp[i][w] = Math.max(
          values[i - 1] + dp[i - 1][w - weights[i - 1]],
          dp[i - 1][w]
        );
      } else {
        // Can't include current item due to weight constraint
        dp[i][w] = dp[i - 1][w];
      }
    }
  }

  return dp[n][capacity];
}

/*
When to Use:
- When a problem asks for optimization (max/min/longest/shortest)
- When counting total ways/combinations to do something
- When future decisions depend on earlier decisions
- When you see overlapping subproblems (redundant calculations)
- When you can express the solution in terms of smaller subproblems
*/ 