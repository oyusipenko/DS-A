# API Design

**Navigation:** [🏠 Home](../../README.md) > [📚 Big O Notation](../README.md) > [🌐 Applications](./README.md) > API Design

This document explores how Big O notation applies to API design in web development, focusing on REST and GraphQL patterns, pagination, and rate limiting.

## RESTful API Complexity

### Endpoint Design and Complexity

```javascript
// Express.js REST API examples

// Inefficient: Multiple endpoints with duplicate logic - O(n) endpoints
app.get('/users/:id', getUserById);
app.get('/users/:id/profile', getUserProfile);
app.get('/users/:id/settings', getUserSettings);
app.get('/users/:id/preferences', getUserPreferences);
app.get('/users/:id/notifications', getUserNotifications);

// Optimized: Query parameter approach - O(1) endpoints with conditional logic
app.get('/users/:id', (req, res) => {
  const { id } = req.params;
  const { include } = req.query;

  // Base user data
  const userData = getUserById(id);

  // Conditionally include related data based on query params
  if (include) {
    const includes = include.split(',');

    if (includes.includes('profile')) {
      userData.profile = getUserProfile(id);
    }

    if (includes.includes('settings')) {
      userData.settings = getUserSettings(id);
    }

    if (includes.includes('preferences')) {
      userData.preferences = getUserPreferences(id);
    }

    if (includes.includes('notifications')) {
      userData.notifications = getUserNotifications(id);
    }
  }

  res.json(userData);
});
```

### Batch Operations for Multiple Resources

```javascript
// Inefficient: Individual creation - O(n) requests
// POST /api/users/1/tasks
// POST /api/users/1/tasks
// POST /api/users/1/tasks

// Optimized: Batch creation - O(1) requests
app.post('/api/users/:userId/tasks/batch', (req, res) => {
  const { userId } = req.params;
  const { tasks } = req.body; // Array of tasks to create

  if (!Array.isArray(tasks)) {
    return res.status(400).json({ error: 'Tasks must be an array' });
  }

  // Process all tasks in a single database operation
  const createdTasks = createMultipleTasks(userId, tasks);

  res.status(201).json(createdTasks);
});
```

## GraphQL Performance

### Query Complexity Analysis

```javascript
// Apollo Server GraphQL complexity analysis
const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [
    {
      requestDidStart() {
        return {
          didResolveOperation({ request, document }) {
            const complexity = getQueryComplexity({
              schema,
              operationName: request.operationName,
              query: document,
              variables: request.variables,
              estimators: [
                // Assign complexity values to field types
                fieldExtensionsEstimator(),
                // Simpler version: count field
                simpleEstimator({ defaultComplexity: 1 }),
              ],
            });

            // Reject overly complex queries
            if (complexity > 100) {
              throw new Error(
                `Query is too complex: ${complexity}. Maximum allowed complexity: 100`
              );
            }

            console.log('Query complexity:', complexity);
          },
        };
      },
    },
  ],
});
```

### Efficient Data Fetching

```javascript
// GraphQL resolvers with DataLoader for batching and caching

const userLoader = new DataLoader(async (ids) => {
  console.log('Batch loading users:', ids);

  // Instead of N separate database queries, make a single query
  const users = await User.find({ _id: { $in: ids } });

  // Make sure returned users are in the same order as requested ids
  const userMap = {};
  users.forEach(user => {
    userMap[user._id.toString()] = user;
  });

  // Return users in the order of the requested ids
  return ids.map(id => userMap[id.toString()] || null);
});

const resolvers = {
  Query: {
    user: (_, { id }) => userLoader.load(id),
    users: (_, { ids }) => userLoader.loadMany(ids)
  },

  Post: {
    // This will batch all author lookups across posts
    author: (post) => userLoader.load(post.authorId)
  }
};
```

## Pagination and Data Limiting

### Cursor-based Pagination

```javascript
// Express.js API with cursor-based pagination
app.get('/api/posts', async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const cursor = req.query.cursor; // ID of the last item from previous page

  let query = {};
  if (cursor) {
    // Find posts with IDs that come after the cursor
    // This assumes IDs are ordered (e.g., MongoDB ObjectIDs)
    query = { _id: { $gt: cursor } };
  }

  try {
    // Find one more than needed to determine if there's a next page
    const posts = await Post.find(query)
      .sort({ _id: 1 })
      .limit(limit + 1);

    // Check if we have more results
    const hasNextPage = posts.length > limit;

    // Remove the extra item if there are more results
    if (hasNextPage) {
      posts.pop();
    }

    // Get the cursor for the next page
    const nextCursor = hasNextPage ? posts[posts.length - 1]._id : null;

    res.json({
      data: posts,
      pagination: {
        hasNextPage,
        nextCursor
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Offset-based Pagination

```javascript
// Express.js API with offset-based pagination
app.get('/api/products', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  try {
    // Get total count for pagination metadata
    const total = await Product.countDocuments();

    // Get paginated results
    const products = await Product.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      data: products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Rate Limiting

### Token Bucket Algorithm

```javascript
class TokenBucket {
  constructor(capacity, fillRate) {
    this.capacity = capacity;   // Maximum tokens
    this.fillRate = fillRate;   // Tokens added per second
    this.tokens = capacity;     // Current tokens
    this.lastFill = Date.now(); // Last time tokens were added
  }

  consume(tokens = 1) {
    // Fill the bucket based on time elapsed
    this.fillBucket();

    if (this.tokens < tokens) {
      return false; // Not enough tokens
    }

    this.tokens -= tokens;
    return true;
  }

  fillBucket() {
    const now = Date.now();
    const elapsed = (now - this.lastFill) / 1000; // Convert to seconds

    // Calculate tokens to add based on time elapsed
    const newTokens = elapsed * this.fillRate;

    if (newTokens > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + newTokens);
      this.lastFill = now;
    }
  }
}

// Express middleware using the token bucket
const rateLimiter = (req, res, next) => {
  // Get user identifier (IP or user ID if authenticated)
  const identifier = req.user ? req.user.id : req.ip;

  // Create or get token bucket for this user
  if (!req.app.locals.buckets) {
    req.app.locals.buckets = new Map();
  }

  if (!req.app.locals.buckets.has(identifier)) {
    // 10 requests initially, refill at 1 per second
    req.app.locals.buckets.set(identifier, new TokenBucket(10, 1));
  }

  const bucket = req.app.locals.buckets.get(identifier);

  if (bucket.consume()) {
    next();
  } else {
    res.status(429).json({
      error: 'Too Many Requests',
      retryAfter: Math.ceil((1 - bucket.tokens) / bucket.fillRate)
    });
  }
};

// Apply the middleware to routes
app.use('/api', rateLimiter);
```

## Real-time API Considerations

### WebSocket Connection Management

```javascript
class WebSocketManager {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.clients = new Map(); // client ID -> WebSocket
    this.rooms = new Map();   // room ID -> Set of client IDs

    this.setup();
  }

  setup() {
    this.wss.on('connection', (ws) => {
      const clientId = uuidv4();
      this.clients.set(clientId, ws);

      ws.on('message', (message) => {
        this.handleMessage(clientId, JSON.parse(message));
      });

      ws.on('close', () => {
        this.handleDisconnect(clientId);
      });

      // Send client ID to the connected client
      ws.send(JSON.stringify({ type: 'connection', clientId }));
    });
  }

  // Join a specific room
  joinRoom(clientId, roomId) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }

    this.rooms.get(roomId).add(clientId);

    // Notify client that they've joined the room
    const ws = this.clients.get(clientId);
    if (ws) {
      ws.send(JSON.stringify({ type: 'roomJoined', roomId }));
    }
  }

  // Leave a specific room
  leaveRoom(clientId, roomId) {
    if (this.rooms.has(roomId)) {
      this.rooms.get(roomId).delete(clientId);

      // Clean up empty rooms
      if (this.rooms.get(roomId).size === 0) {
        this.rooms.delete(roomId);
      }
    }
  }

  // Send message to all clients in a room
  broadcast(roomId, message, excludeClientId = null) {
    if (!this.rooms.has(roomId)) return;

    for (const clientId of this.rooms.get(roomId)) {
      if (clientId !== excludeClientId) {
        const ws = this.clients.get(clientId);
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(message));
        }
      }
    }
  }

  // Handle incoming messages
  handleMessage(clientId, message) {
    switch (message.type) {
      case 'join':
        this.joinRoom(clientId, message.roomId);
        break;

      case 'leave':
        this.leaveRoom(clientId, message.roomId);
        break;

      case 'message':
        this.broadcast(
          message.roomId,
          {
            type: 'message',
            content: message.content,
            sender: clientId,
            timestamp: Date.now()
          },
          message.excludeSelf ? clientId : null
        );
        break;
    }
  }

  // Clean up when a client disconnects
  handleDisconnect(clientId) {
    // Remove client from all rooms
    for (const [roomId, clients] of this.rooms.entries()) {
      if (clients.has(clientId)) {
        clients.delete(clientId);

        // Notify other clients in the room
        this.broadcast(roomId, {
          type: 'userLeft',
          clientId
        });

        // Clean up empty rooms
        if (clients.size === 0) {
          this.rooms.delete(roomId);
        }
      }
    }

    // Remove from clients map
    this.clients.delete(clientId);
  }
}

// Initialize with Express server
const server = http.createServer(app);
const wsManager = new WebSocketManager(server);

server.listen(3000, () => {
  console.log('Server started on port 3000');
});
```

## Performance Tips

1. **Design APIs with appropriate granularity** - Not too fine-grained (too many endpoints) or too coarse (overfetching)
2. **Use batch operations** - Reduce the number of network requests
3. **Implement pagination** - Limit data transfer size
4. **Use cursor-based pagination for large datasets** - Better performance than offset-based
5. **Implement caching** - Reduce database load and improve response time
6. **Add rate limiting** - Protect against abuse and ensure equitable service
7. **Consider GraphQL for flexible data requirements** - Reduces overfetching
8. **Use DataLoader for optimizing GraphQL resolvers** - Batches and caches database requests
9. **Monitor API performance** - Track response times and identify bottlenecks
10. **Document API complexity** - Help clients understand the cost of their requests

---

**Navigation**
- [⬅️ Previous: Database Operations](./03-database-operations.md)
- [⬆️ Up to Applications](./README.md)
- [➡️ Next: System Design](./05-system-design.md)