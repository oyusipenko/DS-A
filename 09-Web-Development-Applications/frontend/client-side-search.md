# Client-Side Search and Filtering

**Navigation:** [🏠 Home](../../README.md) > [🌐 Web Development Applications](../README.md) > [💻 Frontend Performance](./README.md) > Client-Side Search

## Basic Search Implementation

### Problem: Linear Search Complexity

The most common approach to client-side search suffers from O(n * m) complexity, where n is the number of items and m is the average string length:

```javascript
// Basic Search: O(n * m) where n is items count and m is average string length
function searchProducts(products, query) {
  const lowerQuery = query.toLowerCase();
  return products.filter(product =>
    product.name.toLowerCase().includes(lowerQuery)
  );
}

// Usage
const results = searchProducts(allProducts, 'phone');
```

This approach becomes problematic as the dataset grows, especially with frequent user input.

## Advanced Search with Data Structures

### Solution 1: Pre-indexing with Trie

A Trie data structure provides O(k) lookup time, where k is the query length:

```javascript
class TrieNode {
  constructor() {
    this.children = {};
    this.isEndOfWord = false;
    this.products = [];
  }
}

class ProductSearch {
  constructor(products) {
    this.root = new TrieNode();
    this.buildTrie(products);
  }

  // O(n * m) one-time cost to build the trie
  buildTrie(products) {
    products.forEach(product => {
      const name = product.name.toLowerCase();

      // Index each word in the product name
      name.split(' ').forEach(word => {
        let current = this.root;

        for (const char of word) {
          if (!current.children[char]) {
            current.children[char] = new TrieNode();
          }
          current = current.children[char];
          current.products.push(product);
        }

        current.isEndOfWord = true;
      });
    });
  }

  // O(k + results) where k is query length
  search(query) {
    const lowerQuery = query.toLowerCase();
    let current = this.root;

    for (const char of lowerQuery) {
      if (!current.children[char]) {
        return []; // No matches
      }
      current = current.children[char];
    }

    return current.products;
  }
}

// Usage
const productSearch = new ProductSearch(allProducts); // Initialize once
const results = productSearch.search('phone'); // Fast O(k) lookup
```

### Solution 2: Inverted Index

For more complex search requirements, an inverted index can be more appropriate:

```javascript
class InvertedIndex {
  constructor(products) {
    this.index = new Map();
    this.products = products;
    this.buildIndex(products);
  }

  // O(n * m) one-time cost to build the index
  buildIndex(products) {
    products.forEach((product, productId) => {
      // Extract searchable terms from various fields
      const terms = this.extractTerms(product);

      terms.forEach(term => {
        if (!this.index.has(term)) {
          this.index.set(term, new Set());
        }
        this.index.get(term).add(productId);
      });
    });
  }

  extractTerms(product) {
    // Extract and normalize searchable terms
    const terms = [];
    const name = product.name.toLowerCase();
    const description = product.description.toLowerCase();

    // Add individual words from name and description
    terms.push(...name.split(/\s+/));
    terms.push(...description.split(/\s+/));

    // Add category, tags, etc.
    if (product.category) {
      terms.push(product.category.toLowerCase());
    }

    if (product.tags) {
      terms.push(...product.tags.map(tag => tag.toLowerCase()));
    }

    return [...new Set(terms)]; // Remove duplicates
  }

  // O(q + r) where q is query terms count and r is results count
  search(query) {
    const searchTerms = query.toLowerCase().split(/\s+/);

    if (searchTerms.length === 0) return [];

    // Find products that match the first term
    let productIds = this.index.has(searchTerms[0])
      ? new Set(this.index.get(searchTerms[0]))
      : new Set();

    // Intersection with remaining terms (AND search)
    for (let i = 1; i < searchTerms.length; i++) {
      const term = searchTerms[i];
      if (!this.index.has(term)) {
        return []; // No matches for this term
      }

      const termMatches = this.index.get(term);
      productIds = new Set(
        [...productIds].filter(id => termMatches.has(id))
      );

      if (productIds.size === 0) return []; // No common matches
    }

    // Return the actual products
    return [...productIds].map(id => this.products[id]);
  }
}

// Usage
const searchEngine = new InvertedIndex(allProducts);
const results = searchEngine.search('wireless headphones');
```

## Optimizing Search UI

### Debouncing User Input

```javascript
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// In a React component
function SearchComponent({ products }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  // Initialize search engine once
  const searchEngine = useMemo(() => new ProductSearch(products), [products]);

  // Debounce the search to prevent excessive operations on rapid typing
  const debouncedSearch = useCallback(
    debounce(query => {
      const searchResults = searchEngine.search(query);
      setResults(searchResults);
    }, 300),
    [searchEngine]
  );

  // Update query and trigger debounced search
  const handleInputChange = e => {
    setQuery(e.target.value);
    debouncedSearch(e.target.value);
  };

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        placeholder="Search products..."
      />
      <div className="results">
        {results.map(product => (
          <div key={product.id} className="product">
            {product.name}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Performance Tips for Client-Side Search

1. **Pre-process and index data** when it's first loaded
2. **Use appropriate data structures** for your search requirements
3. **Debounce user input** to prevent excessive searches during typing
4. **Consider pagination or virtualization** for large result sets
5. **Use Web Workers** for intensive search operations to avoid blocking the main thread
6. **Consider hybrid approaches** with server-side search for very large datasets

---

**Navigation**
- [⬅️ Back to Frontend Performance](./README.md)
- [➡️ Next: DOM Manipulation Optimization](./dom-manipulation.md)