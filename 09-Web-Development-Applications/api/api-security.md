# API Security

**Navigation:** [🏠 Home](../../README.md) > [🌐 Web Development Applications](../README.md) > [🔌 API Design](./README.md) > API Security

## Understanding API Security Challenges

APIs expose your application's data and functionality, making them attractive targets for attackers. Common security challenges include:

- Unauthorized access to sensitive data
- Excessive data exposure
- Lack of rate limiting leading to DoS vulnerabilities
- Insufficient input validation
- Man-in-the-middle attacks
- Insecure direct object references

This document explores strategies to secure your APIs against these threats.

## Authentication Strategies

### Problem: Unauthorized API Access

Without proper authentication, APIs are vulnerable to unauthorized access.

### Solution: JWT Authentication

JSON Web Tokens (JWT) provide a secure, stateless authentication mechanism:

```javascript
// Express.js JWT implementation
const jwt = require('jsonwebtoken');
const express = require('express');
const app = express();

// Secret key (store in environment variables in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Login endpoint that generates a JWT
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  // Validate credentials (replace with proper validation)
  if (username === 'admin' && password === 'password') {
    // Create token payload
    const payload = {
      user_id: 1,
      username,
      roles: ['admin'],
      // Set token expiration
      exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
    };

    // Sign the JWT
    const token = jwt.sign(payload, JWT_SECRET);

    // Return token to client
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Middleware to authenticate JWT
function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }

  // Extract token (Bearer token format)
  const token = authHeader.split(' ')[1];

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach user to request
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

// Protected endpoint
app.get('/api/users/profile', authenticateJWT, (req, res) => {
  // req.user contains the decoded JWT payload
  res.json({
    user_id: req.user.user_id,
    username: req.user.username,
    // Don't include sensitive information
  });
});
```

### Solution: OAuth 2.0

For more complex scenarios, OAuth 2.0 provides delegated authorization:

```javascript
// Express.js OAuth implementation with Passport
const express = require('express');
const passport = require('passport');
const OAuth2Strategy = require('passport-oauth2');

const app = express();

// Configure OAuth strategy
passport.use(new OAuth2Strategy({
    authorizationURL: 'https://provider.com/oauth2/authorize',
    tokenURL: 'https://provider.com/oauth2/token',
    clientID: process.env.OAUTH_CLIENT_ID,
    clientSecret: process.env.OAUTH_CLIENT_SECRET,
    callbackURL: "https://myapp.com/auth/callback"
  },
  function(accessToken, refreshToken, profile, cb) {
    // Find or create user based on OAuth profile
    User.findOrCreate({ oauthId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

// Initialize Passport
app.use(passport.initialize());

// OAuth authentication routes
app.get('/auth/oauth',
  passport.authenticate('oauth2'));

app.get('/auth/callback',
  passport.authenticate('oauth2', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication
    res.redirect('/');
  }
);

// Protected API endpoint
app.get('/api/data',
  passport.authenticate('oauth2', { session: false }),
  function(req, res) {
    res.json({ data: 'Protected data' });
  }
);
```

### Solution: API Keys

For service-to-service authentication, API keys provide simplicity:

```javascript
// Express.js API key authentication
const express = require('express');
const app = express();

// Store API keys safely (use a database in production)
const validApiKeys = [
  'api_key_1',
  'api_key_2',
];

// API key middleware
function verifyApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({ error: 'API key is required' });
  }

  if (!validApiKeys.includes(apiKey)) {
    return res.status(403).json({ error: 'Invalid API key' });
  }

  next();
}

// Protected API endpoint
app.get('/api/data', verifyApiKey, (req, res) => {
  res.json({ data: 'Protected data' });
});
```

## Authorization Strategies

### Problem: Insufficient Access Control

Authentication verifies identity, but authorization determines what authenticated users can access.

### Solution: Role-Based Access Control (RBAC)

```javascript
// Express.js RBAC implementation
const express = require('express');
const app = express();

// Define role-based middleware
function checkRole(roles) {
  return (req, res, next) => {
    // Assume JWT middleware has already attached user to request
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user has required role
    if (!req.user.roles || !req.user.roles.some(role => roles.includes(role))) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

// Public endpoint - no authentication
app.get('/api/posts', (req, res) => {
  res.json([{ id: 1, title: 'Public post' }]);
});

// User-level access - requires authentication
app.get('/api/user/profile', authenticateJWT, (req, res) => {
  res.json({ username: req.user.username });
});

// Admin-only endpoint
app.delete('/api/posts/:id',
  authenticateJWT,
  checkRole(['admin']),
  (req, res) => {
    res.json({ message: 'Post deleted' });
  }
);

// Multiple roles allowed
app.put('/api/posts/:id',
  authenticateJWT,
  checkRole(['admin', 'editor']),
  (req, res) => {
    res.json({ message: 'Post updated' });
  }
);
```

### Solution: Attribute-Based Access Control (ABAC)

For complex permission scenarios, ABAC provides fine-grained control:

```javascript
// Express.js ABAC implementation
function checkPermission(resourceType, action) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      // Get resource ID from request
      const resourceId = req.params.id;

      // Get resource from database
      const resource = await db.getResource(resourceType, resourceId);

      if (!resource) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      // Check ownership
      const isOwner = resource.ownerId === req.user.user_id;

      // Check if user has admin role
      const isAdmin = req.user.roles.includes('admin');

      // Check if resource is public
      const isPublic = resource.accessLevel === 'public';

      // Determine permission
      let hasPermission = false;

      switch (action) {
        case 'read':
          hasPermission = isOwner || isAdmin || isPublic;
          break;
        case 'update':
          hasPermission = isOwner || isAdmin;
          break;
        case 'delete':
          hasPermission = isAdmin || (isOwner && resource.isDeletable);
          break;
        default:
          hasPermission = false;
      }

      if (!hasPermission) {
        return res.status(403).json({ error: 'Permission denied' });
      }

      // Attach resource to request for use in route handler
      req.resource = resource;
      next();
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  };
}

// Usage in routes
app.get('/api/documents/:id',
  authenticateJWT,
  checkPermission('document', 'read'),
  (req, res) => {
    // req.resource contains the document
    res.json(req.resource);
  }
);

app.put('/api/documents/:id',
  authenticateJWT,
  checkPermission('document', 'update'),
  (req, res) => {
    res.json({ message: 'Document updated' });
  }
);
```

## Rate Limiting

### Problem: DoS and Brute Force Attacks

Without rate limiting, APIs are vulnerable to denial of service and brute force attacks.

### Solution: Token Bucket Rate Limiting

```javascript
// Express.js rate limiting with express-rate-limit
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');
const express = require('express');

const app = express();
const redis = new Redis();

// Global rate limit: 100 requests per IP per 15 minutes
const globalLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args)
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { error: 'Too many requests, please try again later.' }
});

// Apply global rate limit to all requests
app.use(globalLimiter);

// Stricter rate limit for authentication attempts: 5 per minute
const loginLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args)
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 login requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again later.' }
});

// Apply stricter rate limit to authentication endpoints
app.post('/api/login', loginLimiter, (req, res) => {
  // Login logic
});

// API-specific rate limit
const apiLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
    prefix: 'api-limit:' // Redis key prefix
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  // Custom key generator based on user ID if authenticated
  keyGenerator: (req) => {
    return req.user ? `user:${req.user.user_id}` : req.ip;
  },
  message: { error: 'API rate limit exceeded' }
});

// Apply API rate limit to specific endpoints
app.use('/api/data', authenticateJWT, apiLimiter);
```

### Solution: Handling Different Client Types

Different clients may need different rate limits:

```javascript
// Dynamic rate limiting based on client type
function dynamicRateLimit(req, res, next) {
  let limit = 60; // Default: 60 requests per minute
  let windowMs = 60 * 1000; // 1 minute

  // Check user type from JWT payload
  if (req.user) {
    if (req.user.tier === 'premium') {
      limit = 600; // Premium: 600 requests per minute
    } else if (req.user.tier === 'basic') {
      limit = 120; // Basic: 120 requests per minute
    } else if (req.user.roles.includes('admin')) {
      // Admins get higher limits
      limit = 1200;
    }
  }

  // Apply rate limit
  const limiter = rateLimit({
    windowMs,
    max: limit,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user ? `user:${req.user.user_id}` : req.ip,
    skip: (req) => req.user && req.user.bypass_rate_limit === true
  });

  // Call the middleware
  return limiter(req, res, next);
}

// Apply dynamic rate limiting
app.use('/api', authenticateJWT, dynamicRateLimit);
```

## Input Validation and Sanitization

### Problem: Injection Attacks

Invalid or malicious input can lead to security vulnerabilities.

### Solution: Schema Validation

```javascript
// Express.js input validation with Joi
const express = require('express');
const Joi = require('joi');

const app = express();
app.use(express.json());

// Validation middleware
function validateRequest(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Return all errors
      stripUnknown: true // Remove unknown fields
    });

    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({ error: errorMessage });
    }

    // Replace request body with validated data
    req.body = value;
    next();
  };
}

// Schema for user creation
const userSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{8,30}$')).required(),
  age: Joi.number().integer().min(18).max(120)
});

// Apply validation to route
app.post('/api/users', validateRequest(userSchema), (req, res) => {
  // Body has been validated and sanitized
  const user = req.body;

  // Create user in database
  res.status(201).json({ message: 'User created', user });
});
```

### Solution: SQL Injection Prevention

Always use parameterized queries to prevent SQL injection:

```javascript
// BAD: Vulnerable to SQL injection
app.get('/api/users', (req, res) => {
  const name = req.query.name;

  // DON'T DO THIS
  const query = `SELECT * FROM users WHERE name = '${name}'`;

  db.query(query)
    .then(users => res.json(users))
    .catch(err => res.status(500).json({ error: err.message }));
});

// GOOD: Using parameterized queries
app.get('/api/users', (req, res) => {
  const name = req.query.name;

  // DO THIS
  const query = 'SELECT * FROM users WHERE name = $1';
  const params = [name];

  db.query(query, params)
    .then(users => res.json(users))
    .catch(err => res.status(500).json({ error: err.message }));
});
```

### Solution: NoSQL Injection Prevention

Similar risks exist for NoSQL databases:

```javascript
// BAD: Vulnerable to NoSQL injection
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  // DON'T DO THIS
  User.findOne({ username, password })
    .then(user => {
      if (user) {
        res.json({ token: generateToken(user) });
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    });
});

// GOOD: Proper validation and secure comparison
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  // Validate inputs
  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Invalid input' });
  }

  // DO THIS
  User.findOne({ username })
    .then(user => {
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Compare password hash securely
      return bcrypt.compare(password, user.passwordHash);
    })
    .then(isMatch => {
      if (isMatch) {
        res.json({ token: generateToken(user) });
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    });
});
```

## HTTPS and Transport Security

### Problem: Insecure Data Transmission

Data transmitted over HTTP is vulnerable to eavesdropping.

### Solution: Enforce HTTPS

```javascript
// Express.js HTTPS redirection and security headers
const express = require('express');
const helmet = require('helmet');

const app = express();

// Add security headers
app.use(helmet());

// Redirect HTTP to HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}

// Set strict transport security
app.use(helmet.hsts({
  maxAge: 31536000, // 1 year in seconds
  includeSubDomains: true,
  preload: true
}));
```

## CORS Configuration

### Problem: CORS Vulnerabilities

Improper CORS configuration can expose APIs to unauthorized domains.

### Solution: Strict CORS Policy

```javascript
// Express.js CORS configuration
const express = require('express');
const cors = require('cors');

const app = express();

// Allowed origins
const allowedOrigins = [
  'https://myapp.com',
  'https://admin.myapp.com'
];

// CORS options
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }

    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true, // Allow cookies with cross-origin requests
  maxAge: 86400 // Cache preflight requests for 24 hours
};

// Apply CORS middleware
app.use(cors(corsOptions));
```

## Preventing Parameter Pollution

### Problem: HTTP Parameter Pollution

Duplicate parameters can bypass validation or cause unexpected behavior.

### Solution: Parameter Pollution Prevention

```javascript
// Express.js parameter pollution prevention
const express = require('express');
const hpp = require('hpp');

const app = express();

// Apply middleware
app.use(hpp());

// Whitelist certain parameters that can be arrays
app.use(hpp({
  whitelist: ['tags', 'filter', 'sort']
}));
```

## Security Headers

### Problem: Missing Security Headers

Default headers don't provide sufficient protection against common attacks.

### Solution: Apply Security Headers

```javascript
// Express.js security headers with helmet
const express = require('express');
const helmet = require('helmet');

const app = express();

// Apply default security headers
app.use(helmet());

// Customize Content Security Policy
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "https://trusted-cdn.com"],
    styleSrc: ["'self'", "https://trusted-cdn.com", "'unsafe-inline'"],
    imgSrc: ["'self'", "https://trusted-cdn.com", "data:"],
    connectSrc: ["'self'", "https://api.myapp.com"],
    fontSrc: ["'self'", "https://trusted-cdn.com"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
    reportUri: '/csp-violation-report'
  }
}));

// Disable the X-Powered-By header
app.disable('x-powered-by');
```

## Performance Tips for Secure APIs

1. **Use a web application firewall (WAF)** for additional protection
2. **Implement proper logging** for security events
3. **Regularly rotate API keys and credentials**
4. **Set short JWT expiration times** and use refresh tokens
5. **Validate all inputs**, not just known attack vectors
6. **Sanitize all outputs** to prevent XSS
7. **Set appropriate rate limits** based on endpoint sensitivity
8. **Minimize exposed data** to prevent information leakage
9. **Monitor for unusual patterns** that might indicate attacks
10. **Perform regular security audits** of your API

---

**Navigation**
- [⬅️ Previous: Pagination Strategies](./pagination-strategies.md)
- [⬆️ Up to API Design](./README.md)