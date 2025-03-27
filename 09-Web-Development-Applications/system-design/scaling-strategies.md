# Scaling Strategies

**Navigation:** [🏠 Home](../../README.md) > [🌐 Web Development Applications](../README.md) > [🏗️ System Design](./README.md) > Scaling Strategies

## Understanding Scaling

Scaling is the ability of a system to handle growing amounts of work by adding resources to the system. As user demand increases, web applications need to scale to maintain performance and reliability.

## Horizontal vs. Vertical Scaling

### Vertical Scaling (Scaling Up)

Adding more resources to a single node:

```javascript
// Before scaling: Server configuration
const server = {
  cpu: '4 cores',
  memory: '16 GB',
  storage: '500 GB SSD',
  connections: 1000
};

// After vertical scaling
const upgradedServer = {
  cpu: '16 cores',
  memory: '64 GB',
  storage: '2 TB SSD',
  connections: 4000
};
```

**Implementation example: Upgrading a Node.js application**

```javascript
// Before scaling: Server with limited concurrency
const server = http.createServer(app);
server.listen(3000);

// After scaling: Utilizing more CPU cores
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  console.log(`Master process ${process.pid} is running`);

  // Fork workers for each CPU
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    // Replace the dead worker
    cluster.fork();
  });
} else {
  // Workers share the TCP connection
  const server = http.createServer(app);
  server.listen(3000);
  console.log(`Worker ${process.pid} started`);
}
```

**Characteristics:**
- Simpler to manage (single node)
- Limited by hardware (can't scale infinitely)
- No distributed system complexity
- Higher cost at scale
- Single point of failure
- Downtime during hardware upgrades

### Horizontal Scaling (Scaling Out)

Adding more nodes to a system:

```javascript
// Before scaling: Single application server
const infrastructure = {
  webServers: 1,
  maxConcurrentUsers: 1000,
  averageResponseTime: '200ms'
};

// After horizontal scaling
const scaledInfrastructure = {
  webServers: 10,
  maxConcurrentUsers: 10000,
  averageResponseTime: '180ms',
  loadBalancer: true
};
```

**Implementation example: Containerized deployment with Kubernetes**

```yaml
# Kubernetes deployment manifest scaling horizontally
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-application
spec:
  replicas: 10  # Scale to 10 identical pods
  selector:
    matchLabels:
      app: web-application
  template:
    metadata:
      labels:
        app: web-application
    spec:
      containers:
      - name: web-app
        image: web-app:latest
        resources:
          limits:
            cpu: "1"
            memory: "1Gi"
          requests:
            cpu: "0.5"
            memory: "512Mi"
        ports:
        - containerPort: 3000

---
# Kubernetes HPA (Horizontal Pod Autoscaler)
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: web-application-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-application
  minReplicas: 5
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70  # Scale up when CPU usage exceeds 70%
```

**Characteristics:**
- Near-linear scaling capability
- Better fault tolerance
- No downtime during scaling
- More complex architecture
- Requires stateless design or shared state
- Cost-effective at scale

## Autoscaling Strategies

### Reactive Autoscaling

Scaling based on current load:

```javascript
// Simplified AWS Lambda autoscaling code
exports.scaleApplication = async (event) => {
  const AWS = require('aws-sdk');
  const cloudwatch = new AWS.CloudWatch();
  const autoscaling = new AWS.AutoScaling();

  // Get current CPU utilization
  const metricsResponse = await cloudwatch.getMetricStatistics({
    Namespace: 'AWS/EC2',
    MetricName: 'CPUUtilization',
    Dimensions: [
      {
        Name: 'AutoScalingGroupName',
        Value: 'web-app-asg'
      }
    ],
    StartTime: new Date(Date.now() - 300000), // 5 minutes ago
    EndTime: new Date(),
    Period: 60,
    Statistics: ['Average']
  }).promise();

  const cpuUtilization = metricsResponse.Datapoints[0].Average;

  // Get current capacity
  const asgResponse = await autoscaling.describeAutoScalingGroups({
    AutoScalingGroupNames: ['web-app-asg']
  }).promise();

  const currentCapacity = asgResponse.AutoScalingGroups[0].DesiredCapacity;

  // Scale based on CPU
  let newCapacity = currentCapacity;
  if (cpuUtilization > 70) {
    // Scale up by 2 instances if CPU is high
    newCapacity = Math.min(currentCapacity + 2, 20); // Max 20 instances
  } else if (cpuUtilization < 30 && currentCapacity > 2) {
    // Scale down by 1 instance if CPU is low
    newCapacity = Math.max(currentCapacity - 1, 2); // Min 2 instances
  }

  // Update ASG if capacity changed
  if (newCapacity !== currentCapacity) {
    await autoscaling.setDesiredCapacity({
      AutoScalingGroupName: 'web-app-asg',
      DesiredCapacity: newCapacity
    }).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Scaled from ${currentCapacity} to ${newCapacity} instances`
      })
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'No scaling action needed'
    })
  };
};
```

**Characteristics:**
- Responds to actual conditions
- May lag during sudden traffic spikes
- Cost-efficient (pay for what you need)
- Can cause thrashing (rapid scaling up and down)

### Predictive Autoscaling

Scaling based on predicted future load:

```javascript
// Simplified predictive scaling algorithm
class PredictiveScaler {
  constructor(historicalData, seasonalPeriods = 24) { // 24 hours
    this.historicalData = historicalData;
    this.seasonalPeriods = seasonalPeriods;
    this.forecast = this.calculateForecast();
  }

  calculateForecast() {
    // Apply time series forecasting (simplified)
    // In practice, use more sophisticated algorithms like ARIMA or Prophet
    const forecast = [];
    const days = 7; // Forecast for next 7 days

    for (let day = 0; day < days; day++) {
      for (let hour = 0; hour < 24; hour++) {
        // Find the same hour from previous weeks
        let sum = 0;
        let count = 0;

        for (let pastWeek = 1; pastWeek <= 4; pastWeek++) {
          const pastDayIdx = day - (pastWeek * 7);
          if (pastDayIdx >= 0) {
            const pastHourIdx = (pastDayIdx * 24) + hour;
            if (this.historicalData[pastHourIdx]) {
              sum += this.historicalData[pastHourIdx].load;
              count++;
            }
          }
        }

        const averageLoad = count > 0 ? sum / count : 0;
        // Add 20% buffer
        const predictedLoad = averageLoad * 1.2;

        // Calculate instances needed
        const instancesNeeded = Math.ceil(predictedLoad / 100); // Assuming each instance handles 100 units of load

        forecast.push({
          day,
          hour,
          predictedLoad,
          instancesNeeded
        });
      }
    }

    return forecast;
  }

  getScheduledCapacity(day, hour) {
    const forecastEntry = this.forecast.find(f => f.day === day && f.hour === hour);
    return forecastEntry ? forecastEntry.instancesNeeded : 2; // Default to 2 instances
  }

  generateSchedule() {
    // Generate a schedule for AWS scheduled scaling
    return this.forecast.map(entry => ({
      scheduled_action_name: `scale-day-${entry.day}-hour-${entry.hour}`,
      min_size: entry.instancesNeeded,
      max_size: entry.instancesNeeded + 5, // Allow reactive scaling to add more if needed
      desired_capacity: entry.instancesNeeded,
      start_time: new Date(Date.now() + (entry.day * 24 * 60 * 60 * 1000) + (entry.hour * 60 * 60 * 1000))
    }));
  }
}
```

**Characteristics:**
- Proactively scales before traffic arrives
- Better user experience during predictable traffic patterns
- Requires historical data and analysis
- May over-provision resources if predictions are inaccurate

## Database Scaling Strategies

### Replication

Creating database copies for offloading reads:

```javascript
// MySQL primary-replica configuration (my.cnf)
// Primary server configuration
const primaryConfig = `
[mysqld]
server-id = 1
log_bin = mysql-bin
binlog_format = ROW
binlog_do_db = my_database
`;

// Replica server configuration
const replicaConfig = `
[mysqld]
server-id = 2
relay-log = /var/lib/mysql/mysql-relay-bin
relay-log-index = /var/lib/mysql/mysql-relay-bin.index
read_only = ON
`;

// Application code to utilize read replicas
class Database {
  constructor() {
    this.primaryPool = mysql.createPool({
      host: 'primary-db.example.com',
      user: 'app_user',
      password: 'password',
      database: 'my_database',
      connectionLimit: 10
    });

    this.replicaPool = mysql.createPool({
      host: 'replica-db.example.com',
      user: 'read_user',
      password: 'password',
      database: 'my_database',
      connectionLimit: 20
    });
  }

  async query(sql, params = [], isWrite = false) {
    const pool = isWrite ? this.primaryPool : this.replicaPool;

    try {
      const [results] = await pool.query(sql, params);
      return results;
    } catch (err) {
      console.error('Database query error:', err);

      // If read query failed on replica, retry on primary
      if (!isWrite) {
        console.log('Retrying read query on primary');
        return this.query(sql, params, true);
      }

      throw err;
    }
  }

  async readQuery(sql, params = []) {
    return this.query(sql, params, false);
  }

  async writeQuery(sql, params = []) {
    return this.query(sql, params, true);
  }
}

// Usage
const db = new Database();

// Write queries go to primary
await db.writeQuery('INSERT INTO users (name, email) VALUES (?, ?)', ['John', 'john@example.com']);

// Read queries go to replica
const users = await db.readQuery('SELECT * FROM users WHERE status = ?', ['active']);
```

**Characteristics:**
- Improves read performance
- Provides data redundancy
- Relatively simple to implement
- Replication lag can cause consistency issues
- All write operations still go to primary

### Sharding

Partitioning data across multiple database servers:

```javascript
// Simplified database sharding by user ID
class ShardedDatabase {
  constructor(shardCount = 4) {
    this.shardCount = shardCount;
    this.shards = [];

    // Initialize connection pools for each shard
    for (let i = 0; i < shardCount; i++) {
      this.shards.push(mysql.createPool({
        host: `shard-${i}.example.com`,
        user: 'app_user',
        password: 'password',
        database: 'my_database',
        connectionLimit: 10
      }));
    }
  }

  // Determine which shard a user belongs to
  getUserShard(userId) {
    // Simple modulo-based sharding
    return Math.abs(userId) % this.shardCount;
  }

  // Query operations for a specific user
  async queryUserData(userId, sql, params = []) {
    const shardIndex = this.getUserShard(userId);
    const pool = this.shards[shardIndex];

    try {
      const [results] = await pool.query(sql, params);
      return results;
    } catch (err) {
      console.error(`Error querying shard ${shardIndex}:`, err);
      throw err;
    }
  }

  // Cross-shard query (expensive operation)
  async queryCrossShards(sql, params = []) {
    const promises = this.shards.map(pool => pool.query(sql, params));
    const results = await Promise.all(promises);

    // Merge results from all shards
    return results.flatMap(result => result[0]);
  }

  // Insert user data into appropriate shard
  async insertUserData(userId, sql, params = []) {
    return this.queryUserData(userId, sql, params);
  }
}

// Usage example
const db = new ShardedDatabase(4); // 4 shards

// Insert user - goes to the correct shard based on userId
await db.insertUserData(42,
  'INSERT INTO user_data (user_id, key, value) VALUES (?, ?, ?)',
  [42, 'preferences', JSON.stringify({theme: 'dark'})]
);

// Query user data - only queries the specific shard
const userData = await db.queryUserData(42,
  'SELECT * FROM user_data WHERE user_id = ?',
  [42]
);

// Cross-shard query (expensive) - for analytics
const allActiveUsers = await db.queryCrossShards(
  'SELECT COUNT(*) as count FROM users WHERE status = ?',
  ['active']
);
```

**Characteristics:**
- Distributes data and load across multiple servers
- Increases write capacity
- Reduces impact of single server failures
- Increases application complexity
- Cross-shard queries are expensive
- Rebalancing shards is challenging

### Read/Write Splitting

Directing different types of operations to specialized instances:

```javascript
// MongoDB read/write concern configuration
const { MongoClient } = require('mongodb');

class MongoDatabase {
  constructor() {
    this.uri = 'mongodb+srv://cluster0.example.mongodb.net/';
    this.client = null;
    this.db = null;
  }

  async connect() {
    this.client = new MongoClient(this.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    await this.client.connect();
    this.db = this.client.db('my_database');
    console.log('Connected to MongoDB');
  }

  // Critical write - wait for replication to majority
  async criticalWrite(collection, document) {
    const coll = this.db.collection(collection);
    return await coll.insertOne(document, {
      writeConcern: { w: 'majority', j: true, wtimeout: 5000 }
    });
  }

  // Fast write - don't wait for replication
  async fastWrite(collection, document) {
    const coll = this.db.collection(collection);
    return await coll.insertOne(document, {
      writeConcern: { w: 1 }
    });
  }

  // Read from primary (for strong consistency)
  async readFromPrimary(collection, query) {
    const coll = this.db.collection(collection);
    return await coll.find(query).readPref('primary').toArray();
  }

  // Read from secondary (for eventual consistency but better performance)
  async readFromSecondary(collection, query) {
    const coll = this.db.collection(collection);
    return await coll.find(query).readPref('secondaryPreferred').toArray();
  }

  // Analytics query - can use very eventual consistency
  async analyticsQuery(collection, pipeline) {
    const coll = this.db.collection(collection);
    return await coll.aggregate(pipeline, {
      readPreference: 'secondary',
      maxTimeMS: 60000 // Allow long-running queries
    }).toArray();
  }

  async close() {
    if (this.client) {
      await this.client.close();
      console.log('Disconnected from MongoDB');
    }
  }
}

// Usage
const db = new MongoDatabase();
await db.connect();

// Critical financial transaction
await db.criticalWrite('transactions', {
  userId: 42,
  amount: 500.00,
  type: 'deposit',
  timestamp: new Date()
});

// User activity log - speed is more important than durability
await db.fastWrite('activity_logs', {
  userId: 42,
  action: 'viewed_page',
  page: '/products',
  timestamp: new Date()
});

// Get latest user data (strongly consistent)
const userData = await db.readFromPrimary('users', { id: 42 });

// Get product catalog (eventually consistent is fine)
const products = await db.readFromSecondary('products', { category: 'electronics' });

// Run analytics report
const salesReport = await db.analyticsQuery('sales', [
  { $match: { date: { $gte: new Date('2023-01-01') } } },
  { $group: { _id: '$category', totalSales: { $sum: '$amount' } } },
  { $sort: { totalSales: -1 } }
]);
```

**Characteristics:**
- Optimizes for different operation types
- Improves overall throughput
- Better resource utilization
- Can be combined with sharding
- Requires careful consideration of consistency needs
- Application must be aware of consistency implications

## NoSQL Database Scaling

### Document Database Scaling (MongoDB)

```javascript
// MongoDB replica set configuration
const replicaSetConfig = {
  _id: "rs0",
  members: [
    { _id: 0, host: "mongodb0.example.net:27017", priority: 1 },
    { _id: 1, host: "mongodb1.example.net:27017", priority: 0.5 },
    { _id: 2, host: "mongodb2.example.net:27017", priority: 0.5 }
  ]
};

// MongoDB sharded cluster
const shardConfig = `
// Configure config servers
rs.initiate({
  _id: "configRS",
  configsvr: true,
  members: [
    { _id: 0, host: "cfg1.example.net:27019" },
    { _id: 1, host: "cfg2.example.net:27019" },
    { _id: 2, host: "cfg3.example.net:27019" }
  ]
})

// Configure shard 1
rs.initiate({
  _id: "shard1RS",
  members: [
    { _id: 0, host: "shard1svr1.example.net:27018" },
    { _id: 1, host: "shard1svr2.example.net:27018" },
    { _id: 2, host: "shard1svr3.example.net:27018" }
  ]
})

// Configure shard 2
rs.initiate({
  _id: "shard2RS",
  members: [
    { _id: 0, host: "shard2svr1.example.net:27018" },
    { _id: 1, host: "shard2svr2.example.net:27018" },
    { _id: 2, host: "shard2svr3.example.net:27018" }
  ]
})

// Add shards to cluster
sh.addShard("shard1RS/shard1svr1.example.net:27018")
sh.addShard("shard2RS/shard2svr1.example.net:27018")

// Enable sharding for database
sh.enableSharding("myDatabase")

// Shard collection by userId
sh.shardCollection(
  "myDatabase.users",
  { "userId": 1 }
)

// Shard orders collection by region and timestamp for time-series data
sh.shardCollection(
  "myDatabase.orders",
  { "region": 1, "createdAt": 1 }
)
`;
```

### Key-Value Store Scaling (Redis)

```javascript
// Redis Cluster configuration
const redis = require('redis');
const RedisCluster = require('redis-cluster');

// Define cluster nodes
const clusterNodes = [
  { host: 'redis-node-0', port: 6379 },
  { host: 'redis-node-1', port: 6379 },
  { host: 'redis-node-2', port: 6379 },
  { host: 'redis-node-3', port: 6379 },
  { host: 'redis-node-4', port: 6379 },
  { host: 'redis-node-5', port: 6379 }
];

// Create Redis Cluster client
const cluster = new RedisCluster(clusterNodes);

// Key-based operations automatically route to the correct node
async function cacheUserData(userId, userData) {
  // Redis cluster automatically hashes the key to determine the correct node
  const key = `user:${userId}`;
  await cluster.set(key, JSON.stringify(userData));
  await cluster.expire(key, 3600); // 1 hour expiration
}

async function getUserData(userId) {
  const key = `user:${userId}`;
  const data = await cluster.get(key);
  return data ? JSON.parse(data) : null;
}
```

## Application Architecture for Scaling

### Stateless Application Design

```javascript
// Before: Stateful architecture with local session storage
const express = require('express');
const session = require('express-session');
const app = express();

app.use(session({
  secret: 'my-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true }
}));

app.post('/login', (req, res) => {
  // Authenticate user
  const user = authenticateUser(req.body);
  if (user) {
    // Store user in local session
    req.session.user = user;
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false });
  }
});

// After: Stateless architecture with JWT
const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();

app.post('/login', (req, res) => {
  // Authenticate user
  const user = authenticateUser(req.body);
  if (user) {
    // Create signed JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ success: true, token });
  } else {
    res.status(401).json({ success: false });
  }
});

// Middleware to verify JWT
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

app.get('/profile', authenticate, (req, res) => {
  // req.user contains the decoded JWT payload
  res.json({ user: req.user });
});
```

### Microservices for Independent Scaling

```javascript
// Monolithic structure (harder to scale independently)
const express = require('express');
const app = express();

app.get('/users/:id', async (req, res) => {
  const user = await getUserById(req.params.id);
  res.json(user);
});

app.get('/products', async (req, res) => {
  const products = await getAllProducts();
  res.json(products);
});

app.post('/orders', async (req, res) => {
  const order = await createOrder(req.body);
  res.json(order);
});

// Microservices approach (each service can scale independently)
// user-service.js
const express = require('express');
const app = express();

app.get('/users/:id', async (req, res) => {
  const user = await getUserById(req.params.id);
  res.json(user);
});

// product-service.js
const express = require('express');
const app = express();

app.get('/products', async (req, res) => {
  const products = await getAllProducts();
  res.json(products);
});

// order-service.js
const express = require('express');
const app = express();

app.post('/orders', async (req, res) => {
  // Fetch user and product data from respective services
  const user = await fetch(`http://user-service/users/${req.body.userId}`).then(r => r.json());
  const products = await Promise.all(
    req.body.items.map(item =>
      fetch(`http://product-service/products/${item.productId}`).then(r => r.json())
    )
  );

  const order = await createOrder({
    user,
    items: products.map((product, i) => ({
      product,
      quantity: req.body.items[i].quantity
    }))
  });

  res.json(order);
});
```

## CDN and Edge Caching

Offloading content delivery to global CDN nodes:

```javascript
// Configure a CDN in AWS CloudFront
const AWS = require('aws-sdk');
const cloudfront = new AWS.CloudFront();

async function createCDNDistribution() {
  const params = {
    DistributionConfig: {
      CallerReference: Date.now().toString(),
      Comment: 'Web Application CDN',
      DefaultCacheBehavior: {
        ForwardedValues: {
          Cookies: {
            Forward: 'none',
          },
          QueryString: false,
        },
        MinTTL: 0,
        TargetOriginId: 'web-app-origin',
        TrustedSigners: {
          Enabled: false,
          Quantity: 0,
        },
        ViewerProtocolPolicy: 'redirect-to-https',
        AllowedMethods: {
          Items: ['GET', 'HEAD'],
          Quantity: 2,
        },
      },
      Enabled: true,
      Origins: {
        Items: [
          {
            DomainName: 'web-app-origin.example.com',
            Id: 'web-app-origin',
            CustomOriginConfig: {
              HTTPPort: 80,
              HTTPSPort: 443,
              OriginProtocolPolicy: 'https-only',
            },
          },
        ],
        Quantity: 1,
      },
    },
  };

  try {
    const result = await cloudfront.createDistribution(params).promise();
    console.log('CDN Distribution created:', result.Distribution.Id);
    return result.Distribution;
  } catch (err) {
    console.error('Error creating CDN distribution:', err);
    throw err;
  }
}

// Set Cache-Control headers in your web application
app.get('/static/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'static', req.params.filename);

  // Set cache headers for static assets
  res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours
  res.sendFile(filePath);
});

app.get('/api/products', (req, res) => {
  // Set cache headers for API responses that can be cached
  res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour

  // Send response
  res.json(products);
});

app.get('/api/user/:id', (req, res) => {
  // Don't cache user-specific data
  res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');

  // Send response
  res.json(userData);
});
```

## Performance Tips for Scaling

1. **Design for statelessness** - Make application instances interchangeable
2. **Implement caching at multiple levels** - Browser, CDN, API, database
3. **Use asynchronous processing** - Decouple time-consuming operations
4. **Set appropriate database indexes** - Critical for query performance at scale
5. **Monitor and optimize database queries** - Use explain plans and query analyzers
6. **Implement rate limiting** - Protect from excessive load
7. **Use connection pooling** - Reduce overhead of establishing connections
8. **Consider data locality** - Keep data close to computation when possible
9. **Optimize static assets** - Compress, minify, and bundle front-end resources
10. **Design for graceful degradation** - Maintain core functionality when dependencies fail

---

**Navigation**
- [⬅️ Previous: Load Balancing](./load-balancing.md)
- [⬆️ Up to System Design](./README.md)