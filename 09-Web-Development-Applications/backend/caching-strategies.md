# Caching Strategies

**Navigation:** [🏠 Home](../../README.md) > [🌐 Web Development Applications](../README.md) > [🖥️ Backend Systems](./README.md) > Caching Strategies

## In-Memory Caching

### Problem: Repeated Expensive Operations

Many backend operations repeatedly perform the same expensive calculations or database queries:

```javascript
// Without caching - O(n) database operation on every request
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    // Expensive database aggregation
    const userStats = await User.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Another expensive operation
    const revenueStats = await Order.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      users: userStats,
      revenue: revenueStats[0].total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Solution: Function Memoization

For pure functions, memoization can dramatically improve performance by caching results:

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
const getUserStats = memoize(async () => {
  return await User.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
});

const getRevenueStatistics = memoize(async () => {
  const result = await Order.aggregate([
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  return result[0].total;
});

app.get('/api/dashboard/stats', async (req, res) => {
  try {
    // Now these will use cached results after the first call
    const [userStats, revenueTotal] = await Promise.all([
      getUserStats(),
      getRevenueStatistics()
    ]);

    res.json({
      users: userStats,
      revenue: revenueTotal
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Better Solution: Distributed Caching with Redis

For multi-server environments, use a distributed cache like Redis:

```javascript
const redis = require('redis');
const { promisify } = require('util');
const client = redis.createClient(process.env.REDIS_URL);
const getAsync = promisify(client.get).bind(client);
const setAsync = promisify(client.set).bind(client);

// Cache middleware
async function cacheMiddleware(req, res, next) {
  const cacheKey = `api:${req.originalUrl}`;
  try {
    // Try to get from cache first
    const cachedData = await getAsync(cacheKey);
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    // Store the original res.json method
    const originalJson = res.json;

    // Override res.json method to cache the response
    res.json = function(data) {
      // Cache the data with 5 minute expiry
      setAsync(cacheKey, JSON.stringify(data), 'EX', 300);

      // Call the original method
      return originalJson.call(this, data);
    };

    next();
  } catch (error) {
    console.error('Cache error:', error);
    next(); // Continue without caching
  }
}

// Apply cache middleware to dashboard endpoints
app.get('/api/dashboard/stats', cacheMiddleware, async (req, res) => {
  try {
    const userStats = await User.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const revenueStats = await Order.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      users: userStats,
      revenue: revenueStats[0].total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Server-Side Rendering Caching

### Problem: Rendering for Each Request

Server-side rendering (SSR) can be CPU-intensive when done for every request:

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
```

### Solution: Cache Rendered Content

Cache the rendered HTML to avoid repeated rendering:

```javascript
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

## Database Query Caching

### Problem: Repeated Identical Queries

Database queries are often a bottleneck in web applications:

```javascript
// Without query caching - database hit every time
app.get('/api/popular-products', async (req, res) => {
  try {
    const products = await Product.findAll({
      order: [['viewCount', 'DESC']],
      limit: 10
    });

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Solution: Query Result Caching

Use a time-based cache for query results that change infrequently:

```javascript
const queryCache = {};
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

async function cachedQuery(queryFn, cacheKey, ttl = CACHE_TTL) {
  const now = Date.now();

  // Check if we have a valid cached result
  if (queryCache[cacheKey] && queryCache[cacheKey].expiry > now) {
    return queryCache[cacheKey].data;
  }

  // Execute the query
  const result = await queryFn();

  // Cache the result
  queryCache[cacheKey] = {
    data: result,
    expiry: now + ttl
  };

  return result;
}

// Set up cache cleanup interval
setInterval(() => {
  const now = Date.now();
  Object.keys(queryCache).forEach(key => {
    if (queryCache[key].expiry <= now) {
      delete queryCache[key];
    }
  });
}, 60000); // Check every minute

app.get('/api/popular-products', async (req, res) => {
  try {
    const products = await cachedQuery(
      () => Product.findAll({
        order: [['viewCount', 'DESC']],
        limit: 10
      }),
      'popular-products'
    );

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Cache Invalidation Strategies

### Time-Based Invalidation

Set expiration times on cached items:

```javascript
// Auto-expires after TTL
redis.set('key', 'value', 'EX', 3600); // Expires in 1 hour
```

### Event-Based Invalidation

Clear cache when data changes:

```javascript
// When a product is updated
app.put('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    await product.update(req.body);

    // Invalidate related caches
    redis.del(`product:${req.params.id}`);
    redis.del('popular-products');

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Pattern-Based Invalidation

Clear multiple cache entries matching a pattern:

```javascript
// Redis SCAN + DEL to remove all product-related cache
async function invalidateProductCache() {
  const scanAsync = promisify(client.scan).bind(client);
  let cursor = '0';

  do {
    // Scan for keys matching pattern
    const reply = await scanAsync(cursor, 'MATCH', 'product:*');
    cursor = reply[0];
    const keys = reply[1];

    if (keys.length) {
      // Delete all matching keys
      await promisify(client.del).bind(client)(...keys);
    }
  } while (cursor !== '0');
}
```

## Performance Tips for Caching

1. **Cache at multiple levels** - Browser, CDN, Application, Database
2. **Use appropriate TTLs** - Balance freshness vs. performance
3. **Implement stale-while-revalidate** - Serve stale content while refreshing
4. **Use cache stampede prevention** - Avoid multiple simultaneous cache rebuilds
5. **Monitor cache hit rates** - Optimize based on actual usage
6. **Consider memory limits** - Don't exhaust server memory with in-memory caches

---

**Navigation**
- [⬅️ Back to Backend Systems](./README.md)
- [➡️ Next: Authentication Optimization](./authentication.md)