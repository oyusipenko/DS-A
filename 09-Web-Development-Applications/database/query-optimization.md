# Query Optimization

**Navigation:** [🏠 Home](../../README.md) > [🌐 Web Development Applications](../README.md) > [🗃️ Database Operations](./README.md) > Query Optimization

## The N+1 Query Problem

### Problem: Multiple Sequential Queries

One of the most common performance issues in database access is the N+1 query problem:

```javascript
// Inefficient: O(n+1) queries for n results
async function getArticlesWithComments() {
  // First query to fetch all articles (1 query)
  const articles = await db.query('SELECT * FROM articles ORDER BY created_at DESC LIMIT 20');

  // For each article, fetch its comments (n queries)
  for (const article of articles) {
    article.comments = await db.query('SELECT * FROM comments WHERE article_id = ?', [article.id]);
  }

  return articles;
}
```

This function executes 1 query to fetch articles, plus N additional queries (one for each article's comments).

### Solution: Using JOINs or Subqueries

```javascript
// Optimized: Using a JOIN (1 query total)
async function getArticlesWithComments() {
  const results = await db.query(`
    SELECT a.*, c.id as comment_id, c.content as comment_content, c.user_id as comment_user_id, c.created_at as comment_created_at
    FROM articles a
    LEFT JOIN comments c ON a.id = c.article_id
    WHERE a.id IN (SELECT id FROM articles ORDER BY created_at DESC LIMIT 20)
    ORDER BY a.created_at DESC, c.created_at ASC
  `);

  // Process the joined results into a nested structure
  const articlesMap = new Map();

  for (const row of results) {
    if (!articlesMap.has(row.id)) {
      // Create new article entry
      articlesMap.set(row.id, {
        id: row.id,
        title: row.title,
        content: row.content,
        user_id: row.user_id,
        created_at: row.created_at,
        comments: []
      });
    }

    // Add comment if it exists
    if (row.comment_id) {
      const article = articlesMap.get(row.id);
      article.comments.push({
        id: row.comment_id,
        content: row.comment_content,
        user_id: row.comment_user_id,
        created_at: row.comment_created_at,
        article_id: row.id
      });
    }
  }

  return Array.from(articlesMap.values());
}
```

## Avoiding Full Table Scans

### Problem: Querying Without Proper Indexes

Queries that don't utilize indexes result in full table scans:

```sql
-- Inefficient: Full table scan - O(n) where n is number of rows
SELECT * FROM users WHERE email LIKE '%gmail.com';

-- Inefficient: Ignores index due to function on indexed column
SELECT * FROM products WHERE LOWER(sku) = 'abc123';
```

### Solution: Use Proper Indexes and Query Patterns

```sql
-- Optimized: Prefix matching uses index - O(log n + k) where k is matching rows
SELECT * FROM users WHERE email LIKE 'john%';

-- Optimized: Avoid functions on indexed columns
SELECT * FROM products WHERE sku = 'ABC123';

-- Alternative: Use functional indexes if you need case-insensitive searches
CREATE INDEX idx_products_sku_lower ON products(LOWER(sku));
SELECT * FROM products WHERE LOWER(sku) = 'abc123';
```

## Execution Plan Analysis

### Understanding Query Execution Plans

Query planners decide how to execute queries. Analyzing execution plans helps identify inefficiencies:

```sql
-- SQLite example
EXPLAIN QUERY PLAN
SELECT u.name, p.title
FROM users u
JOIN posts p ON u.id = p.user_id
WHERE u.active = 1 AND p.published_at > '2023-01-01';
```

Example output and interpretation:

```
QUERY PLAN
|--SCAN TABLE users AS u USING INDEX idx_users_active (active=?)
|--SEARCH TABLE posts AS p USING INDEX idx_posts_user_published (user_id=? AND published_at>?)
```

This plan shows:
1. First, it scans the `users` table using an index on the `active` column
2. Then, for each matching user, it searches the `posts` table using a composite index on `user_id` and `published_at`

### Common Query Plan Operations and Their Complexity

| Operation | Description | Complexity | Performance Impact |
|-----------|-------------|------------|-------------------|
| Sequential Scan | Read all rows from a table | O(n) | Expensive for large tables |
| Index Scan | Use index to find matching rows | O(log n + k) | Efficient for selective queries |
| Index Only Scan | Get data directly from index | O(log n + k) | Very efficient (no table lookup) |
| Nested Loop Join | For each row in table A, find matches in table B | O(n × m) | Inefficient for large tables |
| Hash Join | Build hash table of one table, probe with other | O(n + m) | Better for larger tables |
| Merge Join | Sort tables on join key, merge | O(n log n + m log m) | Good for already sorted data |

## LIMIT and Pagination Optimization

### Problem: Inefficient OFFSET-Based Pagination

Traditional OFFSET-LIMIT pagination becomes slower as you navigate to later pages:

```sql
-- Inefficient for later pages: Database must scan and discard OFFSET rows
SELECT * FROM products
ORDER BY created_at DESC
LIMIT 20 OFFSET 980;  -- 50th page of 20 items
```

### Solution: Keyset Pagination

Use the values of the previous page's last row to determine where the next page starts:

```sql
-- Optimized: Keyset pagination with indexed column
SELECT * FROM products
WHERE created_at < '2023-05-10T15:30:00Z'  -- Last item's timestamp from previous page
ORDER BY created_at DESC
LIMIT 20;
```

This approach:
- Always has the same performance regardless of page number
- Requires tracking the sort keys of the last item on each page
- Works best with unique or composite sort keys

## Indexing for Query Patterns

### Problem: Mismatched Indexes and Query Patterns

Indexes that don't match your query patterns provide little benefit:

```sql
-- If you have an index on (category_id, price)

-- Inefficient: Cannot use the full index
SELECT * FROM products
WHERE price > 100
ORDER BY category_id;
```

### Solution: Create Indexes for Specific Query Patterns

```sql
-- For this query pattern: Filter by price, sort by category
CREATE INDEX idx_products_price_category ON products(price, category_id);

-- Now the query can use the index efficiently
SELECT * FROM products
WHERE price > 100
ORDER BY category_id;
```

Principles for indexing:
1. Put equality conditions before range conditions in composite indexes
2. Match your index order to your query's `WHERE` and `ORDER BY` clauses
3. Consider column cardinality (number of unique values) when ordering index columns

## Performance Tips for Query Optimization

1. **Avoid SELECT * ** - Only request the columns you need
2. **Use appropriate indexes** - Analyze query patterns and create specific indexes
3. **Consider query execution plans** - Use EXPLAIN to understand how your queries execute
4. **Use JOINs efficiently** - Choose the right join type and order
5. **Implement connection pooling** - Reuse database connections to reduce overhead
6. **Batch related queries** - Use multi-row inserts/updates where possible
7. **Use prepared statements** - They're parsed once and executed many times
8. **Consider denormalization** - For read-heavy workloads, some redundancy can improve performance

---

**Navigation**
- [⬅️ Back to Database Operations](./README.md)
- [➡️ Next: Indexing Strategies](./indexing-strategies.md)