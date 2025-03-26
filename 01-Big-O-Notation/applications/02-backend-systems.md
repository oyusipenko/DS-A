# Backend Systems

**Navigation:** [🏠 Home](../../README.md) > [📚 Big O Notation](../README.md) > [🌐 Applications](./README.md) > Backend Systems

This document explores how Big O notation applies to backend web development, focusing on API optimization, authentication, and caching strategies.

## API Endpoint Optimization

### The N+1 Query Problem

**Inefficient Endpoint: O(n²) database queries**
```javascript
// Express route with N+1 query problem
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

**Optimized: Reduce to O(1) database queries with joins or eager loading**
```javascript
// Using Sequelize's include for eager loading
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

## Server-Side Rendering

### Optimizing SSR Performance

```javascript
// Inefficient approach: Rendering for each request
app.get('/products/:id', async (req, res) => {
  try {
    // Fetch product
    const product = await Product.findByPk(req.params.id);

    // Fetch related data
    const relatedProducts = await Product.findAll({
      where: { categoryId: product.categoryId },
      limit: 5
    });

    // Render the page - this happens for every request
    res.render('product', { product, relatedProducts });
  } catch (error) {
    res.status(500).send('Error loading product');
  }
});

// Optimized approach: Caching rendered content
const pageCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

app.get('/products/:id', async (req, res) => {
  const cacheKey = `product-${req.params.id}`;

  // Check cache first - O(1) lookup
  if (pageCache.has(cacheKey)) {
    const { content, expiry } = pageCache.get(cacheKey);
    if (expiry > Date.now()) {
      return res.send(content);
    }
    // Cache expired, delete entry
    pageCache.delete(cacheKey);
  }

  try {
    // Same data fetching as before
    const product = await Product.findByPk(req.params.id);
    const relatedProducts = await Product.findAll({
      where: { categoryId: product.categoryId },
      limit: 5
    });

    // Render the page
    const renderedContent = await renderPage('product', { product, relatedProducts });

    // Store in cache
    pageCache.set(cacheKey, {
      content: renderedContent,
      expiry: Date.now() + CACHE_TTL
    });

    res.send(renderedContent);
  } catch (error) {
    res.status(500).send('Error loading product');
  }
});

// Helper function to render page
function renderPage(template, data) {
  // Actual rendering logic here
  return `<html>...</html>`;
}
```

## Authentication System

**Token Validation: Hashing vs. Database Lookup**

```javascript
// JWT approach - O(1) validation without database
function authenticateJWT(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication token required' });
  }

  try {
    // O(1) operation - validate and decode token without database
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
}

// Session approach - requires database lookup
function authenticateSession(req, res, next) {
  const sessionId = req.cookies.sessionId;

  if (!sessionId) {
    return res.status(401).json({ message: 'Session ID required' });
  }

  // O(1) lookup with indexed sessionId, but still requires a DB call
  Session.findById(sessionId)
    .then(session => {
      if (!session || session.expiresAt < new Date()) {
        return res.status(403).json({ message: 'Invalid or expired session' });
      }

      req.session = session;
      next();
    })
    .catch(error => {
      return res.status(500).json({ message: 'Authentication error' });
    });
}
```

## Caching Strategies

### Memoization for Expensive Operations

```javascript
// Memoized function for expensive calculations - O(1) after first call
function memoize(fn) {
  const cache = new Map();

  return function(...args) {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

// Example: Expensive database aggregation
const getRevenueStatistics = memoize(async (startDate, endDate) => {
  return await Order.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
});

// First call: database query executed
const janStats = await getRevenueStatistics(new Date('2023-01-01'), new Date('2023-01-31'));

// Second call with same params: returns cached result
const sameJanStats = await getRevenueStatistics(new Date('2023-01-01'), new Date('2023-01-31'));
```

### Redis Caching for API Responses

```javascript
const redis = require('redis');
const client = redis.createClient();

// Express middleware for caching API responses
function cacheMiddleware(duration) {
  return (req, res, next) => {
    const key = `__express__${req.originalUrl}`;

    client.get(key, (err, data) => {
      if (data) {
        // Cache hit - O(1) lookup
        return res.send(JSON.parse(data));
      } else {
        // Cache miss
        const originalSend = res.send;

        res.send = function(body) {
          client.setex(key, duration, JSON.stringify(body));
          originalSend.call(this, body);
        };

        next();
      }
    });
  };
}

// Apply the middleware to an API route
app.get('/api/products', cacheMiddleware(300), async (req, res) => {
  const products = await Product.findAll();
  res.json(products);
});
```

## Background Processing

### Job Queue Optimization

```javascript
// Basic queue processing
class JobQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
  }

  // O(1) operation to add a job
  addJob(job) {
    this.queue.push(job);

    if (!this.processing) {
      this.processQueue();
    }
  }

  async processQueue() {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;
    const job = this.queue.shift(); // O(n) operation for large arrays

    try {
      await job.execute();
    } catch (error) {
      console.error('Job failed:', error);
    }

    // Process next job
    this.processQueue();
  }
}

// Optimized queue with priority
class PriorityJobQueue {
  constructor() {
    this.highPriority = [];
    this.normalPriority = [];
    this.lowPriority = [];
    this.processing = false;
  }

  // O(1) operation with constant-time priority selection
  addJob(job, priority = 'normal') {
    switch (priority) {
      case 'high':
        this.highPriority.push(job);
        break;
      case 'normal':
        this.normalPriority.push(job);
        break;
      case 'low':
        this.lowPriority.push(job);
        break;
    }

    if (!this.processing) {
      this.processQueue();
    }
  }

  async processQueue() {
    // Get next job from highest priority queue available
    let job = null;

    if (this.highPriority.length > 0) {
      job = this.highPriority.shift();
    } else if (this.normalPriority.length > 0) {
      job = this.normalPriority.shift();
    } else if (this.lowPriority.length > 0) {
      job = this.lowPriority.shift();
    }

    if (!job) {
      this.processing = false;
      return;
    }

    this.processing = true;

    try {
      await job.execute();
    } catch (error) {
      console.error('Job failed:', error);
      // Could implement retry logic here
    }

    // Process next job
    this.processQueue();
  }
}
```

## Performance Tips

1. **Avoid N+1 queries** - Use joins, eager loading, or GraphQL dataloaders
2. **Implement appropriate caching** - Use Redis, in-memory caching, or CDNs
3. **Use database indexes** - Ensure frequently queried fields are indexed
4. **Implement pagination** - Never return all records at once
5. **Background process heavy tasks** - Move CPU-intensive work to job queues
6. **Use efficient authentication** - JWTs for stateless auth, Redis for sessions
7. **Monitor and profile** - Regularly check for slow endpoints or queries

---

**Navigation**
- [⬅️ Previous: Frontend Performance](./01-frontend-performance.md)
- [⬆️ Up to Applications](./README.md)
- [➡️ Next: Database Operations](./03-database-operations.md)