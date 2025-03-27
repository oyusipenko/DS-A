# API Endpoint Optimization

**Navigation:** [🏠 Home](../../README.md) > [🌐 Web Development Applications](../README.md) > [🖥️ Backend Systems](./README.md) > API Optimization

## The N+1 Query Problem

### Problem: Multiple Database Queries

One of the most common performance issues in backend APIs is the N+1 query problem, which results in O(n) database queries:

```javascript
// Express route with N+1 query problem - O(n) database queries
app.get('/api/posts', async (req, res) => {
  try {
    // First query to get all posts
    const posts = await Post.findAll();

    // For each post, make a separate query to get the author
    // This results in N+1 queries (1 for posts, N for authors)
    for (let i = 0; i < posts.length; i++) {
      posts[i].author = await User.findById(posts[i].authorId);
    }

    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

As the number of posts grows, the API response time increases linearly with the number of posts, severely impacting performance.

### Solution: Joins or Eager Loading

The problem can be solved by reducing the queries to O(1) using SQL joins or ORM eager loading:

```javascript
// Using Sequelize's include for eager loading - O(1) database queries
app.get('/api/posts', async (req, res) => {
  try {
    // Single query with join to get posts and authors
    const posts = await Post.findAll({
      include: [{ model: User, as: 'author' }]
    });

    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Benchmarking the Difference

| Number of Posts | N+1 Approach | Optimized Approach |
|-----------------|--------------|-------------------|
| 10              | ~300ms       | ~40ms             |
| 100             | ~2,500ms     | ~60ms             |
| 1,000           | ~25,000ms    | ~120ms            |

## Optimizing Response Payload

### Problem: Sending Unnecessary Data

A common inefficiency is sending more data than the client needs:

```javascript
// Inefficient: Sending entire user objects including sensitive data
app.get('/api/team', async (req, res) => {
  try {
    // Fetch all team members
    const team = await User.findAll({
      where: { isTeamMember: true }
    });

    // Send everything, including potentially sensitive information
    res.json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Solution: Selective Field Projection

Optimize by only selecting and sending the required fields:

```javascript
// Optimized: Only select and return necessary fields
app.get('/api/team', async (req, res) => {
  try {
    // Only select required fields
    const team = await User.findAll({
      attributes: ['id', 'name', 'title', 'avatarUrl', 'bio'],
      where: { isTeamMember: true }
    });

    res.json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Enhanced Solution: GraphQL for Client-Specific Data

For even more flexibility, GraphQL allows clients to specify exactly what data they need:

```javascript
// GraphQL resolver for team members
const resolvers = {
  Query: {
    teamMembers: async () => {
      return await User.findAll({
        where: { isTeamMember: true }
      });
    }
  },
  User: {
    // These fields will only be resolved if requested by the client
    id: (user) => user.id,
    name: (user) => user.name,
    title: (user) => user.title,
    avatarUrl: (user) => user.avatarUrl,
    bio: (user) => user.bio,
    projects: async (user) => {
      // This expensive join operation only happens if the client requests projects
      return await Project.findAll({
        where: { teamMemberId: user.id }
      });
    }
  }
};
```

Client query example:
```graphql
query {
  teamMembers {
    name
    title
    avatarUrl
    # Only request additional fields when needed
    # projects {
    #   name
    #   description
    # }
  }
}
```

## Pagination and Limiting Results

### Problem: Returning Too Many Results

Returning large datasets in a single request is inefficient:

```javascript
// Inefficient: No limits on result size
app.get('/api/products', async (req, res) => {
  try {
    // Could return thousands of products
    const products = await Product.findAll();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Solution: Cursor-Based Pagination

Implement cursor-based pagination for efficient data retrieval:

```javascript
// Optimized: Cursor-based pagination
app.get('/api/products', async (req, res) => {
  try {
    const { limit = 20, cursor } = req.query;
    const parsedLimit = Math.min(parseInt(limit), 100); // Cap at 100

    let queryOptions = {
      limit: parsedLimit + 1, // Get one extra to determine if there's more
      order: [['id', 'ASC']]
    };

    // If cursor provided, only get items after cursor
    if (cursor) {
      queryOptions.where = {
        id: { [Op.gt]: parseInt(cursor) }
      };
    }

    const products = await Product.findAll(queryOptions);

    // Check if there are more results
    const hasMore = products.length > parsedLimit;

    // Remove the extra item
    if (hasMore) {
      products.pop();
    }

    // Get the ID to use as the next cursor
    const nextCursor = hasMore ? products[products.length - 1].id : null;

    res.json({
      products,
      pagination: {
        hasMore,
        nextCursor
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Performance Tips for API Endpoints

1. **Use database indexes** for frequently queried fields
2. **Implement proper joins** to avoid the N+1 query problem
3. **Use pagination** for large datasets
4. **Select only necessary fields** in database queries
5. **Consider caching** for data that doesn't change frequently
6. **Use compression** for API responses to reduce bandwidth
7. **Implement rate limiting** to prevent abuse

---

**Navigation**
- [⬅️ Back to Backend Systems](./README.md)
- [➡️ Next: Caching Strategies](./caching-strategies.md)