/*
TREE ALGORITHMS PATTERNS

Concept:
Trees are hierarchical data structures consisting of nodes connected by edges with a single root node.
Tree algorithms are specialized for traversing, searching, and manipulating tree structures efficiently.

Common Tree Types:
1. Binary Tree: Each node has at most two children
2. Binary Search Tree (BST): Left child < parent < right child
3. Balanced Trees: AVL, Red-Black Trees (self-balancing BSTs)
4. N-ary Tree: Each node can have more than two children
5. Trie: Tree for storing strings with shared prefixes

Key Tree Operations and Algorithms:

1. TRAVERSAL TECHNIQUES
   - Inorder (Left, Root, Right): Visit nodes in ascending order in a BST
   - Preorder (Root, Left, Right): Used to create a copy of the tree or prefix expression
   - Postorder (Left, Right, Root): Used to delete the tree or postfix expression
   - Level Order: Process all nodes at each level before moving to next level (BFS)

2. SEARCH OPERATIONS
   - Finding a node
   - Finding minimum/maximum value
   - Finding successor/predecessor
   - Lowest Common Ancestor (LCA)

3. MODIFICATION OPERATIONS
   - Insertion
   - Deletion
   - Balancing

Time Complexity: Usually O(h) where h is the height of the tree
                 O(log n) for balanced trees, O(n) for skewed trees
Space Complexity: O(h) for recursion stack, O(n) for storing all nodes

Example 1: Tree Traversals
*/

class TreeNode {
  constructor(val) {
    this.val = val;
    this.left = null;
    this.right = null;
  }
}

// Inorder Traversal (Left, Root, Right)
function inorderTraversal(root) {
  const result = [];

  function traverse(node) {
    if (node === null) return;

    traverse(node.left);
    result.push(node.val);
    traverse(node.right);
  }

  traverse(root);
  return result;
}

// Preorder Traversal (Root, Left, Right)
function preorderTraversal(root) {
  const result = [];

  function traverse(node) {
    if (node === null) return;

    result.push(node.val);
    traverse(node.left);
    traverse(node.right);
  }

  traverse(root);
  return result;
}

// Postorder Traversal (Left, Right, Root)
function postorderTraversal(root) {
  const result = [];

  function traverse(node) {
    if (node === null) return;

    traverse(node.left);
    traverse(node.right);
    result.push(node.val);
  }

  traverse(root);
  return result;
}

// Level Order Traversal (BFS)
function levelOrderTraversal(root) {
  if (!root) return [];

  const result = [];
  const queue = [root];

  while (queue.length > 0) {
    const levelSize = queue.length;
    const currentLevel = [];

    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift();
      currentLevel.push(node.val);

      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }

    result.push(currentLevel);
  }

  return result;
}

/*
Example 2: Binary Search Tree Operations
*/

// BST Search
function searchBST(root, val) {
  if (!root || root.val === val) return root;

  if (val < root.val) {
    return searchBST(root.left, val);
  } else {
    return searchBST(root.right, val);
  }
}

// BST Insertion
function insertIntoBST(root, val) {
  if (!root) return new TreeNode(val);

  if (val < root.val) {
    root.left = insertIntoBST(root.left, val);
  } else {
    root.right = insertIntoBST(root.right, val);
  }

  return root;
}

// Find minimum value in BST
function findMin(root) {
  if (!root) return null;

  let current = root;
  while (current.left) {
    current = current.left;
  }

  return current.val;
}

/*
Example 3: Lowest Common Ancestor (LCA)
*/

function lowestCommonAncestor(root, p, q) {
  // Base case
  if (!root || root === p || root === q) return root;

  // Look for p and q in left and right subtrees
  const left = lowestCommonAncestor(root.left, p, q);
  const right = lowestCommonAncestor(root.right, p, q);

  // If both left and right are not null, root is the LCA
  if (left && right) return root;

  // Otherwise, LCA is in either left or right subtree
  return left || right;
}

/*
Example 4: Check if Tree is Balanced
*/

function isBalanced(root) {
  // Return -1 for unbalanced subtree, height otherwise
  function checkHeight(node) {
    if (!node) return 0;

    const leftHeight = checkHeight(node.left);
    if (leftHeight === -1) return -1;

    const rightHeight = checkHeight(node.right);
    if (rightHeight === -1) return -1;

    // Check if current node is balanced
    if (Math.abs(leftHeight - rightHeight) > 1) return -1;

    // Return height of current subtree
    return Math.max(leftHeight, rightHeight) + 1;
  }

  return checkHeight(root) !== -1;
}

/*
When to Use:
- BST: When you need ordered data with fast search, insert, delete operations
- Tree Traversals: When you need to visit all nodes in a specific order
- BFS/Level Order: When you need to process nodes level by level
- DFS: When you need to search deeply before backtracking
- Balanced Trees: When you need guaranteed O(log n) operations
*/ 