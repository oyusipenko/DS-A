# Load Balancing

**Navigation:** [🏠 Home](../../README.md) > [🌐 Web Development Applications](../README.md) > [🏗️ System Design](./README.md) > Load Balancing

## Understanding Load Balancing

Load balancing is the process of distributing network traffic across multiple servers to ensure high availability, reliability, and optimal resource utilization. It's a critical component in scalable web applications.

## Load Balancing Algorithms

### Round Robin

The simplest strategy, distributing requests sequentially across servers:

```javascript
class RoundRobinLoadBalancer {
  constructor(servers) {
    this.servers = servers;
    this.currentIndex = 0;
  }

  getNextServer() {
    // Select next server in rotation
    const server = this.servers[this.currentIndex];

    // Increment index, wrapping around at the end
    this.currentIndex = (this.currentIndex + 1) % this.servers.length;

    return server;
  }

  handleRequest(request) {
    const server = this.getNextServer();
    return server.process(request);
  }
}
```

**Characteristics:**
- Simple to implement
- Equal distribution regardless of server capacity
- Does not consider server load
- O(1) time complexity
- Best for homogeneous servers with similar capacity

### Weighted Round Robin

Assigns different weights to servers based on their capacity:

```javascript
class WeightedRoundRobinLoadBalancer {
  constructor(servers, weights) {
    this.servers = servers;
    this.weights = weights;
    this.currentIndex = 0;
    this.currentWeight = 0;
    this.maxWeight = Math.max(...weights);
    this.gcd = this.findGCD(weights);
  }

  findGCD(numbers) {
    let result = numbers[0];
    for (let i = 1; i < numbers.length; i++) {
      result = this.gcdTwoNumbers(result, numbers[i]);
    }
    return result;
  }

  gcdTwoNumbers(a, b) {
    while (b) {
      const t = b;
      b = a % b;
      a = t;
    }
    return a;
  }

  getNextServer() {
    while (true) {
      this.currentIndex = (this.currentIndex + 1) % this.servers.length;
      if (this.currentIndex === 0) {
        this.currentWeight = this.currentWeight - this.gcd;
        if (this.currentWeight <= 0) {
          this.currentWeight = this.maxWeight;
        }
      }

      if (this.weights[this.currentIndex] >= this.currentWeight) {
        return this.servers[this.currentIndex];
      }
    }
  }

  handleRequest(request) {
    const server = this.getNextServer();
    return server.process(request);
  }
}
```

**Characteristics:**
- Accounts for different server capacities
- More requests go to higher capacity servers
- Still doesn't consider actual server load
- O(n) time complexity in worst case
- Good for heterogeneous environments

### Least Connections

Routes requests to the server with the fewest active connections:

```javascript
class LeastConnectionsLoadBalancer {
  constructor(servers) {
    this.servers = servers;
    this.connections = new Array(servers.length).fill(0);
  }

  getNextServer() {
    let minConnections = Infinity;
    let selectedIndex = 0;

    // Find server with least active connections
    for (let i = 0; i < this.servers.length; i++) {
      if (this.connections[i] < minConnections) {
        minConnections = this.connections[i];
        selectedIndex = i;
      }
    }

    // Increment connection count
    this.connections[selectedIndex]++;

    return {
      server: this.servers[selectedIndex],
      connectionIndex: selectedIndex
    };
  }

  async handleRequest(request) {
    const { server, connectionIndex } = this.getNextServer();

    try {
      const response = await server.process(request);
      return response;
    } finally {
      // Decrement connection count when request completes
      this.connections[connectionIndex]--;
    }
  }
}
```

**Characteristics:**
- Adapts to varying request processing times
- Prevents server overload
- Requires tracking connection state
- O(n) time complexity to find server with least connections
- Excellent for mixed workloads with varied processing times

### Least Response Time

Routes to the server with the lowest average response time:

```javascript
class LeastResponseTimeLoadBalancer {
  constructor(servers) {
    this.servers = servers;
    this.responseMetrics = this.servers.map(() => ({
      avgResponseTime: 0,
      requestCount: 0,
      activeConnections: 0
    }));
    this.alpha = 0.8; // Smoothing factor for exponential average
  }

  getNextServer() {
    let minScore = Infinity;
    let selectedIndex = 0;

    // Find server with best score (combination of response time and load)
    for (let i = 0; i < this.servers.length; i++) {
      const metrics = this.responseMetrics[i];
      // Score = responseTime * (activeConnections + 1)
      const score = metrics.avgResponseTime * (metrics.activeConnections + 1);

      if (score < minScore) {
        minScore = score;
        selectedIndex = i;
      }
    }

    // Increment active connection count
    this.responseMetrics[selectedIndex].activeConnections++;

    return {
      server: this.servers[selectedIndex],
      metricIndex: selectedIndex
    };
  }

  async handleRequest(request) {
    const { server, metricIndex } = this.getNextServer();
    const startTime = Date.now();

    try {
      const response = await server.process(request);
      return response;
    } finally {
      // Update metrics
      const responseTime = Date.now() - startTime;
      const metrics = this.responseMetrics[metricIndex];

      // Exponential moving average of response time
      metrics.avgResponseTime = this.alpha * metrics.avgResponseTime +
                               (1 - this.alpha) * responseTime;
      metrics.requestCount++;
      metrics.activeConnections--;
    }
  }
}
```

**Characteristics:**
- Considers both server load and performance
- Adapts to changing server conditions
- More complex to implement
- O(n) time complexity
- Best for dynamic environments with varying server performance

### IP Hash

Consistently maps client IPs to specific servers:

```javascript
class IPHashLoadBalancer {
  constructor(servers) {
    this.servers = servers;
  }

  hashIP(ip) {
    // Simple hash function for IP addresses
    let hash = 0;
    for (let i = 0; i < ip.length; i++) {
      hash = ((hash << 5) - hash) + ip.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  getServerForIP(clientIP) {
    const hash = this.hashIP(clientIP);
    const serverIndex = hash % this.servers.length;
    return this.servers[serverIndex];
  }

  handleRequest(request) {
    const clientIP = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
    const server = this.getServerForIP(clientIP);
    return server.process(request);
  }
}
```

**Characteristics:**
- Ensures client requests reach the same server
- Useful for session persistence
- No need to store session state
- O(1) time complexity
- Good for applications requiring sticky sessions

## Session Persistence Strategies

### Problem: Stateful Applications

Many web applications maintain session state, which can be disrupted by load balancing:

```javascript
// Example of a stateful server without persistence
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Authenticate user
  if (authenticateUser(username, password)) {
    // Create session stored only on this server
    req.session.user = { username, role: 'user' };
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false });
  }
});

app.get('/profile', (req, res) => {
  // This will fail if request goes to a different server
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  res.json({ user: req.session.user });
});
```

### Solution 1: Sticky Sessions

Configure the load balancer to route requests from the same client to the same server:

```javascript
class StickySessionLoadBalancer {
  constructor(servers) {
    this.servers = servers;
    this.sessionMap = new Map(); // Maps session IDs to server indices
    this.currentIndex = 0;
  }

  getServer(sessionId) {
    if (sessionId && this.sessionMap.has(sessionId)) {
      // Return the server associated with this session
      const serverIndex = this.sessionMap.get(sessionId);
      return this.servers[serverIndex];
    } else {
      // No session or new session, use round robin
      const serverIndex = this.currentIndex;
      this.currentIndex = (this.currentIndex + 1) % this.servers.length;

      // If there's a session ID, remember which server we assigned
      if (sessionId) {
        this.sessionMap.set(sessionId, serverIndex);
      }

      return this.servers[serverIndex];
    }
  }

  handleRequest(request) {
    // Extract session ID from cookie
    const sessionId = this.extractSessionId(request);
    const server = this.getServer(sessionId);
    return server.process(request);
  }

  extractSessionId(request) {
    // Extract from cookie header, e.g., "connect.sid=s%3A123456.abcdef"
    const cookie = request.headers.cookie || '';
    const match = cookie.match(/connect\.sid=([^;]+)/);
    return match ? match[1] : null;
  }
}
```

**Characteristics:**
- Simple to implement
- No shared state between servers
- Can cause uneven load distribution
- Fails if a server goes down
- Limited scalability

### Solution 2: Centralized Session Storage

Store session data in a shared external system:

```javascript
// Using Redis for centralized session storage with Express.js
const express = require('express');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const redis = require('redis');

const app = express();
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT
});

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Authenticate user
  if (authenticateUser(username, password)) {
    // Session stored in Redis, accessible from any server
    req.session.user = { username, role: 'user' };
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false });
  }
});

app.get('/profile', (req, res) => {
  // Works regardless of which server handles the request
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  res.json({ user: req.session.user });
});
```

**Characteristics:**
- True statelessness for application servers
- Equal load distribution
- Resilient to server failures
- Additional infrastructure required
- Potential for centralized session store to become a bottleneck

### Solution 3: Client-Side Sessions

Store session data on the client using signed cookies or JWTs:

```javascript
// Using JWT for client-side sessions
const express = require('express');
const jwt = require('jsonwebtoken');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET;

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Authenticate user
  if (authenticateUser(username, password)) {
    // Create JWT with user data
    const token = jwt.sign(
      { user: { username, role: 'user' } },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Send JWT to client
    res.json({ success: true, token });
  } else {
    res.status(401).json({ success: false });
  }
});

app.get('/profile', (req, res) => {
  // Extract token from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);

  try {
    // Verify and decode JWT
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ user: decoded.user });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});
```

**Characteristics:**
- No server-side session storage
- Fully stateless servers
- Excellent for scaling
- Limited session data size
- Security considerations for sensitive data

## Health Checks and Failure Detection

### Active Health Checks

Proactively testing server health:

```javascript
class HealthCheckingLoadBalancer {
  constructor(servers, healthCheckPath = '/health', checkInterval = 10000) {
    this.servers = servers;
    this.healthCheckPath = healthCheckPath;
    this.serverStatus = servers.map(() => ({ healthy: true, lastCheck: Date.now() }));

    // Start health check interval
    this.startHealthChecks(checkInterval);
  }

  async checkServerHealth(server, index) {
    try {
      const response = await fetch(`${server.url}${this.healthCheckPath}`, {
        timeout: 5000 // 5 second timeout
      });

      const isHealthy = response.status === 200;
      this.updateServerStatus(index, isHealthy);
      return isHealthy;
    } catch (error) {
      this.updateServerStatus(index, false);
      console.error(`Health check failed for server ${server.url}:`, error.message);
      return false;
    }
  }

  updateServerStatus(index, isHealthy) {
    this.serverStatus[index] = {
      healthy: isHealthy,
      lastCheck: Date.now()
    };
  }

  startHealthChecks(interval) {
    setInterval(() => {
      this.servers.forEach((server, index) => {
        this.checkServerHealth(server, index);
      });
    }, interval);
  }

  getHealthyServer() {
    // Find all healthy servers
    const healthyIndices = this.serverStatus
      .map((status, index) => status.healthy ? index : -1)
      .filter(index => index !== -1);

    if (healthyIndices.length === 0) {
      throw new Error('No healthy servers available');
    }

    // Round robin among healthy servers
    const selectedIndex = healthyIndices[this.currentHealthyIndex % healthyIndices.length];
    this.currentHealthyIndex = (this.currentHealthyIndex + 1) % healthyIndices.length;

    return this.servers[selectedIndex];
  }

  async handleRequest(request) {
    try {
      const server = this.getHealthyServer();
      return await server.process(request);
    } catch (error) {
      // Handle the case when no healthy servers are available
      console.error('Request failed, no healthy servers:', error.message);
      throw new Error('Service unavailable');
    }
  }
}
```

**Health check implementation on server:**
```javascript
// Express.js health check endpoint
app.get('/health', (req, res) => {
  // Check if database connection is healthy
  if (db.isConnected()) {
    // Check if external services are reachable
    Promise.all([
      checkExternalService1(),
      checkExternalService2()
    ])
    .then(() => {
      // All good - respond with 200 OK
      res.status(200).json({ status: 'healthy' });
    })
    .catch(error => {
      // Some dependency is unhealthy
      res.status(503).json({
        status: 'unhealthy',
        reason: error.message
      });
    });
  } else {
    // Database connection issue
    res.status(503).json({
      status: 'unhealthy',
      reason: 'Database connection failed'
    });
  }
});
```

### Passive Health Checks

Monitoring actual request outcomes:

```javascript
class PassiveHealthCheckLoadBalancer {
  constructor(servers) {
    this.servers = servers;
    this.serverMetrics = servers.map(() => ({
      successCount: 0,
      errorCount: 0,
      consecutive5xxErrors: 0,
      isCircuitOpen: false, // circuit breaker state
      lastRetryAttempt: 0
    }));
    this.currentIndex = 0;
    this.circuitOpenTimeout = 30000; // 30 seconds
  }

  getNextHealthyServer() {
    let checkedCount = 0;

    // Try to find a healthy server
    while (checkedCount < this.servers.length) {
      this.currentIndex = (this.currentIndex + 1) % this.servers.length;
      checkedCount++;

      const metrics = this.serverMetrics[this.currentIndex];

      // Check if circuit is open (server marked as unhealthy)
      if (metrics.isCircuitOpen) {
        const now = Date.now();
        // Check if it's time to try the server again
        if (now - metrics.lastRetryAttempt > this.circuitOpenTimeout) {
          // Allow retry - set as retry attempt
          metrics.lastRetryAttempt = now;
          return {
            server: this.servers[this.currentIndex],
            metricIndex: this.currentIndex
          };
        }
      } else {
        // Circuit closed - server is healthy
        return {
          server: this.servers[this.currentIndex],
          metricIndex: this.currentIndex
        };
      }
    }

    // All servers have open circuits - use least recent retry
    let leastRecentRetryIndex = 0;
    let leastRecentRetryTime = Infinity;

    for (let i = 0; i < this.serverMetrics.length; i++) {
      if (this.serverMetrics[i].lastRetryAttempt < leastRecentRetryTime) {
        leastRecentRetryTime = this.serverMetrics[i].lastRetryAttempt;
        leastRecentRetryIndex = i;
      }
    }

    this.serverMetrics[leastRecentRetryIndex].lastRetryAttempt = Date.now();

    return {
      server: this.servers[leastRecentRetryIndex],
      metricIndex: leastRecentRetryIndex
    };
  }

  async handleRequest(request) {
    const { server, metricIndex } = this.getNextHealthyServer();
    const metrics = this.serverMetrics[metricIndex];

    try {
      const response = await server.process(request);

      // Record success
      metrics.successCount++;
      metrics.consecutive5xxErrors = 0;

      // If this was a retry attempt, close the circuit
      if (metrics.isCircuitOpen) {
        metrics.isCircuitOpen = false;
        console.log(`Circuit closed for server ${server.url}`);
      }

      return response;
    } catch (error) {
      // Record error
      metrics.errorCount++;

      // Check if it's a server error (5xx)
      if (error.status >= 500) {
        metrics.consecutive5xxErrors++;

        // Open circuit after 5 consecutive 5xx errors
        if (metrics.consecutive5xxErrors >= 5 && !metrics.isCircuitOpen) {
          metrics.isCircuitOpen = true;
          console.error(`Circuit opened for server ${server.url} after 5 consecutive errors`);
        }
      }

      throw error;
    }
  }
}
```

## Geographic Load Balancing

Global traffic distribution across multiple data centers:

```javascript
class GeoLoadBalancer {
  constructor(regions) {
    this.regions = regions; // Map of region name to load balancer instance
    this.geoDatabase = this.loadGeoDatabase(); // IP to region mapping
  }

  loadGeoDatabase() {
    // Simplified implementation - would typically use MaxMind or similar
    return {
      lookupRegion(ip) {
        // Simplified mapping based on IP prefix
        if (ip.startsWith('17.')) return 'us-east';
        if (ip.startsWith('18.')) return 'us-west';
        if (ip.startsWith('19.')) return 'eu-central';
        if (ip.startsWith('20.')) return 'ap-east';
        return 'us-east'; // Default region
      }
    };
  }

  getRegionForRequest(request) {
    const clientIP = request.headers['x-forwarded-for'] || request.connection.remoteAddress;

    // Determine region based on client IP
    const region = this.geoDatabase.lookupRegion(clientIP);

    // Check if the client specified a region preference
    const preferredRegion = request.headers['x-preferred-region'];
    if (preferredRegion && this.regions.has(preferredRegion)) {
      return preferredRegion;
    }

    // Fall back to geo-detected region if available, otherwise use default
    return this.regions.has(region) ? region : 'us-east';
  }

  async handleRequest(request) {
    // Get appropriate region for this request
    const region = this.getRegionForRequest(request);
    const regionalLoadBalancer = this.regions.get(region);

    try {
      // Forward to the regional load balancer
      return await regionalLoadBalancer.handleRequest(request);
    } catch (error) {
      // If the primary region fails, try a fallback region
      const availableRegions = Array.from(this.regions.keys()).filter(r => r !== region);

      if (availableRegions.length > 0) {
        const fallbackRegion = availableRegions[0];
        console.log(`Failing over from ${region} to ${fallbackRegion}`);

        return await this.regions.get(fallbackRegion).handleRequest(request);
      }

      // No fallback available
      throw error;
    }
  }

  // DNS-based geo-routing (simplified)
  configureDNSGeolocation() {
    // In a real implementation, this would configure DNS services like Route53
    return {
      'us-east.example.com': { target: 'lb-us-east.example.com', region: 'us-east' },
      'us-west.example.com': { target: 'lb-us-west.example.com', region: 'us-west' },
      'eu.example.com': { target: 'lb-eu-central.example.com', region: 'eu-central' },
      'asia.example.com': { target: 'lb-ap-east.example.com', region: 'ap-east' },
      'example.com': { target: ['lb-us-east.example.com', 'lb-eu-central.example.com'], geolocation: true }
    };
  }
}
```

### Routing Considerations

- **Latency vs. Locality**: Sometimes the closest server isn't the best choice
- **Regional Compliance**: Data sovereignty laws may require specific routing
- **Disaster Recovery**: Multi-region deployments for resilience
- **Cost Optimization**: Different regions have different pricing

## Performance Tips for Load Balancing

1. **Use appropriate algorithms** - Match your workload characteristics
2. **Implement proper health checks** - Both active and passive monitoring
3. **Design for session persistence** - Either sticky sessions or shared state
4. **Consider geographic distribution** - Minimize latency for global users
5. **Monitor load balancer performance** - Identify bottlenecks
6. **Implement rate limiting** - Protect against traffic spikes
7. **Use SSL termination** - Offload cryptographic operations
8. **Implement proper timeouts** - Don't let slow servers affect the entire system
9. **Consider layer 4 vs layer 7 balancing** - Choose based on inspection needs
10. **Plan for scalability** - Ensure load balancers themselves can scale

---

**Navigation**
- [⬅️ Previous: Distributed Systems](./distributed-systems.md)
- [⬆️ Up to System Design](./README.md)
- [➡️ Next: Scaling Strategies](./scaling-strategies.md)