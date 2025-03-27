# GraphQL API Design

**Navigation:** [🏠 Home](../../README.md) > [🌐 Web Development Applications](../README.md) > [🔌 API Design](./README.md) > GraphQL API Design

## Understanding GraphQL

GraphQL is a query language for APIs and a runtime for executing those queries against your data. Unlike REST, which exposes a fixed set of endpoints, GraphQL provides a single endpoint where clients can request exactly the data they need.

Key advantages of GraphQL include:

- **Client-specified queries**: Clients specify exactly what data they need
- **Aggregation**: Multiple resources can be retrieved in a single request
- **Strong typing**: The schema defines available types and operations
- **Introspection**: The API is self-documenting
- **Evolution without versioning**: Add fields without breaking existing queries

## Schema Design

The schema is the foundation of a GraphQL API, defining the types, queries, mutations, and subscriptions available.

### Type Definitions

```graphql
# Basic type definitions
type User {
  id: ID!
  username: String!
  email: String!
  profile: Profile
  posts: [Post!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Profile {
  id: ID!
  userId: ID!
  fullName: String
  bio: String
  avatarUrl: String
  socialLinks: [SocialLink!]
}

type Post {
  id: ID!
  title: String!
  content: String!
  published: Boolean!
  author: User!
  tags: [String!]!
  comments: [Comment!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Comment {
  id: ID!
  content: String!
  author: User!
  post: Post!
  createdAt: DateTime!
}

type SocialLink {
  platform: String!
  url: String!
}

# Custom scalar for dates
scalar DateTime
```

### Query Definitions

```graphql
type Query {
  # User queries
  user(id: ID!): User
  users(limit: Int, offset: Int): [User!]!
  me: User

  # Post queries
  post(id: ID!): Post
  posts(
    limit: Int,
    offset: Int,
    sortBy: PostSortField,
    sortDirection: SortDirection,
    filter: PostFilter
  ): [Post!]!

  # Search across multiple types
  search(query: String!): [SearchResult!]!
}

# Union type for search results
union SearchResult = User | Post | Comment

# Enum for sort field options
enum PostSortField {
  CREATED_AT
  TITLE
  COMMENT_COUNT
}

enum SortDirection {
  ASC
  DESC
}

# Input type for filtering
input PostFilter {
  published: Boolean
  authorId: ID
  tags: [String!]
}
```

### Mutation Definitions

```graphql
type Mutation {
  # User mutations
  createUser(input: CreateUserInput!): UserPayload!
  updateUser(id: ID!, input: UpdateUserInput!): UserPayload!
  deleteUser(id: ID!): DeletePayload!

  # Post mutations
  createPost(input: CreatePostInput!): PostPayload!
  updatePost(id: ID!, input: UpdatePostInput!): PostPayload!
  deletePost(id: ID!): DeletePayload!
  publishPost(id: ID!): PostPayload!

  # Comment mutations
  addComment(postId: ID!, input: AddCommentInput!): CommentPayload!
  deleteComment(id: ID!): DeletePayload!
}

# Input types
input CreateUserInput {
  username: String!
  email: String!
  password: String!
}

input UpdateUserInput {
  username: String
  email: String
  profile: ProfileInput
}

input ProfileInput {
  fullName: String
  bio: String
  avatarUrl: String
  socialLinks: [SocialLinkInput!]
}

input SocialLinkInput {
  platform: String!
  url: String!
}

input CreatePostInput {
  title: String!
  content: String!
  published: Boolean
  tags: [String!]
}

input UpdatePostInput {
  title: String
  content: String
  published: Boolean
  tags: [String!]
}

input AddCommentInput {
  content: String!
}

# Response payloads with error handling
type UserPayload {
  user: User
  errors: [Error!]
}

type PostPayload {
  post: Post
  errors: [Error!]
}

type CommentPayload {
  comment: Comment
  errors: [Error!]
}

type DeletePayload {
  success: Boolean!
  errors: [Error!]
}

type Error {
  message: String!
  path: [String!]
}
```

### Subscription Definitions

```graphql
type Subscription {
  postAdded: Post!
  commentAdded(postId: ID!): Comment!
  userActivity(userId: ID!): UserActivity!
}

type UserActivity {
  userId: ID!
  action: String!
  timestamp: DateTime!
}
```

## Schema Implementation

### Setting Up Apollo Server

```javascript
const { ApolloServer } = require('apollo-server-express');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const express = require('express');
const { typeDefs } = require('./schema');
const { resolvers } = require('./resolvers');

async function startServer() {
  const app = express();

  // Create executable schema
  const schema = makeExecutableSchema({
    typeDefs,
    resolvers
  });

  // Create Apollo Server
  const server = new ApolloServer({
    schema,
    context: ({ req }) => {
      // Create context for each request
      const token = req.headers.authorization || '';
      const user = getUser(token);

      return {
        user,
        models: {
          User: require('./models/user'),
          Post: require('./models/post'),
          Comment: require('./models/comment')
        },
        loaders: createLoaders() // For DataLoader implementation
      };
    },
    formatError: (error) => {
      // Log server errors
      if (error.originalError) {
        console.error(error);
      }

      // Return formatted error to client
      return {
        message: error.message,
        path: error.path,
        locations: error.locations,
        // Don't expose internal errors to clients in production
        extensions: process.env.NODE_ENV === 'production'
          ? undefined
          : error.extensions
      };
    }
  });

  // Start the server
  await server.start();

  // Apply middleware
  server.applyMiddleware({ app });

  // Start Express server
  app.listen({ port: 4000 }, () => {
    console.log(`Server ready at http://localhost:4000${server.graphqlPath}`);
  });
}

startServer();
```

## Resolver Implementation

Resolvers provide the logic for turning GraphQL operations into data.

### Basic Resolver Structure

```javascript
const resolvers = {
  // Top-level Query resolvers
  Query: {
    user: async (parent, args, context, info) => {
      return context.models.User.findById(args.id);
    },
    users: async (parent, args, context, info) => {
      const { limit = 10, offset = 0 } = args;
      return context.models.User.findAll({ limit, offset });
    },
    me: async (parent, args, context, info) => {
      // Authentication check
      if (!context.user) {
        throw new Error('Authentication required');
      }

      return context.models.User.findById(context.user.id);
    },
    post: async (parent, args, context, info) => {
      return context.models.Post.findById(args.id);
    },
    posts: async (parent, args, context, info) => {
      const { limit = 10, offset = 0, sortBy, sortDirection, filter = {} } = args;

      // Build query options
      const options = {
        limit,
        offset,
        where: {}
      };

      // Apply filters
      if (filter.published !== undefined) {
        options.where.published = filter.published;
      }

      if (filter.authorId) {
        options.where.authorId = filter.authorId;
      }

      if (filter.tags && filter.tags.length > 0) {
        options.where.tags = { $overlap: filter.tags };
      }

      // Apply sorting
      if (sortBy) {
        const direction = sortDirection === 'DESC' ? 'DESC' : 'ASC';

        switch (sortBy) {
          case 'CREATED_AT':
            options.order = [['createdAt', direction]];
            break;
          case 'TITLE':
            options.order = [['title', direction]];
            break;
          case 'COMMENT_COUNT':
            // This would require a more complex query with a join or subquery
            options.include = [{
              model: 'Comment',
              attributes: []
            }];
            options.group = ['Post.id'];
            options.order = [[sequelize.fn('COUNT', sequelize.col('Comments.id')), direction]];
            break;
        }
      }

      return context.models.Post.findAll(options);
    },
    search: async (parent, args, context, info) => {
      const { query } = args;

      // Implement search across multiple types
      const [users, posts, comments] = await Promise.all([
        context.models.User.search(query),
        context.models.Post.search(query),
        context.models.Comment.search(query)
      ]);

      // Combine results
      return [
        ...users,
        ...posts,
        ...comments
      ];
    }
  },

  // Top-level Mutation resolvers
  Mutation: {
    createUser: async (parent, args, context, info) => {
      try {
        const user = await context.models.User.create(args.input);
        return { user };
      } catch (error) {
        return {
          user: null,
          errors: [{ message: error.message, path: ['createUser'] }]
        };
      }
    },
    updateUser: async (parent, args, context, info) => {
      try {
        // Authentication and authorization check
        if (!context.user) {
          throw new Error('Authentication required');
        }

        if (context.user.id !== args.id && !context.user.isAdmin) {
          throw new Error('Not authorized');
        }

        const user = await context.models.User.findById(args.id);

        if (!user) {
          throw new Error('User not found');
        }

        // Update user
        await user.update(args.input);

        // If profile is included, update it too
        if (args.input.profile) {
          await user.getProfile().then(profile => {
            if (profile) {
              return profile.update(args.input.profile);
            } else {
              return user.createProfile(args.input.profile);
            }
          });
        }

        // Fetch updated user with profile
        const updatedUser = await context.models.User.findById(args.id, {
          include: 'profile'
        });

        return { user: updatedUser };
      } catch (error) {
        return {
          user: null,
          errors: [{ message: error.message, path: ['updateUser'] }]
        };
      }
    },
    // More mutation resolvers...
  },

  // Type resolvers
  User: {
    posts: async (parent, args, context, info) => {
      // parent is the User object
      return context.loaders.postsByUserId.load(parent.id);
    },
    profile: async (parent, args, context, info) => {
      return context.loaders.profileByUserId.load(parent.id);
    }
  },

  Post: {
    author: async (parent, args, context, info) => {
      // parent is the Post object
      return context.loaders.userById.load(parent.authorId);
    },
    comments: async (parent, args, context, info) => {
      return context.loaders.commentsByPostId.load(parent.id);
    }
  },

  Comment: {
    author: async (parent, args, context, info) => {
      return context.loaders.userById.load(parent.authorId);
    },
    post: async (parent, args, context, info) => {
      return context.loaders.postById.load(parent.postId);
    }
  },

  // Union type resolver
  SearchResult: {
    __resolveType(obj) {
      if (obj.username) return 'User';
      if (obj.title) return 'Post';
      if (obj.content && obj.postId) return 'Comment';
      return null;
    },
  },
};
```

## Batching with DataLoader

To prevent the N+1 query problem, use DataLoader:

```javascript
const DataLoader = require('dataloader');

function createLoaders() {
  return {
    // Load users by ID
    userById: new DataLoader(async (ids) => {
      const users = await User.findAll({
        where: { id: { $in: ids } }
      });

      // Return users in the same order as the ids
      return ids.map(id => users.find(user => user.id === id) || null);
    }),

    // Load posts by user ID
    postsByUserId: new DataLoader(async (userIds) => {
      const posts = await Post.findAll({
        where: { authorId: { $in: userIds } }
      });

      // Group posts by user ID
      const postsByUserId = {};
      posts.forEach(post => {
        if (!postsByUserId[post.authorId]) {
          postsByUserId[post.authorId] = [];
        }
        postsByUserId[post.authorId].push(post);
      });

      // Return posts for each user ID
      return userIds.map(userId => postsByUserId[userId] || []);
    }),

    // Load profiles by user ID
    profileByUserId: new DataLoader(async (userIds) => {
      const profiles = await Profile.findAll({
        where: { userId: { $in: userIds } }
      });

      // Return profiles in the same order as the user ids
      return userIds.map(userId => profiles.find(profile => profile.userId === userId) || null);
    }),

    // More loaders...
  };
}
```

## Authentication and Authorization

### Authentication

```javascript
// Authentication middleware
function getUser(token) {
  if (!token) return null;

  try {
    // Remove "Bearer " prefix
    const actualToken = token.replace('Bearer ', '');
    // Verify JWT
    const decoded = jwt.verify(actualToken, process.env.JWT_SECRET);

    return {
      id: decoded.userId,
      isAdmin: decoded.isAdmin || false
    };
  } catch (error) {
    // Invalid token
    return null;
  }
}

// Login mutation
const resolvers = {
  Mutation: {
    login: async (parent, args, context) => {
      const { email, password } = args;

      // Find user by email
      const user = await User.findOne({ where: { email } });

      // Check if user exists
      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.passwordHash);

      if (!validPassword) {
        throw new Error('Invalid credentials');
      }

      // Generate JWT
      const token = jwt.sign(
        { userId: user.id, isAdmin: user.isAdmin },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      return {
        token,
        user
      };
    }
  }
};
```

### Authorization

```javascript
// Authorization directive
const { mapSchema, getDirective, MapperKind } = require('@graphql-tools/utils');
const { defaultFieldResolver } = require('graphql');

function authDirectiveTransformer(schema, directiveName) {
  return mapSchema(schema, {
    // Apply directive to field level
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      // Check if this field has the directive
      const authDirective = getDirective(schema, fieldConfig, directiveName)?.[0];

      if (authDirective) {
        // Get required roles from directive
        const { requires } = authDirective;

        // Get original field resolver
        const originalResolver = fieldConfig.resolve || defaultFieldResolver;

        // Replace resolver with auth check
        fieldConfig.resolve = async function(parent, args, context, info) {
          // Check if user is authenticated
          if (!context.user) {
            throw new Error('Authentication required');
          }

          // If roles are required, check them
          if (requires && requires.length > 0) {
            const hasRole = await checkUserRoles(context.user.id, requires);

            if (!hasRole) {
              throw new Error(`Access denied. Required roles: ${requires.join(', ')}`);
            }
          }

          // If all checks pass, run original resolver
          return originalResolver(parent, args, context, info);
        };

        return fieldConfig;
      }
    }
  });
}

// Usage in schema
const typeDefs = gql`
  directive @auth(requires: [Role!] = []) on FIELD_DEFINITION | OBJECT

  enum Role {
    ADMIN
    EDITOR
    USER
  }

  type Query {
    publicData: String
    userData: String @auth
    adminData: String @auth(requires: [ADMIN])
  }
`;

// Apply directive to schema
let schema = makeExecutableSchema({ typeDefs, resolvers });
schema = authDirectiveTransformer(schema, 'auth');
```

## Error Handling

### Error Types and Formatting

```javascript
// Custom error classes
class ValidationError extends Error {
  constructor(message, fields) {
    super(message);
    this.name = 'ValidationError';
    this.fields = fields;
  }
}

class AuthenticationError extends Error {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
    this.code = 'UNAUTHENTICATED';
  }
}

class AuthorizationError extends Error {
  constructor(message = 'Not authorized') {
    super(message);
    this.name = 'AuthorizationError';
    this.code = 'FORBIDDEN';
  }
}

// Apollo Server error formatting
const server = new ApolloServer({
  typeDefs,
  resolvers,
  formatError: (err) => {
    // Log internal errors
    if (err.originalError) {
      console.error(err);
    }

    // Format validation errors
    if (err.originalError instanceof ValidationError) {
      return {
        message: err.message,
        extensions: {
          code: 'BAD_USER_INPUT',
          fields: err.originalError.fields
        }
      };
    }

    // Format authentication errors
    if (err.originalError instanceof AuthenticationError) {
      return {
        message: err.message,
        extensions: {
          code: err.originalError.code
        }
      };
    }

    // Format authorization errors
    if (err.originalError instanceof AuthorizationError) {
      return {
        message: err.message,
        extensions: {
          code: err.originalError.code
        }
      };
    }

    // Default error format
    return {
      message: err.message,
      path: err.path,
      extensions: process.env.NODE_ENV === 'production'
        ? { code: err.extensions?.code || 'INTERNAL_SERVER_ERROR' }
        : err.extensions
    };
  }
});
```

### Response Payloads with Errors

Using response payloads with built-in error fields:

```javascript
// Mutation resolver
const resolvers = {
  Mutation: {
    createPost: async (parent, args, context) => {
      try {
        // Validate input
        const { title, content } = args.input;
        const errors = [];

        if (!title) {
          errors.push({ message: 'Title is required', path: ['input', 'title'] });
        }

        if (!content) {
          errors.push({ message: 'Content is required', path: ['input', 'content'] });
        }

        if (errors.length > 0) {
          return { post: null, errors };
        }

        // Authentication check
        if (!context.user) {
          return {
            post: null,
            errors: [{ message: 'Authentication required', path: ['createPost'] }]
          };
        }

        // Create post
        const post = await context.models.Post.create({
          ...args.input,
          authorId: context.user.id
        });

        return { post, errors: [] };
      } catch (error) {
        return {
          post: null,
          errors: [{ message: error.message, path: ['createPost'] }]
        };
      }
    }
  }
};
```

## Testing GraphQL APIs

### Setting up Testing Environment

```javascript
const { createTestClient } = require('apollo-server-testing');
const { ApolloServer } = require('apollo-server-express');
const { typeDefs, resolvers } = require('../src/schema');
const { models } = require('../src/models');

// Mock data
const mockUsers = [/* mock users */];
const mockPosts = [/* mock posts */];

// Mock context
const context = {
  user: { id: '1', isAdmin: false },
  models: {
    User: {
      findById: jest.fn((id) => mockUsers.find(user => user.id === id)),
      findAll: jest.fn(() => mockUsers)
    },
    Post: {
      findById: jest.fn((id) => mockPosts.find(post => post.id === id)),
      findAll: jest.fn(() => mockPosts),
      create: jest.fn((data) => ({ id: '999', ...data }))
    }
  },
  loaders: {
    userById: {
      load: jest.fn((id) => mockUsers.find(user => user.id === id))
    },
    postsByUserId: {
      load: jest.fn((userId) => mockPosts.filter(post => post.authorId === userId))
    }
  }
};

// Create test server
function createTestServer(ctx = {}) {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: () => ({ ...context, ...ctx })
  });

  return createTestClient(server);
}
```

### Writing Tests

```javascript
const { gql } = require('apollo-server-express');

describe('User queries', () => {
  test('gets user by id', async () => {
    const { query } = createTestServer();

    const GET_USER = gql`
      query GetUser($id: ID!) {
        user(id: $id) {
          id
          username
          email
        }
      }
    `;

    const res = await query({
      query: GET_USER,
      variables: { id: '1' }
    });

    expect(res.errors).toBeUndefined();
    expect(res.data.user).toEqual({
      id: '1',
      username: 'testuser',
      email: 'test@example.com'
    });
  });
});

describe('Post mutations', () => {
  test('creates a new post', async () => {
    const { mutate } = createTestServer();

    const CREATE_POST = gql`
      mutation CreatePost($input: CreatePostInput!) {
        createPost(input: $input) {
          post {
            id
            title
            content
          }
          errors {
            message
            path
          }
        }
      }
    `;

    const res = await mutate({
      mutation: CREATE_POST,
      variables: {
        input: {
          title: 'Test Post',
          content: 'This is a test post',
          published: true
        }
      }
    });

    expect(res.errors).toBeUndefined();
    expect(res.data.createPost.errors).toEqual([]);
    expect(res.data.createPost.post).toEqual({
      id: '999',
      title: 'Test Post',
      content: 'This is a test post'
    });
  });

  test('handles validation errors', async () => {
    const { mutate } = createTestServer();

    const CREATE_POST = gql`
      mutation CreatePost($input: CreatePostInput!) {
        createPost(input: $input) {
          post {
            id
          }
          errors {
            message
            path
          }
        }
      }
    `;

    const res = await mutate({
      mutation: CREATE_POST,
      variables: {
        input: {
          // Missing required title
          content: 'This is a test post'
        }
      }
    });

    expect(res.errors).toBeUndefined();
    expect(res.data.createPost.post).toBeNull();
    expect(res.data.createPost.errors).toContainEqual({
      message: 'Title is required',
      path: ['input', 'title']
    });
  });
});
```

## Performance Considerations

### Cost Analysis

Implement query cost analysis to protect against expensive queries:

```javascript
const { createComplexityLimitRule } = require('graphql-query-complexity');

const server = new ApolloServer({
  typeDefs,
  resolvers,
  validationRules: [
    createComplexityLimitRule(1000, {
      // Customize field costs
      scalarCost: 1,
      objectCost: 2,
      listFactor: 10,
      // Field-specific costs
      fieldConfigEstimator: (type, field) => {
        if (field.name === 'posts' || field.name === 'comments') {
          return 10;
        }
        return 1;
      }
    })
  ]
});
```

### Query Depth Limiting

Prevent deeply nested queries:

```javascript
const { depthLimit } = require('graphql-depth-limit');

const server = new ApolloServer({
  typeDefs,
  resolvers,
  validationRules: [
    depthLimit(7) // Limit query depth to 7 levels
  ]
});
```

### Persisted Queries

For production APIs, use persisted queries:

```javascript
const { ApolloServer } = require('apollo-server-express');
const { MemcachedCache } = require('apollo-server-cache-memcached');

const server = new ApolloServer({
  typeDefs,
  resolvers,
  persistedQueries: {
    cache: new MemcachedCache(
      ['memcached-server-1', 'memcached-server-2'],
      { retries: 10, retry: 10000 }
    )
  }
});
```

## Best Practices for GraphQL API Design

1. **Design schema from the client's perspective**
2. **Use meaningful types and fields** - Names should be intuitive and consistent
3. **Apply the principle of least privilege** - Only expose data clients need
4. **Use connection pattern for pagination** - Cursor-based pagination scales better
5. **Leverage input types** for complex arguments
6. **Return response payloads** with errors for mutations
7. **Implement proper authentication and authorization**
8. **Use DataLoader for batching** and avoiding N+1 queries
9. **Limit query complexity and depth**
10. **Add descriptions to schema** for better documentation

---

**Navigation**
- [⬅️ Previous: RESTful API Design](./rest-design.md)
- [⬆️ Up to API Design](./README.md)
- [➡️ Next: REST Optimization](./rest-optimization.md)