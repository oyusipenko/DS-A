/*
BACKTRACKING PATTERN

Concept:
Backtracking is an algorithmic technique for solving problems recursively by trying to build a solution 
incrementally, one piece at a time, removing those solutions that fail to satisfy the constraints of the 
problem at any point ("backtracking").

Applications:
- Combinatorial problems (permutations, combinations, subsets)
- Constraint satisfaction problems (N-Queens, Sudoku)
- Path finding (maze solving)
- Decision problems
- Game-playing AI (Chess, tic-tac-toe)

Time Complexity: Often O(b^d) where b is branching factor and d is maximum depth
Space Complexity: O(d) for recursion stack where d is maximum depth

Example 1: Generate All Subsets
*/

function subsets(nums) {
  const result = [];

  function backtrack(start, currentSubset) {
    // Add the current subset to result
    result.push([...currentSubset]);

    // Explore all possible next elements
    for (let i = start; i < nums.length; i++) {
      // Include current element
      currentSubset.push(nums[i]);

      // Recurse to next positions
      backtrack(i + 1, currentSubset);

      // Backtrack - remove the element to try next possibilities
      currentSubset.pop();
    }
  }

  backtrack(0, []);
  return result;
}

/*
Example 2: Generate All Permutations
*/

function permute(nums) {
  const result = [];

  function backtrack(current, remaining) {
    // Base case: if no more elements to permute
    if (remaining.length === 0) {
      result.push([...current]);
      return;
    }

    // Try each remaining element as the next item in permutation
    for (let i = 0; i < remaining.length; i++) {
      // Choose current element
      current.push(remaining[i]);

      // Remove chosen element from remaining
      const newRemaining = [...remaining.slice(0, i), ...remaining.slice(i + 1)];

      // Recurse
      backtrack(current, newRemaining);

      // Backtrack - remove the element
      current.pop();
    }
  }

  backtrack([], nums);
  return result;
}

/*
Example 3: N-Queens Problem
*/

function solveNQueens(n) {
  const result = [];

  // Initialize empty board
  const board = Array(n).fill().map(() => Array(n).fill('.'));

  function isValid(row, col) {
    // Check column
    for (let i = 0; i < row; i++) {
      if (board[i][col] === 'Q') return false;
    }

    // Check diagonal up-left
    for (let i = row - 1, j = col - 1; i >= 0 && j >= 0; i--, j--) {
      if (board[i][j] === 'Q') return false;
    }

    // Check diagonal up-right
    for (let i = row - 1, j = col + 1; i >= 0 && j < n; i--, j++) {
      if (board[i][j] === 'Q') return false;
    }

    return true;
  }

  function backtrack(row) {
    // Base case: all queens are placed
    if (row === n) {
      // Convert board to required format
      const solution = board.map(row => row.join(''));
      result.push(solution);
      return;
    }

    // Try placing queen in each column of current row
    for (let col = 0; col < n; col++) {
      if (isValid(row, col)) {
        // Place queen
        board[row][col] = 'Q';

        // Recurse to next row
        backtrack(row + 1);

        // Backtrack - remove queen
        board[row][col] = '.';
      }
    }
  }

  backtrack(0);
  return result;
}

/*
When to Use:
- When you need to find all (or some) solutions to a problem
- When solving constraint satisfaction problems
- When the problem can be solved by making a sequence of decisions
- When you need to explore all possible solutions/combinations
- When a problem requires finding a path from start to goal
*/ 