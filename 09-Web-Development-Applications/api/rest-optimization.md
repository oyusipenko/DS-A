# REST API Optimization

**Navigation:** [🏠 Home](../../README.md) > [🌐 Web Development Applications](../README.md) > [🔌 API Design](./README.md) > REST Optimization

## Understanding REST Performance

REST (Representational State Transfer) APIs are the most common architecture for web services. While inherently stateless and cacheable, many REST implementations don't take full advantage of HTTP's performance features.

This guide explores optimization strategies to make your REST APIs more efficient, focusing on technical implementation rather than theoretical concepts.

## Resource Design Optimization

### Problem: Overfetching and Underfetching

Traditional REST endpoints often return fixed data structures that don't match client needs:

```javascript
// Client needs only username and email, but gets everything
app.get('/api/users/:id', (req, res) => {
  const user = findUserById(req.params.id);
  res.json(user); // Returns full user object with 20+ fields
});
```

### Solution: Field Selection

Allow clients to specify which fields they need:

```javascript
// Express.js implementation
app.get('/api/users/:id', (req, res) => {
  const user = findUserById(req.params.id);

  // Parse fields from query parameter
  const fields = req.query.fields ? req.query.fields.split(',') : null;

  if (fields) {
    const filteredUser = {};
    fields.forEach(field => {
      if (field in user) {
        filteredUser[field] = user[field];
      }
    });
    res.json(filteredUser);
  } else {
    res.json(user);
  }
});
```

Usage:

```http
GET /api/users/123?fields=username,email,avatar_url
```

### Solution: Compound Documents

For related resources, include them in the response to reduce round trips:

```javascript
app.get('/api/posts/:id', async (req, res) => {
  const post = await findPostById(req.params.id);

  // Check if client wants expanded data
  const expand = req.query.expand ? req.query.expand.split(',') : [];

  if (expand.includes('author')) {
    post.author = await findUserById(post.author_id);
    delete post.author_id; // Remove redundant ID
  }

  if (expand.includes('comments')) {
    post.comments = await findCommentsByPostId(post.id);
  }

  res.json(post);
});
```

Usage:

```http
GET /api/posts/42?expand=author,comments
```

Performance benefit: Reduces multiple API calls to a single request.

## HTTP Caching Optimization

### Problem: Redundant API Calls

Without proper HTTP caching, clients repeatedly request the same data:

```javascript
// No caching headers
app.get('/api/products', (req, res) => {
  const products = fetchProducts();
  res.json(products);
});
```

### Solution: ETag Implementation

ETags allow conditional requests to avoid transferring data when it hasn't changed:

```javascript
const crypto = require('crypto');

// Express.js ETag implementation
app.get('/api/products', async (req, res) => {
  const products = await fetchProducts();

  // Generate ETag from response data hash
  const etag = crypto
    .createHash('md5')
    .update(JSON.stringify(products))
    .digest('hex');

  // Check If-None-Match header
  if (req.headers['if-none-match'] === etag) {
    res.status(304).end(); // Not Modified
    return;
  }

  // Set ETag header
  res.setHeader('ETag', etag);
  res.json(products);
});
```

### Solution: Cache-Control Headers

Set appropriate caching policies based on data volatility:

```javascript
// Static reference data that rarely changes
app.get('/api/countries', (req, res) => {
  const countries = fetchCountries();

  // Cache for 1 day (86400 seconds)
  res.setHeader('Cache-Control', 'public, max-age=86400');

  res.json(countries);
});

// Semi-static data that changes occasionally
app.get('/api/categories', (req, res) => {
  const categories = fetchCategories();

  // Cache for 1 hour (3600 seconds), allow revalidation
  res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');

  res.json(categories);
});

// Dynamic data that changes frequently
app.get('/api/products/trending', (req, res) => {
  const products = fetchTrendingProducts();

  // Cache for 5 minutes (300 seconds)
  res.setHeader('Cache-Control', 'public, max-age=300');

  res.json(products);
});

// User-specific data that shouldn't be cached
app.get('/api/users/:id/profile', authenticateJWT, (req, res) => {
  const profile = fetchUserProfile(req.params.id);

  // No caching for authenticated requests
  res.setHeader('Cache-Control', 'private, no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');

  res.json(profile);
});
```

### Solution: Last-Modified Headers

For resources that don't need content hashing:

```javascript
app.get('/api/articles/:id', async (req, res) => {
  const article = await fetchArticle(req.params.id);

  // Get Last-Modified date
  const lastModified = new Date(article.updated_at).toUTCString();

  // Check If-Modified-Since header
  if (req.headers['if-modified-since'] === lastModified) {
    res.status(304).end(); // Not Modified
    return;
  }

  // Set Last-Modified header
  res.setHeader('Last-Modified', lastModified);
  res.json(article);
});
```

## Compression Optimization

### Problem: Large Response Payloads

JSON responses can become large, increasing transfer time and bandwidth costs.

### Solution: Response Compression

```javascript
const express = require('express');
const compression = require('compression');

const app = express();

// Enable compression
app.use(compression({
  // Only compress responses larger than 1KB
  threshold: 1024,
  // Don't compress responses with this content-type
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Use default filter function
    return compression.filter(req, res);
  },
  // Compression level (0-9)
  level: 6
}));

app.get('/api/products', (req, res) => {
  const products = fetchProducts();
  res.json(products);
});
```

Compression ratios for typical API responses:

| Data Type | Uncompressed | Compressed (gzip) | Savings |
|-----------|--------------|-------------------|---------|
| JSON array of objects | 100KB | 12KB | 88% |
| HTML content | 50KB | 8KB | 84% |
| Deep nested JSON | 200KB | 22KB | 89% |

### Solution: Field Filtering for Large Datasets

For large datasets, filter server-side:

```javascript
app.get('/api/logs', (req, res) => {
  // Parse filter parameters
  const filters = {
    level: req.query.level,
    from: req.query.from ? new Date(req.query.from) : null,
    to: req.query.to ? new Date(req.query.to) : null,
    service: req.query.service
  };

  // Apply filters server-side
  const logs = fetchFilteredLogs(filters);

  // Apply compression for large responses
  res.json(logs);
});
```

## Batch Operations

### Problem: Multiple API Calls for Related Operations

Clients often need to perform multiple related operations:

```javascript
// Client needs to make multiple requests
// POST /api/users/1/notifications
// POST /api/users/2/notifications
// POST /api/users/3/notifications
```

### Solution: Bulk Endpoints

```javascript
// Express.js bulk endpoint implementation
app.post('/api/bulk/notifications', async (req, res) => {
  const { notifications } = req.body;

  if (!Array.isArray(notifications)) {
    return res.status(400).json({ error: 'Notifications must be an array' });
  }

  try {
    // Process all notifications in parallel
    const results = await Promise.all(
      notifications.map(async notification => {
        try {
          await createNotification(notification);
          return { status: 'success', data: notification };
        } catch (error) {
          return { status: 'error', error: error.message, data: notification };
        }
      })
    );

    // Check if any operations failed
    const hasErrors = results.some(result => result.status === 'error');

    res.status(hasErrors ? 207 : 200).json({
      results
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

Client usage:

```http
POST /api/bulk/notifications
Content-Type: application/json

{
  "notifications": [
    { "user_id": 1, "message": "New friend request", "priority": "high" },
    { "user_id": 2, "message": "Your post was liked", "priority": "medium" },
    { "user_id": 3, "message": "New comment on your post", "priority": "medium" }
  ]
}
```

### Solution: JSON Patch

For complex updates, use the JSON Patch format (RFC 6902):

```javascript
app.patch('/api/resources/:id', async (req, res) => {
  const resource = await fetchResource(req.params.id);

  // Validate operations are valid JSON Patch
  if (!Array.isArray(req.body)) {
    return res.status(400).json({ error: 'JSON Patch requires an array of operations' });
  }

  try {
    // Apply each operation
    for (const op of req.body) {
      if (!op.op || !op.path) {
        return res.status(400).json({ error: 'Invalid operation' });
      }

      // Extract path components (skip leading slash)
      const pathComponents = op.path.slice(1).split('/');
      let target = resource;

      // Traverse to the target location
      for (let i = 0; i < pathComponents.length - 1; i++) {
        const key = pathComponents[i].replace(/~1/g, '/').replace(/~0/g, '~');
        target = target[key];
      }

      const finalKey = pathComponents[pathComponents.length - 1]
        .replace(/~1/g, '/')
        .replace(/~0/g, '~');

      // Apply operation
      switch (op.op) {
        case 'add':
          if (Array.isArray(target)) {
            if (finalKey === '-') {
              target.push(op.value);
            } else {
              target.splice(parseInt(finalKey), 0, op.value);
            }
          } else {
            target[finalKey] = op.value;
          }
          break;

        case 'remove':
          if (Array.isArray(target)) {
            target.splice(parseInt(finalKey), 1);
          } else {
            delete target[finalKey];
          }
          break;

        case 'replace':
          target[finalKey] = op.value;
          break;

        default:
          return res.status(400).json({ error: `Operation "${op.op}" not supported` });
      }
    }

    // Save updated resource
    await updateResource(req.params.id, resource);

    res.json(resource);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

Client usage:

```http
PATCH /api/resources/42
Content-Type: application/json-patch+json

[
  { "op": "replace", "path": "/title", "value": "New Title" },
  { "op": "add", "path": "/tags/-", "value": "new-tag" },
  { "op": "remove", "path": "/metadata/temporary" }
]
```

This approach reduces multiple API calls to a single atomic operation.

## Response Streaming

### Problem: Large Response Blocking

Large responses block server resources while they're assembled:

```javascript
// Blocks while fetching all 10,000 records
app.get('/api/logs/export', async (req, res) => {
  const logs = await fetchAllLogs(); // Memory intensive
  res.json(logs);
});
```

### Solution: JSON Streaming

```javascript
const { Transform } = require('stream');

app.get('/api/logs/export', (req, res) => {
  // Create database cursor
  const cursor = db.collection('logs').find().stream();

  // Set up streaming JSON response
  res.setHeader('Content-Type', 'application/json');
  res.write('[\n');

  let isFirst = true;

  // Create transform stream to format JSON
  const transformer = new Transform({
    objectMode: true,
    transform(log, encoding, callback) {
      let data = '';
      if (!isFirst) {
        data = ',\n';
      } else {
        isFirst = false;
      }

      data += JSON.stringify(log);
      callback(null, data);
    }
  });

  // Handle errors
  cursor.on('error', (err) => {
    // If headers not sent yet, send error response
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    } else {
      // Otherwise close the JSON array and end the response
      res.write('\n]\n');
      res.end();
    }
  });

  // End response when done
  cursor.on('end', () => {
    res.write('\n]\n');
    res.end();
  });

  // Pipe data to response
  cursor.pipe(transformer).pipe(res);
});
```

This approach:
- Starts sending data immediately
- Uses minimal memory regardless of result size
- Provides faster time to first byte

## Connection Optimization

### Problem: Connection Overhead

Each HTTP request requires a new connection, adding latency.

### Solution: Keep-Alive Connections

```javascript
const express = require('express');
const app = express();

// Enable Keep-Alive
app.use((req, res, next) => {
  // Set longer Keep-Alive timeout
  if (!res.getHeader('Connection')) {
    res.setHeader('Connection', 'keep-alive');
    // Keep connections open for 5 seconds
    res.setHeader('Keep-Alive', 'timeout=5');
  }
  next();
});

// Rest of your API routes...
```

### Solution: HTTP/2 Server Push

For known related resources, use HTTP/2 server push:

```javascript
const express = require('express');
const http2 = require('http2');
const fs = require('fs');

const app = express();

// Create HTTP/2 server
const server = http2.createSecureServer({
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.cert')
});

// Handle request through Express
server.on('request', app);

// Get product details
app.get('/api/products/:id', (req, res) => {
  const product = fetchProduct(req.params.id);

  // If using HTTP/2, push related resources
  if (req.httpVersion === '2.0') {
    const relatedResources = [
      `/api/products/${req.params.id}/reviews`,
      `/api/products/${req.params.id}/similar`
    ];

    for (const path of relatedResources) {
      const pushStream = res.push(path, {
        ':status': 200,
        'content-type': 'application/json'
      });

      if (pushStream) {
        // Push the resource data
        if (path.includes('reviews')) {
          const reviews = fetchProductReviews(req.params.id);
          pushStream.end(JSON.stringify(reviews));
        } else if (path.includes('similar')) {
          const similar = fetchSimilarProducts(req.params.id);
          pushStream.end(JSON.stringify(similar));
        }
      }
    }
  }

  res.json(product);
});

server.listen(3000);
```

## Performance Tips for REST APIs

1. **Use proper HTTP status codes** - They affect client-side caching behavior
2. **Implement conditional requests** (ETag, If-Modified-Since)
3. **Enable compression** for all text-based responses
4. **Minimize payload size** with field selection
5. **Use bulk operations** for related actions
6. **Stream large responses** instead of buffering
7. **Leverage HTTP caching headers** appropriately
8. **Use connection pooling** for database queries
9. **Implement pagination** for large result sets
10. **Monitor API performance** with proper metrics

---

**Navigation**
- [⬆️ Up to API Design](./README.md)
- [➡️ Next: GraphQL Optimization](./graphql-optimization.md)