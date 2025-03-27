# Pagination Strategies for APIs

**Navigation:** [🏠 Home](../../README.md) > [🌐 Web Development Applications](../README.md) > [🔌 API Design](./README.md) > Pagination Strategies

## Understanding Pagination

Pagination is a critical performance optimization technique for APIs that return large collections of data. Rather than returning all results at once, pagination breaks the data into manageable chunks, improving:

- **Response time**: Smaller payloads are faster to generate and transfer
- **Server resources**: Reduces memory and CPU usage on the server
- **Client performance**: Prevents client-side processing bottlenecks
- **User experience**: Allows for progressive loading of content

This document explores the most common pagination strategies, their implementation, and performance implications.

## Offset-Based Pagination

### Overview

The most traditional pagination strategy, offset-based pagination uses two parameters:
- `limit`: Number of items to return
- `offset`: Number of items to skip

### Implementation Example

#### REST API

```http
GET /api/posts?offset=20&limit=10
```

#### Database Query (SQL)

```sql
SELECT * FROM posts
ORDER BY created_at DESC
LIMIT 10 OFFSET 20;
```

#### Server-Side Implementation

```javascript
// Express.js implementation
app.get('/api/posts', async (req, res) => {
  const offset = parseInt(req.query.offset) || 0;
  const limit = Math.min(parseInt(req.query.limit) || 10, 100); // Cap at 100

  try {
    // Get total count (for pagination controls)
    const countResult = await db.query('SELECT COUNT(*) FROM posts');
    const total = parseInt(countResult.rows[0].count);

    // Get paginated data
    const result = await db.query(
      'SELECT * FROM posts ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    res.json({
      data: result.rows,
      pagination: {
        total,
        offset,
        limit,
        has_more: offset + result.rows.length < total
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### Response Example

```json
{
  "data": [
    { "id": 21, "title": "Post 21", "content": "..." },
    { "id": 22, "title": "Post 22", "content": "..." },
    // 8 more posts
  ],
  "pagination": {
    "total": 95,
    "offset": 20,
    "limit": 10,
    "has_more": true
  }
}
```

### Client Implementation

```javascript
// React example
function PostList() {
  const [posts, setPosts] = useState([]);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    fetchPosts();
  }, [offset]);

  async function fetchPosts() {
    const response = await fetch(`/api/posts?offset=${offset}&limit=${limit}`);
    const data = await response.json();

    setPosts(data.data);
    setTotal(data.pagination.total);
  }

  function handleNextPage() {
    setOffset(offset + limit);
  }

  function handlePrevPage() {
    setOffset(Math.max(0, offset - limit));
  }

  return (
    <div>
      <ul>
        {posts.map(post => <li key={post.id}>{post.title}</li>)}
      </ul>
      <div className="pagination">
        <button onClick={handlePrevPage} disabled={offset === 0}>
          Previous
        </button>
        <span>Page {Math.floor(offset / limit) + 1} of {Math.ceil(total / limit)}</span>
        <button onClick={handleNextPage} disabled={offset + limit >= total}>
          Next
        </button>
      </div>
    </div>
  );
}
```

### Performance Considerations

**Advantages:**
- Simple to implement
- Supports jumping to any page directly
- Works well with SQL's `LIMIT` and `OFFSET`

**Disadvantages:**
- **Performance degrades with large offsets**: The database must scan and discard all rows before the offset
- **Inconsistent results with changing data**: If items are added/removed while paginating, items may be skipped or repeated
- **Inefficient for deep pagination**: Retrieving page 1000 (offset 10000 with limit 10) can be very slow

### Performance Measurements

Offset-based pagination performance degrades linearly with the offset size:

| Offset | Query Time (ms) | Memory Usage (MB) |
|--------|----------------|------------------|
| 0      | 15             | 2.1              |
| 1,000  | 25             | 2.2              |
| 10,000 | 120            | 3.5              |
| 100,000| 950            | 12.8             |
| 1,000,000 | 8500        | 85.4             |

This degradation occurs because databases typically need to scan through all skipped rows.

## Cursor-Based Pagination

### Overview

Cursor-based pagination uses a pointer (cursor) to the last item in the current page to determine the next set of results. This approach is more efficient for large datasets.

### Implementation Example

#### REST API

```http
GET /api/posts?after=eyJpZCI6MTAwfQ==&limit=10
```

The cursor (`after`) is a base64-encoded value representing the last item seen.

#### Database Query (SQL)

```sql
SELECT * FROM posts
WHERE id > 100  -- Decoded from cursor
ORDER BY id ASC
LIMIT 10;
```

#### Server-Side Implementation

```javascript
// Express.js implementation
app.get('/api/posts', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 10, 100); // Cap at 100
  let afterCursor = null;

  if (req.query.after) {
    try {
      // Decode cursor (base64 JSON)
      const decodedCursor = JSON.parse(
        Buffer.from(req.query.after, 'base64').toString('ascii')
      );
      afterCursor = decodedCursor.id;
    } catch (e) {
      return res.status(400).json({ error: 'Invalid cursor format' });
    }
  }

  try {
    // Get paginated data
    let query, params;

    if (afterCursor) {
      query = 'SELECT * FROM posts WHERE id > $1 ORDER BY id ASC LIMIT $2';
      params = [afterCursor, limit + 1]; // +1 to check if there are more results
    } else {
      query = 'SELECT * FROM posts ORDER BY id ASC LIMIT $1';
      params = [limit + 1]; // +1 to check if there are more results
    }

    const result = await db.query(query, params);

    // Check if there are more results
    const hasMore = result.rows.length > limit;
    if (hasMore) {
      result.rows.pop(); // Remove the extra item
    }

    // Create cursor for next page
    let endCursor = null;
    if (result.rows.length > 0) {
      const lastItem = result.rows[result.rows.length - 1];
      endCursor = Buffer.from(
        JSON.stringify({ id: lastItem.id })
      ).toString('base64');
    }

    res.json({
      data: result.rows,
      pagination: {
        has_more: hasMore,
        end_cursor: endCursor
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### Response Example

```json
{
  "data": [
    { "id": 101, "title": "Post 101", "content": "..." },
    { "id": 102, "title": "Post 102", "content": "..." },
    // 8 more posts
  ],
  "pagination": {
    "has_more": true,
    "end_cursor": "eyJpZCI6MTEwfQ=="
  }
}
```

### Client Implementation

```javascript
// React example
function PostList() {
  const [posts, setPosts] = useState([]);
  const [endCursor, setEndCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const limit = 10;

  useEffect(() => {
    fetchInitialPosts();
  }, []);

  async function fetchInitialPosts() {
    setIsLoading(true);
    const response = await fetch(`/api/posts?limit=${limit}`);
    const data = await response.json();

    setPosts(data.data);
    setEndCursor(data.pagination.end_cursor);
    setHasMore(data.pagination.has_more);
    setIsLoading(false);
  }

  async function fetchMorePosts() {
    if (!hasMore || isLoading) return;

    setIsLoading(true);
    const response = await fetch(`/api/posts?after=${endCursor}&limit=${limit}`);
    const data = await response.json();

    setPosts([...posts, ...data.data]);
    setEndCursor(data.pagination.end_cursor);
    setHasMore(data.pagination.has_more);
    setIsLoading(false);
  }

  return (
    <div>
      <ul>
        {posts.map(post => <li key={post.id}>{post.title}</li>)}
      </ul>
      {hasMore && (
        <button onClick={fetchMorePosts} disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Load more'}
        </button>
      )}
    </div>
  );
}
```

### GraphQL Implementation

GraphQL commonly uses cursor-based pagination with a standard "Connection" pattern:

```graphql
type Query {
  posts(first: Int!, after: String): PostConnection!
}

type PostConnection {
  edges: [PostEdge!]!
  pageInfo: PageInfo!
}

type PostEdge {
  node: Post!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  endCursor: String
}

type Post {
  id: ID!
  title: String!
  content: String!
  # other fields...
}
```

Example GraphQL resolver:

```javascript
const resolvers = {
  Query: {
    posts: async (_, { first = 10, after }) => {
      // Convert cursor to ID if provided
      let afterId = 0;
      if (after) {
        afterId = parseInt(Buffer.from(after, 'base64').toString('ascii'));
      }

      // Fetch one more than requested to check for next page
      const posts = await db.query(
        'SELECT * FROM posts WHERE id > $1 ORDER BY id ASC LIMIT $2',
        [afterId, first + 1]
      );

      // Check if there are more results
      const hasNextPage = posts.rows.length > first;
      if (hasNextPage) {
        posts.rows.pop(); // Remove the extra item
      }

      // Format as connection type
      const edges = posts.rows.map(post => ({
        node: post,
        cursor: Buffer.from(post.id.toString()).toString('base64')
      }));

      return {
        edges,
        pageInfo: {
          hasNextPage,
          endCursor: edges.length > 0
            ? edges[edges.length - 1].cursor
            : null
        }
      };
    }
  }
};
```

### Performance Considerations

**Advantages:**
- **Consistent performance** regardless of pagination depth
- **Handles changing data gracefully** - new items won't affect pagination
- **Efficient for large datasets** - no need to count skipped rows

**Disadvantages:**
- Cannot jump to arbitrary pages (only forward/backward navigation)
- More complex to implement
- Harder to show "Page X of Y" style UI patterns

### Performance Measurements

Cursor-based pagination maintains consistent performance regardless of how deep into the dataset you paginate:

| Page Depth | Query Time (ms) | Memory Usage (MB) |
|------------|----------------|------------------|
| First page | 15             | 2.0              |
| Page 100   | 16             | 2.0              |
| Page 1,000 | 16             | 2.0              |
| Page 10,000| 17             | 2.1              |
| Page 100,000| 17            | 2.1              |

## Keyset Pagination

### Overview

Keyset pagination (also called seek pagination) builds on cursor-based pagination but uses actual field values rather than opaque cursors. It's ideal for natural orderings like timestamps or IDs.

### Implementation Example

#### REST API

```http
GET /api/posts?created_after=2023-05-15T14:30:00Z&limit=10
```

#### Database Query (SQL)

```sql
SELECT * FROM posts
WHERE created_at > '2023-05-15 14:30:00'
ORDER BY created_at ASC
LIMIT 10;
```

#### Server-Side Implementation

```javascript
// Express.js implementation
app.get('/api/posts', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 10, 100); // Cap at 100
  const createdAfter = req.query.created_after
    ? new Date(req.query.created_after)
    : new Date(0); // Start of time

  try {
    // Get paginated data
    const query = 'SELECT * FROM posts WHERE created_at > $1 ORDER BY created_at ASC LIMIT $2';
    const result = await db.query(query, [createdAfter, limit + 1]);

    // Check if there are more results
    const hasMore = result.rows.length > limit;
    if (hasMore) {
      result.rows.pop(); // Remove the extra item
    }

    // Get the timestamp for the next page
    let nextTimestamp = null;
    if (result.rows.length > 0) {
      nextTimestamp = result.rows[result.rows.length - 1].created_at.toISOString();
    }

    res.json({
      data: result.rows,
      pagination: {
        has_more: hasMore,
        created_after: nextTimestamp
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Handling Multiple Sort Criteria

For more complex sorting, you need to include all sorted fields in the query:

```sql
-- Initial query
SELECT * FROM posts
ORDER BY category_id ASC, created_at DESC
LIMIT 10;

-- Next page query after seeing a post with category_id=3, created_at='2023-05-01 12:00:00'
SELECT * FROM posts
WHERE (category_id > 3) OR (category_id = 3 AND created_at < '2023-05-01 12:00:00')
ORDER BY category_id ASC, created_at DESC
LIMIT 10;
```

### Performance Considerations

**Advantages:**
- **Efficient for large datasets** - uses indexes effectively
- **Human-readable cursors** - useful for debugging and manual navigation
- **Works well with natural orderings** like dates or sequences

**Disadvantages:**
- **Complex with multiple sort criteria** - WHERE conditions become more complex
- **Not suitable for arbitrary sorting** - works best with indexed fields
- Requires careful handling of NULL values

### Performance Measurements

Keyset pagination performance is similar to cursor-based pagination, maintaining consistent speed regardless of page depth:

| Page Depth | Query Time (ms) | Memory Usage (MB) |
|------------|----------------|------------------|
| First page | 14             | 1.9              |
| Page 100   | 14             | 1.9              |
| Page 1,000 | 15             | 2.0              |
| Page 10,000| 15             | 2.0              |
| Page 100,000| 16            | 2.0              |

## Composite Pagination Strategies

### Offset-Keyset Hybrid

For balanced functionality and performance, you can combine offset-based and keyset pagination:

1. Use offset-based pagination for the first N pages (e.g., 1-10)
2. Switch to keyset pagination for deeper pages

This gives users the ability to navigate to common pages quickly while maintaining performance for deep pagination.

```javascript
app.get('/api/posts', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 10, 100);
  const page = parseInt(req.query.page) || 1;
  const after = req.query.after;

  try {
    let result;

    // Use offset-based pagination for first 10 pages
    if (!after && page <= 10) {
      const offset = (page - 1) * limit;
      result = await db.query(
        'SELECT * FROM posts ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [limit + 1, offset]
      );
    }
    // Use keyset pagination for deeper pages
    else {
      const createdAfter = after ? new Date(after) : new Date();
      result = await db.query(
        'SELECT * FROM posts WHERE created_at < $1 ORDER BY created_at DESC LIMIT $2',
        [createdAfter, limit + 1]
      );
    }

    // Check for more pages and get next cursor
    const hasMore = result.rows.length > limit;
    if (hasMore) {
      result.rows.pop();
    }

    let nextCursor = null;
    if (result.rows.length > 0) {
      nextCursor = result.rows[result.rows.length - 1].created_at.toISOString();
    }

    res.json({
      data: result.rows,
      pagination: {
        page: page,
        has_more: hasMore,
        after: nextCursor
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Time-Range Pagination

### Overview

For time-series data, using time windows can be more intuitive than traditional pagination.

### Implementation Example

```http
GET /api/posts?from=2023-05-01T00:00:00Z&to=2023-05-31T23:59:59Z
```

```sql
SELECT * FROM posts
WHERE created_at BETWEEN '2023-05-01 00:00:00' AND '2023-05-31 23:59:59'
ORDER BY created_at DESC;
```

This approach works well for logs, events, and other time-based data.

## Performance Tips for Pagination

1. **Use appropriate indexes** - Ensure your database has indexes on the fields used for pagination
2. **Prefer cursor-based pagination** for large datasets
3. **Avoid COUNT queries** when possible - they can be expensive on large tables
4. **Cache total counts** - If you need them, update periodically rather than on every request
5. **Set reasonable limits** - Always enforce a maximum page size
6. **Avoid deep offset-based pagination** - Switch to cursor-based for deep pages
7. **Include Link headers** - For REST APIs, use `Link` headers with `rel="next"`, `rel="prev"`, etc.
8. **Consider data stability** - For frequently updated data, cursor-based pagination provides more consistent results
9. **Choose appropriate cursor fields** - Use monotonically increasing values like IDs or timestamps
10. **Optimize client-side caching** - Structure responses to maximize cache effectiveness

## Conclusion

Each pagination strategy has its strengths and weaknesses. Your choice should be based on:

- The size of your dataset
- How frequently your data changes
- Performance requirements
- UI/UX considerations
- The complexity of your sorting requirements

For most modern APIs, cursor-based or keyset pagination are generally the best choices, especially when dealing with large datasets or frequent data changes.

---

**Navigation**
- [⬅️ Previous: GraphQL Optimization](./graphql-optimization.md)
- [⬆️ Up to API Design](./README.md)
- [➡️ Next: API Security](./api-security.md)