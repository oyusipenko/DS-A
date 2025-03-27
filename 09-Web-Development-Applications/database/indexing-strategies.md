# Indexing Strategies

**Navigation:** [🏠 Home](../../README.md) > [🌐 Web Development Applications](../README.md) > [🗃️ Database Operations](./README.md) > Indexing Strategies

## Understanding Database Indexes

Indexes are specialized data structures that enhance database query performance by reducing the number of disk I/O operations required to locate data. They function like book indexes, allowing the database to find rows without scanning entire tables.

## Types of Indexes and Their Use Cases

### B-Tree Indexes

The most common index type, B-Trees excel at equality and range queries:

```sql
-- Creating a standard B-Tree index
CREATE INDEX idx_users_email ON users(email);

-- Query that benefits from this index
SELECT * FROM users WHERE email = 'user@example.com';

-- Range query using the index
SELECT * FROM users WHERE email BETWEEN 'a' AND 'c';
```

**B-Tree Complexity:**
- Search: O(log n)
- Insertion: O(log n)
- Deletion: O(log n)

**Best for:**
- Equality comparisons (=, IN)
- Range queries (<, >, BETWEEN)
- Prefix searches (LIKE 'prefix%')
- Sorting operations (ORDER BY)

### Hash Indexes

Optimized for exact equality matches with O(1) lookup time:

```sql
-- In MySQL, you can specify a hash index (in memory tables)
CREATE TABLE users (
  id INT PRIMARY KEY,
  email VARCHAR(255),
  INDEX idx_email USING HASH (email)
) ENGINE=MEMORY;

-- PostgreSQL offers hash indexes
CREATE INDEX idx_users_email_hash ON users USING HASH (email);

-- Ideal for exact lookups
SELECT * FROM users WHERE email = 'user@example.com';
```

**Hash Index Complexity:**
- Search: O(1) average case
- Insertion: O(1) average case
- Deletion: O(1) average case

**Best for:**
- Exact equality comparisons only
- High-cardinality columns (many unique values)

**Limitations:**
- Cannot support range queries or sorting
- No partial key lookups

### Full-Text Indexes

Specialized for text search operations:

```sql
-- Creating a full-text index in MySQL
CREATE FULLTEXT INDEX idx_articles_content ON articles(title, content);

-- Full-text search query
SELECT * FROM articles
WHERE MATCH(title, content) AGAINST('database optimization' IN NATURAL LANGUAGE MODE);
```

**Best for:**
- Natural language searches
- Relevance-ranked results
- Document collections

### Spatial Indexes

Optimized for geometric data:

```sql
-- Creating a spatial index in PostgreSQL
CREATE INDEX idx_locations_position ON locations USING GIST (position);

-- Query that uses the spatial index
SELECT * FROM locations
WHERE ST_DWithin(position, ST_MakePoint(-73.9857, 40.7484), 1000);
```

**Best for:**
- Geographic queries
- Proximity searches
- Spatial operations (intersects, contains, etc.)

## Composite Indexes

### Problem: Multiple Single-Column Indexes

Having separate indexes for frequently combined columns is inefficient:

```sql
-- Inefficient: Separate indexes may not be used together effectively
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_price ON products(price);

-- Query that needs both columns
SELECT * FROM products
WHERE category_id = 5 AND price < 100;
```

### Solution: Composite Indexes

Create multi-column indexes for common query patterns:

```sql
-- Optimized: Composite index for the query pattern
CREATE INDEX idx_products_category_price ON products(category_id, price);

-- Now this query can use the index effectively
SELECT * FROM products
WHERE category_id = 5 AND price < 100;
```

### Column Order in Composite Indexes

The order of columns in composite indexes matters significantly:

```sql
-- Example: index on (category_id, price, name)

-- Can use the full index
SELECT * FROM products
WHERE category_id = 5 AND price = 20 AND name = 'Widget';

-- Can use the index for these two columns
SELECT * FROM products
WHERE category_id = 5 AND price > 50;

-- Can only use the first column of the index
SELECT * FROM products
WHERE category_id = 5;

-- Cannot use the index effectively
SELECT * FROM products
WHERE price > 50;
```

**Rule of thumb for column ordering:**
1. Place equality comparison columns first (WHERE col = value)
2. Then place range comparison columns (WHERE col > value)
3. Consider column cardinality (columns with more unique values often go first)
4. Match the sorting requirements (ORDER BY clause)

## Covering Indexes

### Problem: Index + Table Lookup

Even with indexes, the database often needs to access the table for additional columns:

```sql
-- Index on user_id column
CREATE INDEX idx_orders_user_id ON orders(user_id);

-- Query needs to look up additional columns from the table
SELECT order_id, total_amount, status FROM orders
WHERE user_id = 123;
```

### Solution: Include Additional Columns in the Index

```sql
-- Covering index that includes all needed columns
CREATE INDEX idx_orders_user_covering ON orders(user_id, order_id, total_amount, status);

-- Query can now be satisfied entirely from the index (index-only scan)
SELECT order_id, total_amount, status FROM orders
WHERE user_id = 123;
```

This approach:
- Eliminates the need to access the table (index-only scan)
- Reduces I/O operations
- Increases query speed
- Trades off storage space and write performance

## Partial Indexes

### Problem: Indexing Rarely-Used Values

Full indexes waste space when many values aren't frequently queried:

```sql
-- Full index includes all rows
CREATE INDEX idx_orders_status ON orders(status);

-- But most queries only look for specific statuses
SELECT * FROM orders WHERE status = 'pending';
```

### Solution: Partial Indexes for Common Values

```sql
-- PostgreSQL partial index only for active status
CREATE INDEX idx_orders_active ON orders(created_at)
WHERE status = 'active';

-- This query will use the partial index
SELECT * FROM orders
WHERE status = 'active' AND created_at > '2023-01-01';
```

Partial indexes:
- Reduce index size
- Improve write performance
- Optimize for common query patterns
- Maintain fast lookups for important subsets

## Index Maintenance

### Monitoring Index Usage

Identify unused or rarely used indexes:

```sql
-- PostgreSQL: Check index usage statistics
SELECT relname AS table_name,
       indexrelname AS index_name,
       idx_scan AS index_scans
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;

-- MySQL: Check index usage
SHOW INDEX FROM table_name;
```

### Index Fragmentation

Indexes become fragmented over time as data changes:

```sql
-- PostgreSQL: Rebuild an index
REINDEX INDEX index_name;

-- MySQL: Rebuild an index
ALTER TABLE table_name DROP INDEX index_name;
ALTER TABLE table_name ADD INDEX index_name (column_list);
```

### Automated Index Suggestions

Many database systems provide tools to suggest indexes based on query patterns:

```sql
-- PostgreSQL: Use pg_stat_statements to identify frequent queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;

-- MySQL: Use the Index Advisor
EXPLAIN FORMAT=JSON SELECT * FROM products WHERE category_id = 5 AND price < 100;
-- Look for "missing_indexes" in the output
```

## Index Selection Trade-offs

| Index Type | Read Performance | Write Overhead | Space Requirements | Use Case |
|------------|------------------|----------------|-------------------|----------|
| None | Poor | None | None | Write-heavy, rarely queried tables |
| Single Column | Good for specific column | Low-Medium | Medium | Basic filtering and sorting |
| Composite | Excellent for specific patterns | Medium-High | High | Multi-column queries |
| Covering | Best for covered queries | High | Very High | Performance-critical queries |
| Partial | Good for covered subset | Low | Low | Queries targeting specific values |
| Full-Text | Good for text search | High | Very High | Natural language search |

## Performance Tips for Indexing

1. **Don't over-index** - Each index adds overhead to writes
2. **Analyze query patterns** - Create indexes for actual usage, not hypothetical queries
3. **Consider column selectivity** - Low-cardinality columns (few unique values) benefit less from indexes
4. **Mind index size** - Large indexes consume memory and slow down writes
5. **Covering indexes** - Include frequently queried columns to enable index-only scans
6. **Review and maintain** - Regularly identify unused or duplicate indexes
7. **Test performance impacts** - Measure query performance before and after indexing
8. **Consider read/write ratio** - More indexes for read-heavy, fewer for write-heavy tables

---

**Navigation**
- [⬅️ Previous: Query Optimization](./query-optimization.md)
- [⬆️ Up to Database Operations](./README.md)
- [➡️ Next: Join Operations](./join-operations.md)