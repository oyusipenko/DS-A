# System Design

**Navigation:** [🏠 Home](../../README.md) > [📚 Big O Notation](../README.md) > [🌐 Applications](./README.md) > System Design

This document explores how Big O notation applies to system design in web development, focusing on scalability, distributed systems, and architectural patterns.

## Microservices vs. Monoliths

### Communication Overhead

```javascript
// Monolith: Direct function calls (fast)
class OrderService {
  async createOrder(orderData) {
    // Validate order
    const validOrder = this.validateOrder(orderData);

    // Calculate pricing
    const pricing = this.calculatePricing(validOrder);

    // Check inventory
    const inventory = await this.checkInventory(validOrder.items);

    // Process payment
    const payment = await this.processPayment(pricing.total, orderData.paymentInfo);

    // Create order in database
    const order = await this.saveOrder({
      ...validOrder,
      pricing,
      payment,
      status: 'paid'
    });

    // Update inventory
    await this.updateInventory(order.items);

    // Send notifications
    await this.sendNotifications(order);

    return order;
  }

  // Other methods implemented locally
  validateOrder(orderData) { /* ... */ }
  calculatePricing(order) { /* ... */ }
  checkInventory(items) { /* ... */ }
  // and so on...
}
```

```javascript
// Microservices: Network calls (slower)
class OrderService {
  constructor() {
    this.inventoryServiceClient = new ServiceClient('inventory-service');
    this.pricingServiceClient = new ServiceClient('pricing-service');
    this.paymentServiceClient = new ServiceClient('payment-service');
    this.notificationServiceClient = new ServiceClient('notification-service');
  }

  async createOrder(orderData) {
    // Validate order locally
    const validOrder = this.validateOrder(orderData);

    // Calculate pricing (remote call)
    const pricing = await this.pricingServiceClient.post('/calculate', {
      items: validOrder.items,
      promotions: validOrder.promotions
    });

    // Check inventory (remote call)
    const inventory = await this.inventoryServiceClient.post('/check', {
      items: validOrder.items
    });

    if (!inventory.available) {
      throw new Error('Some items are out of stock');
    }

    // Process payment (remote call)
    const payment = await this.paymentServiceClient.post('/process', {
      amount: pricing.total,
      paymentInfo: orderData.paymentInfo
    });

    // Create order in database (local)
    const order = await this.saveOrder({
      ...validOrder,
      pricing,
      payment,
      status: 'paid'
    });

    // Update inventory (remote call)
    await this.inventoryServiceClient.post('/update', {
      orderId: order.id,
      items: order.items
    });

    // Send notifications (remote call)
    await this.notificationServiceClient.post('/send', {
      type: 'new_order',
      order: order
    });

    return order;
  }
}

class ServiceClient {
  constructor(serviceName) {
    this.baseUrl = process.env[`${serviceName.toUpperCase()}_URL`];
  }

  async get(path, params = {}) {
    // Add retry logic, circuit breaking, etc.
    const response = await axios.get(`${this.baseUrl}${path}`, { params });
    return response.data;
  }

  async post(path, data = {}) {
    // Add retry logic, circuit breaking, etc.
    const response = await axios.post(`${this.baseUrl}${path}`, data);
    return response.data;
  }
}
```

### Service Discovery and Load Balancing

```javascript
// Simple service registry with load balancing
class ServiceRegistry {
  constructor() {
    this.services = new Map(); // service name -> array of instances
    this.healthChecks = new Map(); // instance URL -> last health check time

    // Run health checks periodically
    setInterval(() => this.runHealthChecks(), 30000);
  }

  register(serviceName, instanceUrl) {
    if (!this.services.has(serviceName)) {
      this.services.set(serviceName, []);
    }

    // Add to registry if not already present
    const instances = this.services.get(serviceName);
    if (!instances.includes(instanceUrl)) {
      instances.push(instanceUrl);
      this.healthChecks.set(instanceUrl, Date.now());
      console.log(`Registered ${serviceName} instance at ${instanceUrl}`);
    }

    return true;
  }

  deregister(serviceName, instanceUrl) {
    if (this.services.has(serviceName)) {
      const instances = this.services.get(serviceName);
      const index = instances.indexOf(instanceUrl);

      if (index !== -1) {
        instances.splice(index, 1);
        this.healthChecks.delete(instanceUrl);
        console.log(`Deregistered ${serviceName} instance at ${instanceUrl}`);
      }
    }

    return true;
  }

  // Get service instance using round-robin load balancing
  getServiceInstance(serviceName) {
    if (!this.services.has(serviceName) || this.services.get(serviceName).length === 0) {
      throw new Error(`No instances available for service: ${serviceName}`);
    }

    const instances = this.services.get(serviceName);

    // Simple round-robin: move first element to the end
    const instance = instances.shift();
    instances.push(instance);

    return instance;
  }

  // Run health checks on all registered instances
  async runHealthChecks() {
    for (const [serviceName, instances] of this.services.entries()) {
      for (const instanceUrl of [...instances]) {
        try {
          const healthUrl = `${instanceUrl}/health`;
          await axios.get(healthUrl, { timeout: 5000 });
          this.healthChecks.set(instanceUrl, Date.now());
        } catch (error) {
          console.error(`Health check failed for ${instanceUrl}: ${error.message}`);

          // Remove instance if health check fails
          if (Date.now() - this.healthChecks.get(instanceUrl) > 60000) {
            this.deregister(serviceName, instanceUrl);
          }
        }
      }
    }
  }
}

// Client that uses the service registry
class ServiceClient {
  constructor(registry, serviceName) {
    this.registry = registry;
    this.serviceName = serviceName;
  }

  async request(method, path, options = {}) {
    const retries = options.retries || 3;
    let lastError = null;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const serviceUrl = this.registry.getServiceInstance(this.serviceName);
        const response = await axios({
          method,
          url: `${serviceUrl}${path}`,
          ...options
        });

        return response.data;
      } catch (error) {
        console.error(`Request failed (attempt ${attempt + 1}/${retries}):`, error.message);
        lastError = error;
      }
    }

    throw lastError;
  }

  async get(path, options = {}) {
    return this.request('get', path, options);
  }

  async post(path, data, options = {}) {
    return this.request('post', path, { ...options, data });
  }
}
```

## Horizontal vs. Vertical Scaling

### Stateless Design for Horizontal Scaling

```javascript
// Stateful implementation (bad for horizontal scaling)
class UserSessionService {
  constructor() {
    // In-memory sessions - problem: not shared across instances
    this.sessions = new Map();
  }

  createSession(userId, userData) {
    const sessionId = uuidv4();
    this.sessions.set(sessionId, {
      userId,
      userData,
      createdAt: Date.now()
    });
    return sessionId;
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  deleteSession(sessionId) {
    return this.sessions.delete(sessionId);
  }
}

// Usage in API
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Authenticate user...
  const user = authenticateUser(username, password);

  if (user) {
    const sessionService = new UserSessionService();
    const sessionId = sessionService.createSession(user.id, user);

    res.cookie('sessionId', sessionId);
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});
```

```javascript
// Stateless implementation (good for horizontal scaling)
class RedisSessionService {
  constructor() {
    this.redisClient = redis.createClient(process.env.REDIS_URL);
    this.sessionTTL = 24 * 60 * 60; // 24 hours in seconds
  }

  async createSession(userId, userData) {
    const sessionId = uuidv4();

    await this.redisClient.setex(
      `session:${sessionId}`,
      this.sessionTTL,
      JSON.stringify({
        userId,
        userData,
        createdAt: Date.now()
      })
    );

    return sessionId;
  }

  async getSession(sessionId) {
    const sessionData = await this.redisClient.get(`session:${sessionId}`);
    return sessionData ? JSON.parse(sessionData) : null;
  }

  async deleteSession(sessionId) {
    return await this.redisClient.del(`session:${sessionId}`);
  }
}

// JWT-based stateless sessions (even better for scaling)
function generateJWT(user) {
  return jwt.sign(
    {
      sub: user.id,
      name: user.name,
      role: user.role,
      // Don't include sensitive data
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
}

// Usage in API
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Authenticate user...
  const user = await authenticateUser(username, password);

  if (user) {
    // Completely stateless - token contains all necessary data
    const token = generateJWT(user);

    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Authorization middleware
function authorize(requiredRole) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check role if required
      if (requiredRole && decoded.role !== requiredRole) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      // Attach user info to request
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
}
```

## Distributed Systems Design

### Message Queues and Event-Driven Architecture

```javascript
// Producer: Sending messages to a queue
class OrderProcessor {
  constructor() {
    this.connection = amqp.connect(process.env.RABBITMQ_URL);
    this.channel = null;
    this.setup();
  }

  async setup() {
    const connection = await this.connection;
    this.channel = await connection.createChannel();

    // Ensure queues exist
    await this.channel.assertQueue('order.created', { durable: true });
    await this.channel.assertQueue('order.fulfilled', { durable: true });
    await this.channel.assertQueue('order.cancelled', { durable: true });
  }

  async createOrder(orderData) {
    // Process order creation logic
    const order = await this.saveOrderToDatabase(orderData);

    // Publish event to queue
    await this.channel.sendToQueue(
      'order.created',
      Buffer.from(JSON.stringify(order)),
      { persistent: true }
    );

    return order;
  }

  async fulfillOrder(orderId) {
    const order = await this.markOrderAsFulfilled(orderId);

    await this.channel.sendToQueue(
      'order.fulfilled',
      Buffer.from(JSON.stringify(order)),
      { persistent: true }
    );

    return order;
  }

  async cancelOrder(orderId, reason) {
    const order = await this.markOrderAsCancelled(orderId, reason);

    await this.channel.sendToQueue(
      'order.cancelled',
      Buffer.from(JSON.stringify({ ...order, reason })),
      { persistent: true }
    );

    return order;
  }

  // Database methods
  async saveOrderToDatabase(orderData) { /* ... */ }
  async markOrderAsFulfilled(orderId) { /* ... */ }
  async markOrderAsCancelled(orderId, reason) { /* ... */ }
}

// Consumer: Processing messages from a queue
class InventoryService {
  constructor() {
    this.connection = amqp.connect(process.env.RABBITMQ_URL);
    this.channel = null;
    this.setup();
  }

  async setup() {
    const connection = await this.connection;
    this.channel = await connection.createChannel();

    // Ensure queue exists
    await this.channel.assertQueue('order.created', { durable: true });

    // Set prefetch to limit concurrent processing
    await this.channel.prefetch(1);

    // Start consuming messages
    await this.channel.consume('order.created', async (msg) => {
      if (!msg) return;

      try {
        const order = JSON.parse(msg.content.toString());
        console.log(`Processing inventory for order ${order.id}`);

        // Update inventory
        await this.updateInventory(order.items);

        // Acknowledge message (remove from queue)
        this.channel.ack(msg);
      } catch (error) {
        console.error('Error processing order:', error);

        // Reject message and put it back in the queue
        this.channel.nack(msg, false, true);
      }
    });
  }

  async updateInventory(items) {
    // Logic to update inventory levels
    for (const item of items) {
      await this.reduceItemStock(item.id, item.quantity);
    }
  }

  async reduceItemStock(itemId, quantity) {
    // Database operation
    // ...
  }
}
```

### Distributed Caching

```javascript
// Implementing a distributed cache with Redis
class DistributedCache {
  constructor() {
    this.redisClient = redis.createClient(process.env.REDIS_URL);
  }

  // Set with expiration
  async set(key, value, ttlSeconds = 3600) {
    return await this.redisClient.setex(
      key,
      ttlSeconds,
      typeof value === 'string' ? value : JSON.stringify(value)
    );
  }

  // Get with automatic parsing
  async get(key) {
    const value = await this.redisClient.get(key);

    if (!value) return null;

    try {
      return JSON.parse(value);
    } catch (e) {
      return value; // Return as-is if not JSON
    }
  }

  // Delete
  async delete(key) {
    return await this.redisClient.del(key);
  }

  // Increment a counter
  async increment(key, amount = 1) {
    return await this.redisClient.incrby(key, amount);
  }

  // Set if not exists (for locks)
  async setNX(key, value, ttlSeconds = 30) {
    const result = await this.redisClient.setnx(key, value);

    if (result === 1) {
      // Set expiration separately (Redis < 2.6.12 doesn't have SETNX with expiry)
      await this.redisClient.expire(key, ttlSeconds);
    }

    return result === 1;
  }
}

// Distributed locking pattern
class DistributedLock {
  constructor(cache) {
    this.cache = cache;
    this.lockPrefix = 'lock:';
    this.defaultTTL = 30; // 30 seconds
  }

  async acquire(resource, ttlSeconds = this.defaultTTL) {
    const lockKey = `${this.lockPrefix}${resource}`;
    const lockId = uuidv4(); // Unique identifier for this lock

    // Try to acquire lock
    const acquired = await this.cache.setNX(lockKey, lockId, ttlSeconds);

    if (acquired) {
      return lockId; // Return lock ID for release verification
    }

    return null; // Lock not acquired
  }

  async release(resource, lockId) {
    const lockKey = `${this.lockPrefix}${resource}`;

    // Get current lock ID
    const currentLockId = await this.cache.get(lockKey);

    // Only delete if the lock ID matches (prevent deleting other's lock)
    if (currentLockId === lockId) {
      await this.cache.delete(lockKey);
      return true;
    }

    return false; // Could not release lock
  }
}

// Usage example: processing user points with concurrency protection
async function processUserPoints(userId, points) {
  const cache = new DistributedCache();
  const lock = new DistributedLock(cache);

  // Try to acquire lock
  const lockId = await lock.acquire(`user_points:${userId}`, 10);

  if (!lockId) {
    throw new Error('Could not acquire lock - another process is updating points');
  }

  try {
    // Get current points from database
    const user = await User.findById(userId);

    // Update points
    user.points += points;
    await user.save();

    // Update cache
    await cache.set(`user:${userId}:points`, user.points, 3600);

    return user.points;
  } finally {
    // Always release lock when done
    await lock.release(`user_points:${userId}`, lockId);
  }
}
```

## Performance Monitoring

### Instrumenting Code for Metrics

```javascript
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requestCount: 0,
      responseTimes: [], // Array of response times in ms
      errors: 0,
      statusCodes: {} // Count of status codes
    };

    this.startTime = Date.now();

    // Report metrics every minute
    setInterval(() => this.reportMetrics(), 60 * 1000);
  }

  recordRequest() {
    this.metrics.requestCount++;
    return Date.now(); // Return start time
  }

  recordResponse(startTime, statusCode) {
    const responseTime = Date.now() - startTime;
    this.metrics.responseTimes.push(responseTime);

    // Limit array size to prevent memory issues
    if (this.metrics.responseTimes.length > 1000) {
      this.metrics.responseTimes.shift();
    }

    // Record status code
    this.metrics.statusCodes[statusCode] =
      (this.metrics.statusCodes[statusCode] || 0) + 1;

    // Record error if status code is 4xx or 5xx
    if (statusCode >= 400) {
      this.metrics.errors++;
    }

    return responseTime;
  }

  getStats() {
    const responseTimes = this.metrics.responseTimes;
    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

    // Calculate p95 and p99 (95th and 99th percentiles)
    const sortedTimes = [...responseTimes].sort((a, b) => a - b);
    const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)] || 0;
    const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)] || 0;

    const uptime = (Date.now() - this.startTime) / 1000; // in seconds
    const requestsPerSecond = this.metrics.requestCount / uptime;

    return {
      requestCount: this.metrics.requestCount,
      errorsCount: this.metrics.errors,
      errorRate: this.metrics.requestCount > 0
        ? (this.metrics.errors / this.metrics.requestCount * 100).toFixed(2) + '%'
        : '0%',
      avgResponseTime: avgResponseTime.toFixed(2) + 'ms',
      p95ResponseTime: p95 + 'ms',
      p99ResponseTime: p99 + 'ms',
      requestsPerSecond: requestsPerSecond.toFixed(2),
      statusCodes: this.metrics.statusCodes,
      uptime: uptime.toFixed(0) + 's'
    };
  }

  reportMetrics() {
    const stats = this.getStats();
    console.log('Service Performance Metrics:');
    console.table(stats);

    // Here you would typically send metrics to a monitoring service
    // like Prometheus, Datadog, or CloudWatch
  }

  // Express middleware
  middleware() {
    return (req, res, next) => {
      const startTime = this.recordRequest();

      // Capture original end method
      const originalEnd = res.end;

      // Override end method to record metrics
      res.end = (...args) => {
        const responseTime = this.recordResponse(startTime, res.statusCode);

        // Add X-Response-Time header
        res.setHeader('X-Response-Time', `${responseTime}ms`);

        // Call original end method
        return originalEnd.apply(res, args);
      };

      next();
    };
  }
}

// Usage in Express app
const app = express();
const monitor = new PerformanceMonitor();

// Apply performance monitoring middleware
app.use(monitor.middleware());

// Endpoint to get current metrics
app.get('/metrics', (req, res) => {
  res.json(monitor.getStats());
});
```

## Performance Tips

1. **Use horizontally scalable architecture** - Design for adding more instances rather than bigger servers
2. **Design for statelessness** - Avoid server-local state that prevents scaling out
3. **Implement distributed caching** - Reduce database load and improve response times
4. **Use message queues for asynchronous processing** - Decouple components and handle load spikes
5. **Apply proper load balancing** - Distribute traffic evenly across instances
6. **Implement circuit breakers** - Prevent cascading failures in microservices
7. **Use connection pooling** - Reuse database and service connections
8. **Monitor performance metrics** - Track response times, error rates, and resource usage
9. **Implement health checks and auto-healing** - Automatically recover from failures
10. **Design for fault tolerance** - System should continue to function when components fail

---

**Navigation**
- [⬅️ Previous: API Design](./04-api-design.md)
- [⬆️ Up to Applications](./README.md)