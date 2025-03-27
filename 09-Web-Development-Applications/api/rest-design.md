# RESTful API Design

**Navigation:** [🏠 Home](../../README.md) > [🌐 Web Development Applications](../README.md) > [🔌 API Design](./README.md) > RESTful API Design

## Principles of REST

REST (Representational State Transfer) is an architectural style for designing networked applications. RESTful APIs are designed around a few core principles:

1. **Resource-Based**: Individual resources (data entities) are identified by URLs
2. **Stateless**: Each request contains all the information needed to process it
3. **Uniform Interface**: Consistent operations and representations
4. **Client-Server**: Clear separation between client and server responsibilities
5. **Cacheable**: Responses must define themselves as cacheable or non-cacheable
6. **Layered System**: Clients cannot tell if connected directly to the server

This document focuses on practical implementation of these principles.

## Resource Modeling

### Resource Identification

Resources are the key abstraction in RESTful design. Identify your resources and model them as nouns:

```
https://api.example.com/articles
https://api.example.com/articles/42
https://api.example.com/users/123
https://api.example.com/users/123/comments
```

### Resource Naming Conventions

Follow these conventions for consistent resource naming:

| Resource | URL | Description |
|----------|-----|-------------|
| Collection | `/articles` | List of articles |
| Element | `/articles/42` | Specific article |
| Nested collection | `/articles/42/comments` | Comments for article 42 |
| Nested element | `/articles/42/comments/5` | Comment #5 on article 42 |

Keep URLs simple and intuitive:
- Use nouns, not verbs
- Use plural nouns for collections
- Use kebab-case for multi-word resources: `/blog-posts`
- Keep URLs relatively short
- Maintain hierarchy and relationships

### Implementation Example

```javascript
// Express.js resource modeling
const express = require('express');
const app = express();

// Collection
app.get('/articles', (req, res) => {
  // Return list of articles
});

// Element
app.get('/articles/:id', (req, res) => {
  // Return specific article
});

// Nested collection
app.get('/articles/:articleId/comments', (req, res) => {
  // Return comments for article
});

// Nested element
app.get('/articles/:articleId/comments/:commentId', (req, res) => {
  // Return specific comment for article
});
```

## HTTP Methods

Use HTTP methods to define operations on resources:

| Method | Description | Collection (`/articles`) | Element (`/articles/42`) |
|--------|-------------|--------------------------|--------------------------|
| GET | Read/retrieve | Retrieve all articles | Retrieve article 42 |
| POST | Create | Create a new article | N/A (typically) |
| PUT | Update/replace | Replace entire collection (rarely used) | Replace article 42 entirely |
| PATCH | Update/modify | N/A (typically) | Update parts of article 42 |
| DELETE | Delete | Delete all articles (use with caution) | Delete article 42 |

### Implementation Example

```javascript
// Express.js HTTP methods implementation
const express = require('express');
const app = express();

app.use(express.json());

// GET - Retrieve resources
app.get('/articles', (req, res) => {
  const articles = fetchArticles();
  res.json(articles);
});

app.get('/articles/:id', (req, res) => {
  const article = fetchArticle(req.params.id);

  if (!article) {
    return res.status(404).json({ error: 'Article not found' });
  }

  res.json(article);
});

// POST - Create resource
app.post('/articles', (req, res) => {
  // Validate input
  if (!req.body.title || !req.body.content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  const newArticle = createArticle(req.body);

  // Return 201 Created with the new resource
  res.status(201)
     .location(`/articles/${newArticle.id}`)
     .json(newArticle);
});

// PUT - Replace resource entirely
app.put('/articles/:id', (req, res) => {
  const article = fetchArticle(req.params.id);

  if (!article) {
    return res.status(404).json({ error: 'Article not found' });
  }

  // Validate complete representation
  if (!req.body.title || !req.body.content || !req.body.author) {
    return res.status(400).json({ error: 'Complete article representation required' });
  }

  const updatedArticle = replaceArticle(req.params.id, req.body);
  res.json(updatedArticle);
});

// PATCH - Update resource partially
app.patch('/articles/:id', (req, res) => {
  const article = fetchArticle(req.params.id);

  if (!article) {
    return res.status(404).json({ error: 'Article not found' });
  }

  // Only update provided fields
  const updatedArticle = updateArticle(req.params.id, req.body);
  res.json(updatedArticle);
});

// DELETE - Remove resource
app.delete('/articles/:id', (req, res) => {
  const article = fetchArticle(req.params.id);

  if (!article) {
    return res.status(404).json({ error: 'Article not found' });
  }

  deleteArticle(req.params.id);

  // 204 No Content for successful deletion
  res.status(204).end();
});
```

## Status Codes

Use appropriate HTTP status codes to indicate the result of operations:

### Success Codes (2xx)

| Code | Name | Use Case |
|------|------|----------|
| 200 | OK | Successful request (default for GET, PUT, PATCH) |
| 201 | Created | Resource successfully created (POST) |
| 202 | Accepted | Request accepted for processing (async operations) |
| 204 | No Content | Success with no response body (DELETE) |

### Client Error Codes (4xx)

| Code | Name | Use Case |
|------|------|----------|
| 400 | Bad Request | Malformed request or invalid data |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Authentication succeeded but not authorized |
| 404 | Not Found | Resource not found |
| 405 | Method Not Allowed | HTTP method not supported for this resource |
| 409 | Conflict | Request conflicts with current state (e.g., duplicate) |
| 422 | Unprocessable Entity | Validation errors |
| 429 | Too Many Requests | Rate limit exceeded |

### Server Error Codes (5xx)

| Code | Name | Use Case |
|------|------|----------|
| 500 | Internal Server Error | Unexpected server error |
| 502 | Bad Gateway | Error from upstream server |
| 503 | Service Unavailable | Server temporarily unavailable (maintenance) |
| 504 | Gateway Timeout | Upstream server timeout |

### Implementation Example

```javascript
// Express.js error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);

  // Default error response
  let statusCode = 500;
  let errorMessage = 'Internal Server Error';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 422;
    errorMessage = 'Validation Error';

    // Add validation details
    return res.status(statusCode).json({
      error: errorMessage,
      details: err.details
    });
  }

  if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    errorMessage = 'Authentication Required';
  }

  if (err.name === 'ForbiddenError') {
    statusCode = 403;
    errorMessage = 'Permission Denied';
  }

  if (err.name === 'NotFoundError') {
    statusCode = 404;
    errorMessage = 'Resource Not Found';
  }

  if (err.name === 'ConflictError') {
    statusCode = 409;
    errorMessage = 'Resource Conflict';
  }

  // For production environments
  const detail = process.env.NODE_ENV === 'production'
    ? 'See server logs for details'
    : err.message;

  res.status(statusCode).json({
    error: errorMessage,
    message: detail,
    // Include request ID for log correlation
    requestId: req.id
  });
});
```

## Query Parameters

Use query parameters for filtering, sorting, and pagination:

### Filtering

```
GET /articles?category=technology
GET /articles?author=123&status=published
GET /articles?tags=javascript,nodejs
```

### Sorting

```
GET /articles?sort=date
GET /articles?sort=-date
GET /articles?sort=author,-date
```

### Pagination

```
GET /articles?limit=10&offset=0
GET /articles?page=2&per_page=20
```

### Implementation Example

```javascript
// Express.js query parameter handling
app.get('/articles', (req, res) => {
  // Build query from request params
  const query = {};

  // Filtering
  if (req.query.category) {
    query.category = req.query.category;
  }

  if (req.query.author) {
    query.authorId = req.query.author;
  }

  if (req.query.status) {
    query.status = req.query.status;
  }

  if (req.query.tags) {
    // Split comma-separated tags
    query.tags = { $in: req.query.tags.split(',') };
  }

  // Sorting
  let sort = {};
  if (req.query.sort) {
    const sortFields = req.query.sort.split(',');

    sortFields.forEach(field => {
      if (field.startsWith('-')) {
        sort[field.substring(1)] = -1; // Descending
      } else {
        sort[field] = 1; // Ascending
      }
    });
  } else {
    // Default sort
    sort = { createdAt: -1 };
  }

  // Pagination
  const limit = parseInt(req.query.limit) || 20;
  const offset = parseInt(req.query.offset) || 0;

  // If using page-based pagination
  if (req.query.page) {
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.per_page) || 20;
    pagination = {
      limit: perPage,
      offset: (page - 1) * perPage
    };
  }

  // Fetch data with query, sort, and pagination
  fetchArticles(query, sort, limit, offset)
    .then(result => {
      res.json({
        data: result.articles,
        pagination: {
          total: result.total,
          limit,
          offset,
          has_more: offset + result.articles.length < result.total
        }
      });
    })
    .catch(error => {
      res.status(500).json({ error: error.message });
    });
});
```

## Request & Response Bodies

### Request Bodies

Use JSON for request bodies with appropriate Content-Type:

```http
POST /articles HTTP/1.1
Host: api.example.com
Content-Type: application/json

{
  "title": "Understanding REST",
  "content": "REST is an architectural style...",
  "author_id": 42,
  "tags": ["api", "rest", "http"],
  "status": "draft"
}
```

### Response Bodies

Structure JSON responses consistently:

```json
{
  "id": 123,
  "title": "Understanding REST",
  "content": "REST is an architectural style...",
  "author": {
    "id": 42,
    "name": "Jane Smith"
  },
  "tags": ["api", "rest", "http"],
  "status": "published",
  "created_at": "2023-03-15T08:15:30Z",
  "updated_at": "2023-03-16T10:22:15Z"
}
```

### Collection Responses

Wrap collections with metadata:

```json
{
  "data": [
    { "id": 123, "title": "Understanding REST", "author": "Jane Smith" },
    { "id": 124, "title": "Advanced REST Concepts", "author": "John Doe" }
  ],
  "metadata": {
    "total_count": 42,
    "limit": 10,
    "offset": 0
  }
}
```

### Error Responses

Provide consistent error structures:

```json
{
  "error": "Validation Error",
  "details": {
    "title": "Title is required",
    "content": "Content must be at least 100 characters"
  },
  "request_id": "fb8c27e8-e7e0-4361-9a4a-be4e33f6e974"
}
```

## HATEOAS

HATEOAS (Hypermedia as the Engine of Application State) enables clients to navigate APIs through hypermedia links.

### Basic Link Structure

```json
{
  "id": 123,
  "title": "Understanding REST",
  "content": "...",
  "links": [
    {
      "rel": "self",
      "href": "https://api.example.com/articles/123",
      "method": "GET"
    },
    {
      "rel": "author",
      "href": "https://api.example.com/users/42",
      "method": "GET"
    },
    {
      "rel": "comments",
      "href": "https://api.example.com/articles/123/comments",
      "method": "GET"
    },
    {
      "rel": "update",
      "href": "https://api.example.com/articles/123",
      "method": "PATCH"
    },
    {
      "rel": "delete",
      "href": "https://api.example.com/articles/123",
      "method": "DELETE"
    }
  ]
}
```

### Collection With Links

```json
{
  "data": [
    {
      "id": 123,
      "title": "Understanding REST",
      "links": [
        {
          "rel": "self",
          "href": "https://api.example.com/articles/123"
        }
      ]
    }
  ],
  "links": [
    {
      "rel": "self",
      "href": "https://api.example.com/articles?page=1"
    },
    {
      "rel": "next",
      "href": "https://api.example.com/articles?page=2"
    },
    {
      "rel": "create",
      "href": "https://api.example.com/articles",
      "method": "POST"
    }
  ]
}
```

### Implementation Example

```javascript
// Express.js HATEOAS implementation
function addLinks(article, req) {
  const baseUrl = `${req.protocol}://${req.get('host')}`;

  return {
    ...article,
    links: [
      {
        rel: 'self',
        href: `${baseUrl}/articles/${article.id}`,
        method: 'GET'
      },
      {
        rel: 'author',
        href: `${baseUrl}/users/${article.author_id}`,
        method: 'GET'
      },
      {
        rel: 'comments',
        href: `${baseUrl}/articles/${article.id}/comments`,
        method: 'GET'
      },
      // Only add links for actions the user can perform
      ...(req.user && (req.user.id === article.author_id || req.user.isAdmin) ? [
        {
          rel: 'update',
          href: `${baseUrl}/articles/${article.id}`,
          method: 'PATCH'
        },
        {
          rel: 'delete',
          href: `${baseUrl}/articles/${article.id}`,
          method: 'DELETE'
        }
      ] : [])
    ]
  };
}

app.get('/articles/:id', (req, res) => {
  const article = fetchArticle(req.params.id);

  if (!article) {
    return res.status(404).json({ error: 'Article not found' });
  }

  // Add HATEOAS links
  const responseBody = addLinks(article, req);

  res.json(responseBody);
});

app.get('/articles', (req, res) => {
  const { articles, total } = fetchArticles(req.query);
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const baseUrl = `${req.protocol}://${req.get('host')}`;

  // Add links to each article
  const itemsWithLinks = articles.map(article => addLinks(article, req));

  // Calculate pagination links
  const totalPages = Math.ceil(total / limit);

  const paginationLinks = [
    {
      rel: 'self',
      href: `${baseUrl}/articles?page=${page}&limit=${limit}`
    }
  ];

  if (page > 1) {
    paginationLinks.push({
      rel: 'prev',
      href: `${baseUrl}/articles?page=${page - 1}&limit=${limit}`
    });
  }

  if (page < totalPages) {
    paginationLinks.push({
      rel: 'next',
      href: `${baseUrl}/articles?page=${page + 1}&limit=${limit}`
    });
  }

  // Add first/last page links
  paginationLinks.push({
    rel: 'first',
    href: `${baseUrl}/articles?page=1&limit=${limit}`
  });

  paginationLinks.push({
    rel: 'last',
    href: `${baseUrl}/articles?page=${totalPages}&limit=${limit}`
  });

  // Add create link if authorized
  if (req.user) {
    paginationLinks.push({
      rel: 'create',
      href: `${baseUrl}/articles`,
      method: 'POST'
    });
  }

  res.json({
    data: itemsWithLinks,
    metadata: {
      total,
      page,
      limit,
      pages: totalPages
    },
    links: paginationLinks
  });
});
```

## Content Negotiation

Support different representation formats using content negotiation:

```javascript
app.get('/articles/:id', (req, res) => {
  const article = fetchArticle(req.params.id);

  if (!article) {
    return res.status(404).json({ error: 'Article not found' });
  }

  // Content negotiation based on Accept header
  const acceptHeader = req.get('Accept');

  if (acceptHeader.includes('application/xml')) {
    // Convert to XML
    const xml = convertToXml(article);
    res.type('application/xml').send(xml);
  } else if (acceptHeader.includes('text/csv')) {
    // Convert to CSV
    const csv = convertToCsv([article]);
    res.type('text/csv').send(csv);
  } else {
    // Default to JSON
    res.json(article);
  }
});
```

## Idempotency

Ensure operations can be repeated without side effects:

- **GET**: Always idempotent - reading data doesn't change state
- **PUT**: Idempotent - replacing a resource produces the same result each time
- **DELETE**: Idempotent - deleting once or multiple times results in the same state
- **POST**: Not idempotent - creating resources multiple times may create duplicates
- **PATCH**: May not be idempotent, depending on the operation

### Idempotency Keys

For non-idempotent operations, use idempotency keys:

```javascript
app.post('/payments', (req, res) => {
  const idempotencyKey = req.header('Idempotency-Key');

  if (!idempotencyKey) {
    return res.status(400).json({
      error: 'Idempotency-Key header is required for payment operations'
    });
  }

  // Check if we've seen this key before
  const existingPayment = findPaymentByIdempotencyKey(idempotencyKey);

  if (existingPayment) {
    // Return the previous result
    return res.status(existingPayment.statusCode).json(existingPayment.result);
  }

  // Process the payment
  try {
    const payment = processPayment(req.body);

    // Store the result with the idempotency key
    storeProcessedPayment(idempotencyKey, 201, payment);

    res.status(201).json(payment);
  } catch (error) {
    // Also store errors with the idempotency key
    storeProcessedPayment(idempotencyKey, 400, { error: error.message });

    res.status(400).json({ error: error.message });
  }
});
```

## Best Practices for REST API Design

1. **Use nouns, not verbs** for endpoints
2. **Use plural resource names** for collections
3. **Use proper HTTP methods** for operations
4. **Return appropriate status codes**
5. **Use query parameters** for filtering, sorting, pagination
6. **Implement HATEOAS** for discoverability
7. **Version your API** from the beginning
8. **Use SSL/TLS encryption**
9. **Implement proper authentication/authorization**
10. **Provide meaningful error messages**

---

**Navigation**
- [⬆️ Up to API Design](./README.md)
- [➡️ Next: GraphQL API Design](./graphql-design.md)