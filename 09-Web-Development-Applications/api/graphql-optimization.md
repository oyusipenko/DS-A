# GraphQL Optimization

**Navigation:** [🏠 Home](../../README.md) > [🌐 Web Development Applications](../README.md) > [🔌 API Design](./README.md) > GraphQL Optimization

## Understanding GraphQL Performance

GraphQL provides flexible data querying but introduces unique performance challenges compared to REST. Clients can request exactly what they need, but complex queries may result in inefficient database access patterns, N+1 query problems, and potential DoS vulnerabilities.

## Schema Design for Performance

### Problem: Inefficient Schema Design

A poorly designed GraphQL schema can lead to performance issues:

```graphql
# Inefficient: Forces clients to make nested queries for related data
type User {
  id: ID!
  username: String!
  email: String!
}

type Post {
  id: ID!
  title: String!
  content: String!
  authorId: ID!
}

type Query {
  user(id: ID!): User
  post(id: ID!): Post
  posts: [Post!]!
}
```

With this schema, clients need to make multiple queries to fetch related data:

```graphql
# Client needs to make one query per post to get author info
query {
  posts {
    id
    title
    authorId
    # Can't directly get author data without another query
  }
}
```

### Solution: Strategic Field Connections

Design schema with efficient data traversal in mind:

```graphql
# Optimized: Connected schema with intelligent resolvers
type User {
  id: ID!
  username: String!
  email: String!
  posts: [Post!]!
}

type Post {
  id: ID!
  title: String!
  content: String!
  author: User!
  comments: [Comment!]!
}

type Comment {
  id: ID!
  content: String!
  author: User!
}

type Query {
  user(id: ID!): User
  post(id: ID!): Post
  posts(limit: Int, offset: Int): [Post!]!
}
```

This allows clients to retrieve deeply nested data in a single query:

```graphql
# One query gets all necessary data
query {
  posts(limit: 10) {
    id
    title
    author {
      id
      username
    }
    comments {
      content
      author {
        username
      }
    }
  }
}
```

## Implementing Efficient Resolvers

### Problem: N+1 Query Problem

Naive resolver implementation leads to database query explosion:

```javascript
// Inefficient: Each post.author field triggers a new database query
const resolvers = {
  Query: {
    posts: async () => {
      return await Post.findAll({ limit: 10 });
    }
  },
  Post: {
    author: async (post) => {
      // N+1 problem: A separate database query for each post
      return await User.findByPk(post.authorId);
    }
  }
};
```

With 10 posts, this creates 1 query for the posts and 10 additional queries for authors (11 total).

### Solution: DataLoader for Batching

Use DataLoader to batch and cache database requests:

```javascript
const DataLoader = require('dataloader');

// Server setup
function createLoaders() {
  return {
    userLoader: new DataLoader(async (ids) => {
      // Batch load all users in a single query
      const users = await User.findAll({
        where: {
          id: {
            [Op.in]: ids
          }
        }
      });

      // Return users in the same order as the ids
      return ids.map(id => users.find(user => user.id === id) || null);
    })
  };
}

// Resolver implementation
const resolvers = {
  Query: {
    posts: async () => {
      return await Post.findAll({ limit: 10 });
    }
  },
  Post: {
    author: async (post, args, { loaders }) => {
      // DataLoader batches all author requests into a single query
      return loaders.userLoader.load(post.authorId);
    }
  }
};

// Apollo Server setup
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: () => ({ loaders: createLoaders() })
});
```

Now, with 10 posts, this creates only 2 queries: 1 for posts and 1 for all authors combined.

## Query Complexity Analysis

### Problem: Resource-Intensive Queries

GraphQL allows clients to request deeply nested data that may be expensive to compute:

```graphql
# Potentially expensive query requesting deeply nested relationships
query {
  users(first: 1000) {
    posts(first: 500) {
      comments(first: 300) {
        author {
          posts(first: 500) {
            comments(first: 300) {
              content
            }
          }
        }
      }
    }
  }
}
```

This query could result in millions of database operations.

### Solution: Query Complexity Limits

Implement complexity analysis to limit expensive queries:

```javascript
// Using graphql-query-complexity with Apollo Server
const { createComplexityLimitRule } = require('graphql-query-complexity');

const server = new ApolloServer({
  typeDefs,
  resolvers,
  validationRules: [
    createComplexityLimitRule(1000, {
      // Customize field complexity
      scalarCost: 1,
      objectCost: 2,
      listFactor: 10,
      // Field-specific costs
      onOperation: ({ operationName, operationType }) => {
        return operationType === 'mutation' ? 10 : 1;
      },
      // Field-specific costs based on field info
      fieldConfigEstimator: (type, field) => {
        if (field.name === 'posts' || field.name === 'comments') {
          return 10;
        }
        return 1;
      }
    })
  ],
  context: ({ req }) => ({
    loaders: createLoaders()
  })
});
```

When a query exceeds the complexity limit, the server will reject it:

```json
{
  "errors": [
    {
      "message": "Query complexity limit exceeded: 1500/1000"
    }
  ]
}
```

### Solution: Depth Limiting

Limit query nesting depth to prevent expensive traversals:

```javascript
// Using graphql-depth-limit with Apollo Server
const depthLimit = require('graphql-depth-limit');

const server = new ApolloServer({
  typeDefs,
  resolvers,
  validationRules: [
    depthLimit(5) // Limit query depth to 5 levels
  ],
  context: ({ req }) => ({
    loaders: createLoaders()
  })
});
```

## Paginated Relationships

### Problem: Fetching Too Many Related Items

Returning unbounded lists of related items can lead to performance issues:

```graphql
type User {
  id: ID!
  username: String!
  # No limits on related data
  posts: [Post!]!
  comments: [Comment!]!
}
```

### Solution: Cursor-Based Pagination

Implement cursor-based pagination for related fields:

```graphql
type PageInfo {
  hasNextPage: Boolean!
  endCursor: String
}

type PostConnection {
  edges: [PostEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type PostEdge {
  node: Post!
  cursor: String!
}

type User {
  id: ID!
  username: String!
  # Paginated relationships
  posts(first: Int!, after: String): PostConnection!
  comments(first: Int!, after: String): CommentConnection!
}
```

Implement cursor-based pagination in resolvers:

```javascript
const resolvers = {
  User: {
    posts: async (user, { first = 10, after }, { loaders }) => {
      // Decode cursor to get the post ID
      const afterId = after ? parseInt(Buffer.from(after, 'base64').toString()) : 0;

      // Query with limit and cursor
      const posts = await Post.findAll({
        where: {
          authorId: user.id,
          id: { [Op.gt]: afterId }
        },
        order: [['id', 'ASC']],
        limit: first + 1 // Get one extra to check if there's a next page
      });

      // Check if there are more results
      const hasNextPage = posts.length > first;
      if (hasNextPage) {
        posts.pop(); // Remove the extra item
      }

      // Format as connection type
      return {
        edges: posts.map(post => ({
          node: post,
          cursor: Buffer.from(post.id.toString()).toString('base64')
        })),
        pageInfo: {
          hasNextPage,
          endCursor: hasNextPage
            ? Buffer.from(posts[posts.length - 1].id.toString()).toString('base64')
            : null
        },
        totalCount: await Post.count({ where: { authorId: user.id } })
      };
    }
  }
};
```

## Optimizing Schema with Directives

### Problem: Redundant Database Queries

Some fields may trigger unnecessary database queries when they're rarely requested:

```javascript
const resolvers = {
  User: {
    // This field is computed for every User, even if not requested
    postCount: async (user) => {
      return await Post.count({ where: { authorId: user.id } });
    }
  }
};
```

### Solution: @cost Directive

Implement a `@cost` directive to make expensive fields opt-in:

```graphql
# Schema with cost directive
directive @cost(
  value: Int!
  multiplier: String
) on FIELD_DEFINITION

type User {
  id: ID!
  username: String!
  # Mark expensive computation with cost directive
  postCount: Int! @cost(value: 10)
  # Mark fields that should be requested explicitly
  detailedStats: UserStats! @cost(value: 20)
}
```

Implement the directive in your resolvers:

```javascript
// Directive implementation
const { mapSchema, getDirective, MapperKind } = require('@graphql-tools/utils');
const { makeExecutableSchema } = require('@graphql-tools/schema');

function costDirectiveTransformer(schema) {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      const costDirective = getDirective(schema, fieldConfig, 'cost')?.[0];

      if (costDirective) {
        const { value } = costDirective;

        // Store original resolver
        const originalResolver = fieldConfig.resolve;

        // Replace with new resolver that checks context
        fieldConfig.resolve = async (source, args, context, info) => {
          // Check if complexity tracking is enabled
          if (context.trackComplexity) {
            context.complexity += value;

            // Check against limit
            if (context.complexity > context.complexityLimit) {
              throw new Error(`Query complexity limit exceeded: ${context.complexity}/${context.complexityLimit}`);
            }
          }

          // Call the original resolver
          return originalResolver(source, args, context, info);
        };
      }

      return fieldConfig;
    }
  });
}

// Apply transformer to schema
let schema = makeExecutableSchema({
  typeDefs,
  resolvers
});

schema = costDirectiveTransformer(schema);
```

## Implementing Persisted Queries

### Problem: Large Query Strings

GraphQL queries can be verbose, increasing network payload:

```javascript
// Client sending large query strings each time
const client = new ApolloClient({
  uri: '/graphql',
  cache: new InMemoryCache()
});

// Each request includes the full query string
client.query({
  query: gql`
    query GetUserWithPosts($userId: ID!) {
      user(id: $userId) {
        id
        username
        email
        posts {
          id
          title
          content
          createdAt
          updatedAt
          # ... many more fields
        }
      }
    }
  `,
  variables: { userId: '123' }
});
```

### Solution: Automatic Persisted Queries

Implement APQ to reduce query payload size:

```javascript
// Server setup with APQ
const { ApolloServer } = require('apollo-server-express');
const { createPersistedQueryLink } = require('@apollo/client/link/persisted-queries');
const { createHash } = require('crypto');

// Server-side
const server = new ApolloServer({
  typeDefs,
  resolvers,
  persistedQueries: {
    // Use SHA-256 hashing
    ttl: 900, // 15 minutes cache time
  }
});

// Client-side
const link = createPersistedQueryLink({
  useGETForHashedQueries: true,
  sha256: query => createHash('sha256').update(query).digest('hex')
});

const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: link.concat(httpLink)
});
```

After the first request, subsequent requests use a compact hash:

```
# First request (miss)
POST /graphql
{
  "extensions": {
    "persistedQuery": {
      "version": 1,
      "sha256Hash": "ecf4edb46db40b5132295c0291d62fb65d6759a9eedfa4d5d612dd5ec54a6b38"
    }
  },
  "variables": { "userId": "123" }
}

# Response
{
  "errors": [
    { "message": "PersistedQueryNotFound" }
  ]
}

# Second request (with full query)
POST /graphql
{
  "query": "query GetUserWithPosts($userId: ID!) { user(id: $userId) { ... } }",
  "extensions": {
    "persistedQuery": {
      "version": 1,
      "sha256Hash": "ecf4edb46db40b5132295c0291d62fb65d6759a9eedfa4d5d612dd5ec54a6b38"
    }
  },
  "variables": { "userId": "123" }
}

# Subsequent requests (cache hit)
GET /graphql?extensions={"persistedQuery":{"version":1,"sha256Hash":"ecf4edb46db40b5132295c0291d62fb65d6759a9eedfa4d5d612dd5ec54a6b38"}}&variables={"userId":"123"}
```

## Caching Strategies

### Problem: Redundant Computation

GraphQL resolvers may compute the same data repeatedly:

```javascript
const resolvers = {
  Query: {
    topPosts: async () => {
      // Expensive calculation performed on every request
      return await Post.findAll({
        order: [['likesCount', 'DESC']],
        limit: 10
      });
    }
  }
};
```

### Solution: Response Caching

Implement HTTP-level caching with CDN support:

```javascript
const { ApolloServer } = require('apollo-server-express');
const responseCachePlugin = require('apollo-server-plugin-response-cache');

const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [
    responseCachePlugin({
      // Cache responses for specific types
      sessionId: ({ request }) => request.http.headers.get('authorization') || null,
      // Custom rules for what to cache
      shouldReadFromCache: ({ request }) => {
        // Don't cache authenticated requests
        return !request.http.headers.has('authorization');
      },
      shouldWriteToCache: ({ response }) => {
        // Only cache successful responses
        return !response.errors;
      }
    })
  ],
  cacheControl: {
    defaultMaxAge: 60, // 1 minute default
    calculateHttpHeaders: true // Add Cache-Control headers
  }
});
```

Add cache hints in your schema:

```graphql
type Post @cacheControl(maxAge: 300) {
  id: ID!
  title: String!
  content: String!
  # Real-time data should not be cached
  viewCount: Int! @cacheControl(maxAge: 0)
  # Infrequently updated data can be cached longer
  author: User! @cacheControl(maxAge: 3600)
}

type Query {
  recentPosts: [Post!]! @cacheControl(maxAge: 60)
  topPosts: [Post!]! @cacheControl(maxAge: 300)
  # User-specific queries should not be cached
  myDrafts: [Post!]! @cacheControl(maxAge: 0, scope: PRIVATE)
}
```

### Solution: Field-Level Caching with Redis

Implement resolver-level caching for expensive operations:

```javascript
const Redis = require('ioredis');
const redis = new Redis();

const resolvers = {
  Query: {
    topPosts: async (_, __, { dataSources }) => {
      // Check cache first
      const cacheKey = `topPosts`;
      const cached = await redis.get(cacheKey);

      if (cached) {
        return JSON.parse(cached);
      }

      // If not in cache, compute and store
      const posts = await Post.findAll({
        order: [['likesCount', 'DESC']],
        limit: 10
      });

      // Cache for 5 minutes
      await redis.set(cacheKey, JSON.stringify(posts), 'EX', 300);

      return posts;
    },

    // User-specific caching example
    userPosts: async (_, { userId }, { dataSources }) => {
      const cacheKey = `userPosts:${userId}`;
      const cached = await redis.get(cacheKey);

      if (cached) {
        return JSON.parse(cached);
      }

      const posts = await Post.findAll({
        where: { authorId: userId },
        order: [['createdAt', 'DESC']]
      });

      await redis.set(cacheKey, JSON.stringify(posts), 'EX', 60);

      return posts;
    }
  },

  Mutation: {
    createPost: async (_, { input }, { dataSources }) => {
      const post = await Post.create(input);

      // Invalidate caches that include the new post
      await redis.del(`userPosts:${input.authorId}`);
      await redis.del(`topPosts`);

      return post;
    }
  }
};
```

## Performance Tips for GraphQL

1. **Use DataLoader for batching** - Avoid N+1 query problems
2. **Implement query complexity analysis** - Protect against expensive queries
3. **Add pagination to all lists** - Prevent fetching too many items
4. **Consider persisted queries** - Reduce network payload
5. **Set up response caching** - Cache complete responses when possible
6. **Use field-level caching** - Cache expensive computations
7. **Design schema carefully** - Structure types for efficient resolution
8. **Limit query depth** - Prevent deeply nested queries
9. **Set timeout limits** - Prevent long-running queries
10. **Analyze and optimize resolvers** - Profile and improve performance hotspots

---

**Navigation**
- [⬅️ Previous: REST Optimization](./rest-optimization.md)
- [⬆️ Up to API Design](./README.md)
- [➡️ Next: Pagination Strategies](./pagination-strategies.md)