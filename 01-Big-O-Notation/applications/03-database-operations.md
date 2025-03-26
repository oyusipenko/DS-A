# Database Operations

**Navigation:** [🏠 Home](../../README.md) > [📚 Big O Notation](../README.md) > [🌐 Applications](./README.md) > Database Operations

This document explores how Big O notation applies to database operations in web development, focusing on query optimization, indexing, and schema design.

## Query Optimization

### Indexing Strategies

**Inefficient: Full table scan (O(n))**
```sql
-- Finding a user by email with no index
SELECT * FROM users WHERE email = 'user@example.com';
```

**Optimized: Indexed lookup (O(log n) or O(1))**
```sql
-- Create an index on the email column
CREATE INDEX idx_users_email ON users(email);

-- Now this query uses the index for fast lookups
SELECT * FROM users WHERE email = 'user@example.com';
```

**JavaScript Implementation:**
```javascript
// MongoDB example of creating an index
db.users.createIndex({ email: 1 }, { unique: true });

// Using the index in a query
const user = await User.findOne({ email: 'user@example.com' });
```

### Query Execution Plan Evaluation

```javascript
// PostgreSQL execution plan analysis
const analyzeSlow = async (pool) => {
  const result = await pool.query(`
    EXPLAIN ANALYZE
    SELECT orders.*, users.name
    FROM orders
    JOIN users ON orders.user_id = users.id
    WHERE orders.created_at > '2023-01-01'
    ORDER BY orders.total_amount DESC
  `);

  console.log(result.rows);
  // Output helps identify where time is spent:
  // - Sequential scans vs. index scans
  // - Sort operations
  // - Join algorithms
};

// After seeing the query plan, we can add indexes to optimize
const addIndexes = async (pool) => {
  await pool.query(`
    CREATE INDEX idx_orders_created_at ON orders(created_at);
    CREATE INDEX idx_orders_total_amount ON orders(total_amount);
  `);
};
```

### Join Operations and Their Complexity

```javascript
// Mongoose (MongoDB) - inefficient multiple queries (N+1 problem)
const getOrdersWithUserDetails = async () => {
  const orders = await Order.find({ status: 'completed' });

  // For each order, make a separate query to get user details
  // O(n) queries where n is the number of orders
  for (const order of orders) {
    order.userDetails = await User.findById(order.userId);
  }

  return orders;
};

// Mongoose - optimized with population (equivalent to a join)
const getOrdersWithUserDetailsOptimized = async () => {
  // Single query with referenced document population - O(1) queries
  const orders = await Order.find({ status: 'completed' })
    .populate('userId', 'name email'); // Only fetch needed fields

  return orders;
};

// SQL JOIN example (Sequelize ORM)
const getOrdersWithUserDetailsSQL = async () => {
  // Single query with JOIN - O(1) queries
  const orders = await Order.findAll({
    where: { status: 'completed' },
    include: [{
      model: User,
      attributes: ['name', 'email'] // Only fetch needed fields
    }]
  });

  return orders;
};
```

## Caching Strategies

### Multi-level Caching

```javascript
class MultiLevelCache {
  constructor() {
    // L1: In-memory cache (fastest, limited size)
    this.memoryCache = new Map();
    this.memoryCacheTTL = 60 * 1000; // 1 minute

    // L2: Redis cache (medium speed, larger size)
    this.redisClient = redis.createClient();
    this.redisTTL = 10 * 60; // 10 minutes

    // Setup cache cleanup interval
    setInterval(() => this.cleanupMemoryCache(), 30 * 1000);
  }

  async get(key) {
    // Check L1 cache first (O(1) lookup)
    if (this.memoryCache.has(key)) {
      const { value, expiry } = this.memoryCache.get(key);
      if (expiry > Date.now()) {
        return value;
      }
      this.memoryCache.delete(key); // Expired, remove it
    }

    // Check L2 cache (O(1) lookup but network latency)
    try {
      const value = await this.redisClient.get(key);
      if (value) {
        // Store in memory cache for faster subsequent access
        this.setMemoryCache(key, JSON.parse(value));
        return JSON.parse(value);
      }
    } catch (error) {
      console.error('Redis error:', error);
      // Continue to data source on error
    }

    return null; // Not found in any cache
  }

  async set(key, value, options = {}) {
    // Set in memory cache
    this.setMemoryCache(key, value);

    // Set in Redis cache
    try {
      await this.redisClient.setex(
        key,
        options.ttl || this.redisTTL,
        JSON.stringify(value)
      );
    } catch (error) {
      console.error('Redis error:', error);
    }

    return true;
  }

  setMemoryCache(key, value) {
    this.memoryCache.set(key, {
      value,
      expiry: Date.now() + this.memoryCacheTTL
    });
  }

  cleanupMemoryCache() {
    const now = Date.now();
    for (const [key, { expiry }] of this.memoryCache.entries()) {
      if (expiry <= now) {
        this.memoryCache.delete(key);
      }
    }
  }
}

// Usage example for database query caching
async function getUserById(userId) {
  const cache = new MultiLevelCache();
  const cacheKey = `user:${userId}`;

  // Try to get from cache first
  let user = await cache.get(cacheKey);

  if (!user) {
    // Cache miss, fetch from database
    user = await User.findByPk(userId);

    if (user) {
      // Store in cache for future requests
      await cache.set(cacheKey, user);
    }
  }

  return user;
}
```

## Data Modeling

### Normalized vs. Denormalized Schemas

**Normalized (reduces redundancy, may require joins):**
```javascript
// Three separate collections/tables with references

// Users collection
{
  "_id": "user1",
  "name": "John Doe",
  "email": "john@example.com"
}

// Products collection
{
  "_id": "product1",
  "name": "Laptop",
  "price": 999.99
}

// Orders collection
{
  "_id": "order1",
  "userId": "user1",
  "items": [
    { "productId": "product1", "quantity": 1 }
  ]
}

// Reading an order with product and user details requires joins (slower reads)
```

**Denormalized (faster reads, some redundancy):**
```javascript
// Orders collection with embedded data
{
  "_id": "order1",
  "user": {
    "id": "user1",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "items": [
    {
      "id": "product1",
      "name": "Laptop",
      "price": 999.99,
      "quantity": 1
    }
  ]
}

// Reading an order with all details requires no joins (O(1) lookup)
```

### Schema Design for Access Patterns

```javascript
// MongoDB schema design for frequently accessed data
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  // Embedding frequent data (address) to avoid joins
  address: {
    street: String,
    city: String,
    state: String,
    zip: String
  },
  // Reference rarely accessed data
  orderIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
  // Storing computed data to avoid calculations
  totalSpent: Number,
  orderCount: Number
});

// When orders change, update computed fields
async function updateUserStats(userId) {
  const orders = await Order.find({ userId });
  const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);

  await User.findByIdAndUpdate(userId, {
    totalSpent,
    orderCount: orders.length
  });
}
```

## Performance Tips

1. **Always add indexes for search fields** - Turn O(n) lookups into O(log n)
2. **Choose the right database type** - SQL vs. NoSQL based on access patterns
3. **Denormalize for read-heavy applications** - Avoid costly joins
4. **Normalize for write-heavy applications** - Avoid update anomalies
5. **Use caching wisely** - Implement multi-level caching with appropriate TTLs
6. **Monitor and analyze queries** - Use EXPLAIN to find slow operations
7. **Consider sharding for very large datasets** - Distribute data across nodes
8. **Implement connection pooling** - Reuse database connections

---

**Navigation**
- [⬅️ Previous: Backend Systems](./02-backend-systems.md)
- [⬆️ Up to Applications](./README.md)
- [➡️ Next: API Design](./04-api-design.md)