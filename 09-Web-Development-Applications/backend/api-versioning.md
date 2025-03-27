# API Versioning Strategies

**Navigation:** [🏠 Home](../../README.md) > [🌐 Web Development Applications](../README.md) > [🔌 API Design](./README.md) > API Versioning

## Understanding API Versioning

APIs evolve over time as requirements change and features are added. Without proper versioning, changes can break client applications that depend on previous behavior. API versioning provides a mechanism to:

- Introduce breaking changes without disrupting existing clients
- Sunset outdated endpoints in a controlled manner
- Give clients time to migrate to newer API versions
- Support multiple versions simultaneously during transition periods

This document explores different API versioning strategies and their implementation.

## URL Path Versioning

### Overview

The most straightforward approach is to include the version number in the URL path.

```
https://api.example.com/v1/users
https://api.example.com/v2/users
```

### Implementation Example

```javascript
// Express.js implementation
const express = require('express');
const app = express();

// Version 1 router
const v1Router = express.Router();
v1Router.get('/users', (req, res) => {
  // Version 1 implementation
  const users = fetchUsersV1();
  res.json(users);
});

// Version 2 router
const v2Router = express.Router();
v2Router.get('/users', (req, res) => {
  // Version 2 implementation with additional fields
  const users = fetchUsersV2();
  res.json(users);
});

// Mount routers at different path versions
app.use('/v1', v1Router);
app.use('/v2', v2Router);

// Default redirect to latest version
app.get('/users', (req, res) => {
  res.redirect(301, '/v2/users');
});
```

### Considerations

**Advantages:**
- **Simplicity**: Easy to implement and understand
- **Discoverability**: Visible in the URL, making testing easy
- **Browser-friendly**: Works with all clients including browsers
- **Caching**: Different URLs enable effective caching by proxies

**Disadvantages:**
- **URL Pollution**: Adds version information to what should be a resource identifier
- **Not Resource-oriented**: Breaks the pure REST principle of resource identification
- **Migration Complexity**: Requires updating all URLs when migrating versions

## Query Parameter Versioning

### Overview

Version is specified as a query parameter:

```
https://api.example.com/users?version=1
https://api.example.com/users?version=2
```

### Implementation Example

```javascript
// Express.js implementation
app.get('/users', (req, res) => {
  // Get version from query parameter, default to latest
  const version = parseInt(req.query.version) || 2;

  if (version === 1) {
    const users = fetchUsersV1();
    return res.json(users);
  } else if (version === 2) {
    const users = fetchUsersV2();
    return res.json(users);
  } else {
    return res.status(400).json({ error: `Version ${version} is not supported` });
  }
});
```

### Considerations

**Advantages:**
- **Clean URLs**: Resource URLs remain the same
- **Optional versioning**: Clients can omit version to get the default
- **Easy testing**: Can be tested directly in browsers

**Disadvantages:**
- **Caching issues**: Difficult to cache since the URL is the same
- **Optional parameter**: Requires default version handling
- **Accidental omission**: Clients might forget to include the version

## Custom Header Versioning

### Overview

Version is specified in a custom HTTP header:

```
GET /users HTTP/1.1
Host: api.example.com
X-API-Version: 2
```

### Implementation Example

```javascript
// Express.js implementation
app.get('/users', (req, res) => {
  // Get version from custom header, default to latest
  const version = parseInt(req.header('X-API-Version')) || 2;

  if (version === 1) {
    const users = fetchUsersV1();
    return res.json(users);
  } else if (version === 2) {
    const users = fetchUsersV2();
    return res.json(users);
  } else {
    return res.status(400).json({ error: `Version ${version} is not supported` });
  }
});
```

### Considerations

**Advantages:**
- **RESTful**: Keeps resource URLs clean and resource-focused
- **Separate concerns**: Metadata in headers, resources in URLs
- **Flexible**: Headers can contain more complex versioning schemes

**Disadvantages:**
- **Less discoverable**: Not visible in the URL
- **Difficult testing**: Requires tools that can set custom headers
- **Caching challenges**: Requires special handling in proxies

## Accept Header Versioning

### Overview

Uses content negotiation through the standard `Accept` header:

```
GET /users HTTP/1.1
Host: api.example.com
Accept: application/vnd.example.v2+json
```

### Implementation Example

```javascript
// Express.js implementation
app.get('/users', (req, res) => {
  // Parse Accept header for versioning
  const acceptHeader = req.header('Accept');

  // Default to JSON if not specified
  if (!acceptHeader || acceptHeader === '*/*' || acceptHeader === 'application/json') {
    // Use latest version
    const users = fetchUsersV2();
    return res.json(users);
  }

  // Check for versioned media type
  if (acceptHeader === 'application/vnd.example.v1+json') {
    const users = fetchUsersV1();
    return res.json(users);
  } else if (acceptHeader === 'application/vnd.example.v2+json') {
    const users = fetchUsersV2();
    return res.json(users);
  } else {
    // Unsupported media type
    return res.status(406).json({ error: `Unsupported Accept header: ${acceptHeader}` });
  }
});
```

### Considerations

**Advantages:**
- **HTTP standard**: Uses existing HTTP content negotiation mechanism
- **RESTful**: Follows REST principles
- **Flexible**: Can handle different formats along with versions

**Disadvantages:**
- **Complex parsing**: More complex to parse and handle
- **Discoverability**: Less discoverable than URL versioning
- **Required header**: Cannot be optional like query parameters

## Combining Versioning Strategies

### Overview

For maximum flexibility, you can support multiple versioning strategies simultaneously:

```javascript
// Express.js implementation
app.get('/users', (req, res) => {
  // Check different versioning mechanisms in decreasing order of priority

  // 1. Check URL path versioning (handled by router)
  // 2. Check custom header
  const headerVersion = req.header('X-API-Version');
  if (headerVersion) {
    return handleVersionedRequest(parseInt(headerVersion), req, res);
  }

  // 3. Check Accept header
  const acceptHeader = req.header('Accept');
  if (acceptHeader && acceptHeader.includes('vnd.example.')) {
    const version = extractVersionFromAccept(acceptHeader);
    if (version) {
      return handleVersionedRequest(version, req, res);
    }
  }

  // 4. Check query parameter
  if (req.query.version) {
    return handleVersionedRequest(parseInt(req.query.version), req, res);
  }

  // Default to latest version
  return handleVersionedRequest(2, req, res);
});

function handleVersionedRequest(version, req, res) {
  if (version === 1) {
    const users = fetchUsersV1();
    return res.json(users);
  } else if (version === 2) {
    const users = fetchUsersV2();
    return res.json(users);
  } else {
    return res.status(400).json({ error: `Version ${version} is not supported` });
  }
}

function extractVersionFromAccept(acceptHeader) {
  // Parse: application/vnd.example.v2+json
  const match = acceptHeader.match(/application\/vnd\.example\.v(\d+)\+json/);
  return match ? parseInt(match[1]) : null;
}
```

### API Gateway Versioning

For complex applications, handling versioning at the API gateway level can simplify backend services:

```javascript
// API Gateway configuration (pseudo-code)
function routeRequest(request) {
  // Extract version from request using any strategy
  const version = extractVersion(request);

  // Route to different backend services based on version
  if (version === 1) {
    return forwardToBackend('users-service-v1', request);
  } else if (version === 2) {
    return forwardToBackend('users-service-v2', request);
  } else {
    return errorResponse(400, `Version ${version} is not supported`);
  }
}
```

## Version Lifecycle Management

### Announcing New Versions

Properly announcing and documenting new API versions is critical:

```javascript
// Add version information to responses
app.use((req, res, next) => {
  // Add headers about available versions
  res.setHeader('X-API-Current-Version', '2');
  res.setHeader('X-API-Deprecated-Versions', '1');
  res.setHeader('X-API-Deprecation-Date-v1', '2023-12-31');

  // Add Link header for API documentation
  res.setHeader('Link', '<https://api.example.com/docs/v2>; rel="documentation"');

  next();
});
```

### Deprecation Warnings

When clients use deprecated API versions, provide clear warnings:

```javascript
// Deprecation warning middleware
function deprecationWarning(req, res, next) {
  // Determine which version is being used
  const version = determineVersion(req);

  if (version === 1) {
    // Add deprecation warning header
    res.setHeader('Warning', '299 api.example.com "Deprecated API version 1, please migrate to version 2 by 2023-12-31"');

    // Log usage for metrics
    logDeprecatedUsage({
      version: 1,
      endpoint: req.path,
      client: req.header('User-Agent'),
      clientId: req.auth?.clientId
    });
  }

  next();
}

app.use(deprecationWarning);
```

### Sunset Policy

Clearly define when outdated versions will be discontinued:

```javascript
// Sunset policy middleware
function sunsetPolicy(req, res, next) {
  const version = determineVersion(req);

  if (version === 1) {
    // RFC 8594 - Add Sunset header
    res.setHeader('Sunset', 'Sat, 31 Dec 2023 23:59:59 GMT');

    // Link to migration documentation
    res.setHeader('Link', '<https://api.example.com/docs/migration-v1-v2>; rel="sunset-page"');
  }

  next();
}

app.use(sunsetPolicy);
```

### Feature Flags vs. Versioning

For smaller changes, feature flags can be used instead of full version increments:

```javascript
// Feature flag implementation
app.get('/users', (req, res) => {
  const users = fetchUsers();

  // Check for feature flag
  const includeMetrics = req.query.include_metrics === 'true' ||
                         req.header('X-Include-Metrics') === 'true';

  if (includeMetrics) {
    addMetricsToUsers(users);
  }

  res.json(users);
});
```

## Backward Compatibility Strategies

### Additive Changes

Add fields without removing existing ones:

```javascript
// Version 1
{
  "user": {
    "id": 123,
    "name": "John Doe"
  }
}

// Version 2 (backward compatible)
{
  "user": {
    "id": 123,
    "name": "John Doe",
    "email": "john@example.com",  // New field
    "role": "admin"               // New field
  }
}
```

### Response Transformation

Transform responses based on version:

```javascript
app.get('/users/:id', (req, res) => {
  const user = fetchUser(req.params.id);
  const version = determineVersion(req);

  if (version === 1) {
    // Transform for v1 compatibility
    const v1User = {
      id: user.id,
      name: user.name,
      // Omit new fields
      // Transform renamed fields
      email_address: user.email
    };

    return res.json(v1User);
  }

  // Latest version gets full response
  res.json(user);
});
```

### Default Values

Provide defaults for missing fields in older versions:

```javascript
app.post('/users', (req, res) => {
  const version = determineVersion(req);
  let userData = req.body;

  if (version === 1) {
    // Add defaults for fields required in v2 but not present in v1
    userData = {
      ...userData,
      settings: userData.settings || {
        notifications: true,
        theme: 'default'
      },
      created_at: new Date().toISOString()
    };
  }

  const user = createUser(userData);
  res.status(201).json(user);
});
```

## Implementation Best Practices

1. **Version major changes only** - Minor, non-breaking changes don't need new versions
2. **Document changes thoroughly** - Clearly explain differences between versions
3. **Provide migration guides** - Help clients upgrade to newer versions
4. **Set clear sunset dates** - Give sufficient notice before removing old versions
5. **Monitor version usage** - Track which clients use which versions
6. **Test all versions** - Maintain test suites for every supported version
7. **Keep old versions simple** - Don't add new features to deprecated versions
8. **Use semantic versioning** - Major.Minor.Patch format for clear communication
9. **Support at least N-1** - Always support the current and previous major versions
10. **Graceful error handling** - Provide helpful error messages about version problems

## Performance Tips for Versioned APIs

1. **Minimize version logic overhead** - Keep version branching logic simple
2. **Consider individual version deployments** - Separate services for distinct versions
3. **Cache responses** - Use versioned URLs for effective HTTP caching
4. **Monitor performance by version** - Track metrics separately for each version
5. **Load test all versions** - Ensure performance across all supported versions
6. **Optimize version detection** - Make version determination efficient

---

**Navigation**
- [⬆️ Up to API Design](./README.md)
- [➡️ Next: REST Optimization](./rest-optimization.md)