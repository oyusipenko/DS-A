# Server Scaling Patterns

**Navigation:** [🏠 Home](../../README.md) > [🌐 Web Development Applications](../README.md) > [🖥️ Backend Systems](./README.md) > Server Scaling Patterns

## Understanding Server Scaling

Server scaling is the process of adjusting server resources to handle varying workloads. Effective scaling strategies are essential for applications to maintain performance as user numbers grow and request patterns change. This document explores patterns for scaling backend services efficiently.

## Horizontal vs. Vertical Scaling

### Vertical Scaling (Scaling Up)

Vertical scaling involves increasing the resources (CPU, RAM, disk) of existing servers:

```javascript
// Example: Resource requirements for a monolithic Node.js application
{
  "name": "ecommerce-monolith",
  "type": "web",
  "size": "performance-l", // 14GB RAM, 8 vCPUs
  "autoscaling": false,
  "instances": 1,
  "config": {
    "NODE_ENV": "production",
    "MAX_OLD_SPACE_SIZE": "12288", // 12GB for Node.js heap
    "DB_CONNECTION": "postgresql://user:pass@db-host/ecommerce?pool=100"
  }
}
```

**Advantages:**
- Simpler to implement and manage
- No distributed systems complexity
- Better for memory-intensive applications
- Lower inter-process communication overhead

**Disadvantages:**
- Hardware limits impose scaling ceiling
- Single point of failure
- More expensive at higher scales
- Limited by the capabilities of a single machine

### Horizontal Scaling (Scaling Out)

Horizontal scaling involves adding more server instances to distribute the load:

```javascript
// Example: Kubernetes deployment for horizontally scaled microservices
// api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-service
spec:
  replicas: 5  # Multiple identical instances
  selector:
    matchLabels:
      app: api-service
  template:
    metadata:
      labels:
        app: api-service
    spec:
      containers:
      - name: api-server
        image: ecommerce/api-service:v1.2.3
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        env:
        - name: NODE_ENV
          value: "production"
        - name: SERVICE_PORT
          value: "3000"
        ports:
        - containerPort: 3000
```

**Advantages:**
- Near-linear scalability
- Better fault tolerance through redundancy
- Can leverage commodity hardware
- No upper limit to scaling potential

**Disadvantages:**
- Requires distributed systems design
- More complex deployment and monitoring
- Network overhead between instances
- May require application redesign

## Stateless Design for Improved Scalability

### Problem: Stateful Applications

Stateful applications store session data locally, making horizontal scaling difficult:

```javascript
// Inefficient: Server with local state
const express = require('express');
const app = express();

// Memory-based session storage (local to this instance)
const sessions = {};

// Generate a session ID
function generateSessionId() {
  return Math.random().toString(36).substring(2, 15);
}

// Authentication middleware
app.use((req, res, next) => {
  const sessionId = req.cookies?.sessionId;

  if (sessionId && sessions[sessionId]) {
    // Found session on this server
    req.user = sessions[sessionId].user;
    next();
  } else {
    // No valid session
    req.user = null;
    next();
  }
});

// Login endpoint
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Authentication logic...
  const user = authenticateUser(username, password);

  if (user) {
    // Create session on this server instance
    const sessionId = generateSessionId();
    sessions[sessionId] = {
      user,
      createdAt: new Date(),
    };

    // Send cookie to client
    res.cookie('sessionId', sessionId, { httpOnly: true });
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false });
  }
});
```

This approach:
- Ties users to specific server instances
- Creates problems with load balancers
- Makes scaling and deployment difficult
- Loses sessions when an instance goes down

### Solution: Stateless Application Design

Implement a stateless architecture to enable seamless horizontal scaling:

```javascript
// Optimized: Stateless server with external session store
const express = require('express');
const Redis = require('ioredis');
const jwt = require('jsonwebtoken');
const app = express();

// External session store
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD
});

// JWT for authentication
const JWT_SECRET = process.env.JWT_SECRET;

// Authentication middleware
app.use(async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    // Verify token (stateless)
    const decoded = jwt.verify(token, JWT_SECRET);

    // Check if token has been revoked (minimal state check)
    const isRevoked = await redis.sismember('revoked_tokens', token);
    if (isRevoked) {
      req.user = null;
      return next();
    }

    req.user = decoded;
    next();
  } catch (error) {
    req.user = null;
    next();
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Authentication logic...
  const user = authenticateUser(username, password);

  if (user) {
    // Generate JWT (stateless token)
    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Store minimal session data if needed
    await redis.hset(`user:${user.id}:sessions`, token, JSON.stringify({
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      createdAt: new Date()
    }));

    res.json({ token });
  } else {
    res.status(401).json({ success: false });
  }
});

// Logout endpoint
app.post('/logout', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (token) {
    // Revoke token
    await redis.sadd('revoked_tokens', token);

    // Remove session data
    if (req.user) {
      await redis.hdel(`user:${req.user.id}:sessions`, token);
    }
  }

  res.json({ success: true });
});
```

This implementation:
- Uses stateless JWT tokens for authentication
- Stores minimal state in a shared Redis store
- Allows any server instance to handle any request
- Makes horizontal scaling seamless
- Continues working when individual instances fail

## Achieving Elasticity with Autoscaling

### Manual Scaling vs. Autoscaling

Manual scaling requires administrators to adjust resources based on anticipated load:

```bash
# Manual scaling example (kubectl)
kubectl scale deployment api-service --replicas=10

# Manual scaling example (AWS CLI)
aws ec2 modify-instance-attribute --instance-id i-1234567890abcdef0 --instance-type r5.xlarge
```

Autoscaling automatically adjusts resources based on observed metrics:

```yaml
# Kubernetes Horizontal Pod Autoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-service
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  - type: Pods
    pods:
      metric:
        name: requests_per_second
      target:
        type: AverageValue
        averageValue: 1000
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 100
        periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 120
```

### Implementing Custom Autoscaling Logic

For more advanced scenarios, custom autoscaling logic might be needed:

```javascript
// Custom autoscaling logic with Node.js
const axios = require('axios');
const k8s = require('@kubernetes/client-node');
const prometheusClient = require('prom-client');

// Setup Kubernetes client
const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const k8sApi = kc.makeApiClient(k8s.AppsV1Api);

// Prometheus metrics
const registry = new prometheusClient.Registry();
prometheusClient.collectDefaultMetrics({ register: registry });

// Custom scaling logic
async function checkAndScale() {
  try {
    // Get current metrics from Prometheus
    const metricsResponse = await axios.get('http://prometheus:9090/api/v1/query', {
      params: {
        query: 'sum(rate(http_request_duration_seconds_count{service="api-service"}[5m]))'
      }
    });

    const currentRPS = metricsResponse.data.data.result[0]?.value[1] || 0;

    // Get current deployment status
    const deployment = await k8sApi.readNamespacedDeployment('api-service', 'default');
    const currentReplicas = deployment.body.spec.replicas;

    // Calculate target replicas based on RPS
    // Each pod should handle ~100 RPS optimally
    let targetReplicas = Math.ceil(currentRPS / 100);

    // Apply constraints
    targetReplicas = Math.max(3, Math.min(20, targetReplicas));

    // Only scale if difference is significant
    if (Math.abs(targetReplicas - currentReplicas) >= 2) {
      console.log(`Scaling from ${currentReplicas} to ${targetReplicas} replicas`);

      // Update deployment
      deployment.body.spec.replicas = targetReplicas;
      await k8sApi.replaceNamespacedDeployment(
        'api-service',
        'default',
        deployment.body
      );

      // Log scaling event
      console.log(`Scaled deployment to ${targetReplicas} replicas`);
    }
  } catch (error) {
    console.error('Error in autoscaler:', error);
  }
}

// Run scaling check every minute
setInterval(checkAndScale, 60000);
```

## Load Balancing Algorithms

Load balancers distribute traffic across server instances. The choice of algorithm significantly impacts performance and resource utilization.

### 1. Round Robin

Distributes requests sequentially to each server in turn:

```javascript
// Simple round-robin implementation
class RoundRobinBalancer {
  constructor(servers) {
    this.servers = servers;
    this.currentIndex = 0;
  }

  nextServer() {
    const server = this.servers[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.servers.length;
    return server;
  }
}

// Usage
const loadBalancer = new RoundRobinBalancer([
  'http://api1.example.com',
  'http://api2.example.com',
  'http://api3.example.com'
]);

app.use((req, res, next) => {
  const targetServer = loadBalancer.nextServer();
  console.log(`Routing request to ${targetServer}`);
  // Forward request logic...
});
```

**Characteristics:**
- Even distribution of requests
- No consideration of server load
- Simple to implement
- Good for homogeneous environments

### 2. Weighted Round Robin

Assigns different weights to servers based on their capacity:

```javascript
class WeightedRoundRobinBalancer {
  constructor(servers) {
    this.servers = servers.map(s => ({
      url: s,
      weight: 1
    }));
    this.currentIndex = 0;
    this.weights = servers.map(s => 1);
    this.gcd = this.findGCD(this.weights);
    this.maxWeight = Math.max(...this.weights);
    this.currentWeight = 0;
  }

  // Find greatest common divisor
  findGCD(numbers) {
    let result = numbers[0];
    for (let i = 1; i < numbers.length; i++) {
      result = this.gcdOfTwo(result, numbers[i]);
      if (result === 1) return 1;
    }
    return result;
  }

  gcdOfTwo(a, b) {
    while (b) {
      const t = b;
      b = a % b;
      a = t;
    }
    return a;
  }

  nextServer() {
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
}

// Usage
const loadBalancer = new WeightedRoundRobinBalancer([
  'http://api1.example.com',
  'http://api2.example.com',
  'http://api3.example.com'
]);
```

**Characteristics:**
- Accounts for different server capacities
- Distributes load proportionally
- Good for heterogeneous environments
- Slightly more complex to implement

### 3. Least Connections

Routes requests to the server with the fewest active connections:

```javascript
class LeastConnectionsBalancer {
  constructor(servers) {
    this.servers = servers.map(url => ({
      url,
      connections: 0
    }));
  }

  nextServer() {
    const server = this.servers.reduce((min, current) =>
      current.connections < min.connections ? current : min, this.servers[0]);

    server.connections++;
    return {
      url: server.url,
      release: () => { server.connections--; }
    };
  }
}

// Usage
const loadBalancer = new LeastConnectionsBalancer([
  'http://api1.example.com',
  'http://api2.example.com',
  'http://api3.example.com'
]);

app.use(async (req, res, next) => {
  const server = loadBalancer.nextServer();
  console.log(`Routing request to ${server.url}`);

  // Use response.on('finish') to track when request completes
  res.on('finish', () => {
    server.release();
  });

  // Forward request logic...
});
```

**Characteristics:**
- Dynamically adapts to server load
- Prevents overloading busy servers
- Good for mixed workloads
- Requires connection tracking

### 4. Least Response Time

Routes to the server with the fastest response times:

```javascript
class LeastResponseTimeBalancer {
  constructor(servers) {
    this.servers = servers.map(url => ({
      url,
      responseTime: 100, // Initial guess in ms
      connections: 0,
      lastChecked: Date.now()
    }));

    // Periodically probe servers
    setInterval(() => this.probeServers(), 30000);
  }

  async probeServers() {
    for (const server of this.servers) {
      try {
        const start = Date.now();
        await axios.get(`${server.url}/health`);
        const responseTime = Date.now() - start;

        // Exponential moving average (EMA)
        server.responseTime = server.responseTime * 0.7 + responseTime * 0.3;
        server.lastChecked = Date.now();
      } catch (error) {
        // If health check fails, penalize the server
        server.responseTime = server.responseTime * 1.5;
      }
    }
  }

  nextServer() {
    // Find server with best score (lowest response time * connections)
    const server = this.servers.reduce((best, current) => {
      const bestScore = best.responseTime * (best.connections + 1);
      const currentScore = current.responseTime * (current.connections + 1);
      return currentScore < bestScore ? current : best;
    }, this.servers[0]);

    server.connections++;
    return {
      url: server.url,
      release: () => { server.connections--; }
    };
  }
}
```

**Characteristics:**
- Favors fastest responding servers
- Adapts to server performance changes
- Good for latency-sensitive applications
- Most complex to implement correctly

## Efficient Resource Utilization

### Container Resource Allocation

Properly configuring container resources prevents waste and ensures reliability:

```yaml
# Kubernetes deployment with resource constraints
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-service
spec:
  replicas: 5
  selector:
    matchLabels:
      app: api-service
  template:
    metadata:
      labels:
        app: api-service
    spec:
      containers:
      - name: api-server
        image: ecommerce/api-service:v1.2.3
        resources:
          requests:
            # What the container is guaranteed to get
            memory: "256Mi"
            cpu: "200m"  # 0.2 CPU cores
          limits:
            # Maximum resources container can use
            memory: "512Mi"
            cpu: "500m"  # 0.5 CPU cores
        env:
        - name: NODE_ENV
          value: "production"
        # Node.js specific memory limit matching container limit
        - name: NODE_OPTIONS
          value: "--max-old-space-size=384"  # 75% of container limit
```

### Node.js-Specific Optimizations

Optimize Node.js applications for container environments:

```javascript
// Cluster mode to utilize multiple CPU cores
const cluster = require('cluster');
const os = require('os');
const express = require('express');

// Number of workers based on available CPUs, up to a reasonable limit
const WORKERS = Math.min(os.cpus().length, 4);

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // Fork workers
  for (let i = 0; i < WORKERS; i++) {
    cluster.fork();
  }

  // Handle worker exits
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    // Replace the dead worker
    cluster.fork();
  });
} else {
  // Workers share the TCP connection
  const app = express();

  // Configure memory usage reporting
  const memoryUsage = () => {
    const used = process.memoryUsage();
    return {
      rss: `${Math.round(used.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)}MB`,
      external: `${Math.round(used.external / 1024 / 1024)}MB`
    };
  };

  // Report memory usage periodically
  setInterval(() => {
    console.log(`Worker ${process.pid} memory usage:`, memoryUsage());
  }, 30000);

  // Handle uncaught exceptions properly
  process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    // Perform cleanup, log error details

    // Exit process (will be replaced by cluster)
    process.exit(1);
  });

  // Setup routes and start server
  app.get('/', (req, res) => {
    res.send('Hello from worker ' + process.pid);
  });

  app.listen(3000, () => {
    console.log(`Worker ${process.pid} started`);
  });
}
```

## Health Checking and Self-Healing

Implement health checks to enable self-healing systems:

```javascript
// Health check endpoint
app.get('/health', (req, res) => {
  const checks = {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    dbConnection: true,
    cacheConnection: true
  };

  // Check database connection
  try {
    const dbPing = db.ping();
    checks.dbConnection = dbPing;
  } catch (error) {
    checks.dbConnection = false;
  }

  // Check cache connection
  try {
    const cachePing = cache.ping();
    checks.cacheConnection = cachePing;
  } catch (error) {
    checks.cacheConnection = false;
  }

  // Report overall health status
  const healthy = checks.dbConnection && checks.cacheConnection;
  const status = healthy ? 200 : 503;

  res.status(status).json({
    status: healthy ? 'healthy' : 'unhealthy',
    checks
  });
});

// Readiness check endpoint (different from health check)
app.get('/ready', (req, res) => {
  // Check if the application is ready to serve traffic
  const isReady = appInitialized && dbConnected && cacheConnected;
  const status = isReady ? 200 : 503;

  res.status(status).json({
    status: isReady ? 'ready' : 'not ready'
  });
});
```

## Performance Tips for Server Scaling

1. **Design for statelessness** - Store session and state data in shared external stores
2. **Use horizontal scaling** - Prefer adding more instances over larger instances
3. **Implement health checks** - Enable automated recovery from failures
4. **Choose appropriate load balancing** - Match algorithm to application characteristics
5. **Set proper resource constraints** - Define both minimum and maximum resource limits
6. **Containerize applications** - Use containers for consistent deployment and scaling
7. **Implement graceful shutdown** - Handle in-progress requests during scaling events
8. **Use circuit breakers** - Prevent cascading failures across services
9. **Monitor key metrics** - Track CPU, memory, response times, and error rates
10. **Automate scaling** - Use autoscaling based on relevant application metrics

---

**Navigation**
- [⬅️ Back to Backend Systems](./README.md)
- [➡️ Next: API Endpoint Optimization](./api-optimization.md)