/*
TRIE DATA STRUCTURE PATTERN

Concept:
A Trie (pronounced "try") is a tree-like data structure used to store a dynamic set
of strings, where the keys are usually strings. Unlike a binary search tree, no node
in the tree stores the key associated with that node; instead, its position in the tree
defines the key with which it is associated. All the descendants of a node have a common
prefix of the string associated with that node.

Properties:
- Each node can have multiple children, one for each possible character
- Nodes typically store character values, though they may also store additional data
- The root usually represents an empty string
- Each path from root to a leaf or marked node represents a stored string

Applications:
- Autocomplete/Predictive text
- Spell checking
- IP routing (longest prefix matching)
- Dictionary implementation
- Word games

Time Complexity:
- Insert: O(m) where m is key length
- Search: O(m) where m is key length
- Delete: O(m) where m is key length
- Prefix search: O(p + n) where p is prefix length and n is number of matching words

Space Complexity: O(n*m) where n is number of keys and m is average key length

Example: Trie Implementation
*/

class TrieNode {
  constructor() {
    this.children = new Map(); // Character -> TrieNode
    this.isEndOfWord = false;
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  // Insert a word into the trie
  insert(word) {
    let current = this.root;

    for (const char of word) {
      if (!current.children.has(char)) {
        current.children.set(char, new TrieNode());
      }
      current = current.children.get(char);
    }

    current.isEndOfWord = true;
  }

  // Search for a word in the trie
  search(word) {
    let current = this.root;

    for (const char of word) {
      if (!current.children.has(char)) {
        return false;
      }
      current = current.children.get(char);
    }

    return current.isEndOfWord;
  }

  // Check if there is any word in the trie that starts with the given prefix
  startsWith(prefix) {
    let current = this.root;

    for (const char of prefix) {
      if (!current.children.has(char)) {
        return false;
      }
      current = current.children.get(char);
    }

    return true;
  }

  // Delete a word from the trie
  delete(word) {
    this._deleteHelper(this.root, word, 0);
  }

  _deleteHelper(current, word, index) {
    // Base case: end of word reached
    if (index === word.length) {
      // Mark as not end of word
      if (current.isEndOfWord) {
        current.isEndOfWord = false;
      }

      // Return true if this node can be deleted
      return current.children.size === 0;
    }

    const char = word[index];

    // Character not found, word doesn't exist
    if (!current.children.has(char)) {
      return false;
    }

    const nextNode = current.children.get(char);
    const shouldDeleteChild = this._deleteHelper(nextNode, word, index + 1);

    // Delete child node if it should be deleted
    if (shouldDeleteChild) {
      current.children.delete(char);
      return current.children.size === 0 && !current.isEndOfWord;
    }

    return false;
  }

  // Get all words with a given prefix
  getWordsWithPrefix(prefix) {
    const result = [];
    let current = this.root;

    // Navigate to the prefix node
    for (const char of prefix) {
      if (!current.children.has(char)) {
        return result;
      }
      current = current.children.get(char);
    }

    // Collect all words starting from the prefix node
    this._collectWords(current, prefix, result);

    return result;
  }

  _collectWords(node, prefix, result) {
    if (node.isEndOfWord) {
      result.push(prefix);
    }

    for (const [char, childNode] of node.children) {
      this._collectWords(childNode, prefix + char, result);
    }
  }
}

/*
Example Applications:
*/

// 1. Autocomplete functionality
function autocomplete(trie, prefix) {
  return trie.getWordsWithPrefix(prefix);
}

// 2. Spell checker
function isSpelledCorrectly(trie, word) {
  return trie.search(word);
}

// 3. Longest common prefix
function longestCommonPrefix(words) {
  if (words.length === 0) return "";

  const trie = new Trie();

  // Insert all words
  for (const word of words) {
    trie.insert(word);
  }

  // Find LCP
  let prefix = "";
  let current = trie.root;

  // Continue until we hit a branch point or end of word
  while (current.children.size === 1 && !current.isEndOfWord) {
    const [char, nextNode] = current.children.entries().next().value;
    prefix += char;
    current = nextNode;
  }

  return prefix;
}

/*
When to Use:
- When you need fast retrieval of strings
- For implementing prefix-based searches (autocomplete)
- When you need efficient storage of a large dictionary
- For problems involving word validation or searching
- For IP routing or similar prefix-matching problems
- When space efficiency is less important than lookup speed
*/ 