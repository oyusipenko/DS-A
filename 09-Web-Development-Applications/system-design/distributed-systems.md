# Distributed Systems

**Navigation:** [🏠 Home](../../README.md) > [🌐 Web Development Applications](../README.md) > [🏗️ System Design](./README.md) > Distributed Systems

## Understanding Distributed Systems

Distributed systems are collections of independent components that work together as a single coherent system. They provide increased reliability, performance, and scalability but introduce significant complexity in design and operation.

## The CAP Theorem

The CAP theorem, formulated by Eric Brewer, states that a distributed system cannot simultaneously guarantee all three of the following properties:

- **Consistency**: All nodes see the same data at the same time
- **Availability**: Every request receives a response, without guarantee of the latest data
- **Partition Tolerance**: The system continues to function despite network failures

### CAP in Practice

```javascript
// Example: Different system designs prioritize different aspects of CAP

// CP System (Consistent and Partition Tolerant)
class CPSystem {
  constructor(nodes) {
    this.nodes = nodes;
    this.leader = nodes[0]; // Leader-based system
  }

  async write(key, value) {
    try {
      // Two-phase commit to ensure consistency
      // Phase 1: Prepare
      const prepareResults = await Promise.all(
        this.nodes.map(node => node.prepare(key, value))
      );

      if (prepareResults.every(result => result === true)) {
        // Phase 2: Commit
        await Promise.all(this.nodes.map(node => node.commit(key, value)));
        return { success: true };
      } else {
        // Abort if any node failed to prepare
        await Promise.all(this.nodes.map(node => node.abort(key)));
        return { success: false, error: "Failed to prepare all nodes" };
      }
    } catch (error) {
      // During a network partition, system chooses consistency over availability
      return { success: false, error: "Network partition detected, refusing write" };
    }
  }
}

// AP System (Available and Partition Tolerant)
class APSystem {
  constructor(nodes) {
    this.nodes = nodes;
  }

  async write(key, value) {
    try {
      // Write to as many nodes as possible
      const promises = this.nodes.map(node => {
        return node.write(key, value)
          .catch(err => ({ success: false, node: node.id }));
      });

      const results = await Promise.allSettled(promises);

      // Even partial success is considered a success
      // (eventual consistency will reconcile differences later)
      const successCount = results.filter(r => r.value?.success).length;

      return {
        success: successCount > 0,
        successCount,
        totalNodes: this.nodes.length
      };
    } catch (error) {
      // During a partition, system prioritizes availability
      // (some nodes might have outdated data)
      return { success: true, warning: "Partial write during network partition" };
    }
  }
}
```

### Making CAP Decisions

When designing distributed systems, you must choose which two CAP properties to prioritize:

| Type | Consistency | Availability | Partition Tolerance | Example Systems |
|------|-------------|--------------|---------------------|-----------------|
| CA | ✅ | ✅ | ❌ | Traditional SQL databases (with single node) |
| CP | ✅ | ❌ | ✅ | Google Spanner, HBase, MongoDB (with majority writes) |
| AP | ❌ | ✅ | ✅ | Cassandra, Amazon DynamoDB, CouchDB |

**Note**: Since partition tolerance is essential in practical distributed systems, the real choice is often between consistency and availability.

## Data Consistency Models

### Strong Consistency

All readers see the most recent write:

```javascript
// Example: Strongly consistent system with linearizability
class StronglyConsistentKVStore {
  constructor() {
    this.data = new Map();
    this.mutex = new Mutex(); // Simplified mutex implementation
  }

  async write(key, value) {
    // Acquire lock to ensure mutual exclusion
    const release = await this.mutex.acquire();
    try {
      this.data.set(key, value);
      return true;
    } finally {
      // Release lock to allow other operations
      release();
    }
  }

  async read(key) {
    // Acquire lock to ensure consistent reads
    const release = await this.mutex.acquire();
    try {
      return this.data.get(key);
    } finally {
      release();
    }
  }
}
```

**Characteristics:**
- Most intuitive model
- Highest consistency guarantees
- Most expensive to implement in distributed systems
- Significant performance impact

### Eventual Consistency

All readers will eventually see the most recent write, but may temporarily see stale data:

```javascript
// Example: Eventually consistent system
class EventuallyConsistentKVStore {
  constructor(replicaId, peers) {
    this.replicaId = replicaId;
    this.peers = peers; // Other replicas
    this.data = new Map();
    this.vectorClock = new Map(); // Track versions

    // Start background sync process
    this.startBackgroundSync();
  }

  async write(key, value) {
    // Update local version
    const currentVersion = (this.vectorClock.get(key) || 0) + 1;
    this.vectorClock.set(key, currentVersion);

    // Update local data
    this.data.set(key, {
      value,
      version: currentVersion,
      timestamp: Date.now(),
      replicaId: this.replicaId
    });

    // Asynchronously propagate to peers (fire-and-forget)
    this.peers.forEach(peer => {
      peer.receiveUpdate(key, value, currentVersion, this.replicaId)
        .catch(err => console.error('Sync error:', err));
    });

    return true;
  }

  async read(key) {
    const entry = this.data.get(key);
    return entry ? entry.value : null;
  }

  async receiveUpdate(key, value, version, sourceReplicaId) {
    const currentEntry = this.data.get(key);
    const currentVersion = this.vectorClock.get(key) || 0;

    // Apply update if newer version or same version but from higher priority replica
    if (!currentEntry || version > currentVersion ||
        (version === currentVersion && sourceReplicaId > this.replicaId)) {
      this.data.set(key, {
        value,
        version,
        timestamp: Date.now(),
        replicaId: sourceReplicaId
      });
      this.vectorClock.set(key, version);
      return true;
    }
    return false;
  }

  startBackgroundSync() {
    setInterval(() => {
      // Sync with peers to catch up on missed updates
      this.peers.forEach(peer => {
        peer.getSyncData()
          .then(syncData => this.applySync(syncData))
          .catch(err => console.error('Background sync error:', err));
      });
    }, 5000); // Sync every 5 seconds
  }
}
```

**Characteristics:**
- Relaxed consistency for better performance
- Better availability during network partitions
- Requires conflict resolution strategies
- Suitable for systems that can tolerate temporary inconsistencies

### Causal Consistency

Ensures operations that are causally related are seen in the same order by all nodes:

```javascript
// Example: Causally consistent system using vector clocks
class CausallyConsistentKVStore {
  constructor(nodeId, peers) {
    this.nodeId = nodeId;
    this.peers = peers;
    this.data = new Map();
    this.vectorClocks = new Map(); // Track causal dependencies
    this.localClock = new Map(); // Current node's vector clock

    // Initialize local clock
    this.peers.forEach(peer => {
      this.localClock.set(peer.id, 0);
    });
    this.localClock.set(this.nodeId, 0);
  }

  async write(key, value, dependencies = this.localClock) {
    // Increment own entry in vector clock
    const currentCount = this.localClock.get(this.nodeId) || 0;
    this.localClock.set(this.nodeId, currentCount + 1);

    // Store with vector clock to track causality
    this.data.set(key, {
      value,
      vectorClock: new Map(this.localClock)
    });

    // Propagate to peers
    this.peers.forEach(peer => {
      peer.receiveUpdate(key, value, new Map(this.localClock))
        .catch(err => console.error('Propagation error:', err));
    });

    return { success: true };
  }

  async read(key) {
    const entry = this.data.get(key);
    if (!entry) return null;

    // Update local clock with information from this read
    this.mergeClock(entry.vectorClock);

    return {
      value: entry.value,
      dependencies: entry.vectorClock
    };
  }

  async receiveUpdate(key, value, remoteClock) {
    // Check if we have seen all causal dependencies
    if (this.checkCausalDependencies(remoteClock)) {
      // Safe to apply update
      this.data.set(key, {
        value,
        vectorClock: remoteClock
      });

      // Update local clock
      this.mergeClock(remoteClock);
      return true;
    } else {
      // Queue for later when dependencies are met
      this.queueUpdate(key, value, remoteClock);
      return false;
    }
  }

  checkCausalDependencies(remoteClock) {
    // Check if we have seen all events that causally precede this one
    for (const [nodeId, count] of remoteClock.entries()) {
      if (nodeId === this.nodeId) continue;
      if ((this.localClock.get(nodeId) || 0) < count) {
        return false; // Missing some causal dependency
      }
    }
    return true;
  }

  mergeClock(otherClock) {
    // Take the maximum of each entry
    for (const [nodeId, count] of otherClock.entries()) {
      const currentCount = this.localClock.get(nodeId) || 0;
      if (count > currentCount) {
        this.localClock.set(nodeId, count);
      }
    }
  }
}
```

**Characteristics:**
- Preserves cause-effect relationships
- Weaker than strong consistency but stronger than eventual consistency
- Good balance for many distributed applications
- More complex to implement

## Distributed Caching Strategies

### Problem: Cache Inconsistency

Multiple caching nodes can lead to inconsistent cached values:

```javascript
// Problematic caching scenario
class NaiveDistributedCache {
  constructor(nodes) {
    this.nodes = nodes; // Array of cache nodes
  }

  async get(key) {
    // Get from random node (e.g., round-robin or hash-based)
    const nodeIndex = this.getNodeIndex(key);
    return await this.nodes[nodeIndex].get(key);
  }

  async set(key, value, ttl) {
    // Update a single node - other nodes remain stale
    const nodeIndex = this.getNodeIndex(key);
    await this.nodes[nodeIndex].set(key, value, ttl);
  }

  getNodeIndex(key) {
    // Simple hash function to determine node
    return Math.abs(hashCode(key) % this.nodes.length);
  }
}
```

### Solution: Consistent Hashing

Distribute cache keys consistently across nodes:

```javascript
class ConsistentHashCache {
  constructor(nodes, virtualNodes = 100) {
    this.nodes = nodes;
    this.virtualNodes = virtualNodes;
    this.ring = []; // Virtual node ring

    // Create virtual nodes for each physical node
    this.nodes.forEach(node => {
      for (let i = 0; i < virtualNodes; i++) {
        const virtualNodeKey = `${node.id}-${i}`;
        const position = this.hashPosition(virtualNodeKey);
        this.ring.push({
          position,
          nodeId: node.id
        });
      }
    });

    // Sort ring by position
    this.ring.sort((a, b) => a.position - b.position);
  }

  async get(key) {
    const node = this.getResponsibleNode(key);
    return await node.get(key);
  }

  async set(key, value, ttl) {
    const node = this.getResponsibleNode(key);
    return await node.set(key, value, ttl);
  }

  getResponsibleNode(key) {
    const position = this.hashPosition(key);

    // Find first node with position >= hash
    const ringPos = this.ring.find(node => node.position >= position);

    // If not found, wrap around to the first node
    const targetVNode = ringPos || this.ring[0];

    // Map back to physical node
    return this.nodes.find(node => node.id === targetVNode.nodeId);
  }

  hashPosition(key) {
    // Simplified hash function that returns a number between 0 and 2^32-1
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = ((hash << 5) - hash) + key.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  // Handle node addition
  addNode(newNode) {
    this.nodes.push(newNode);

    // Add virtual nodes
    for (let i = 0; i < this.virtualNodes; i++) {
      const virtualNodeKey = `${newNode.id}-${i}`;
      const position = this.hashPosition(virtualNodeKey);
      this.ring.push({
        position,
        nodeId: newNode.id
      });
    }

    // Re-sort the ring
    this.ring.sort((a, b) => a.position - b.position);
  }

  // Handle node removal
  removeNode(nodeId) {
    // Remove from nodes array
    this.nodes = this.nodes.filter(node => node.id !== nodeId);

    // Remove virtual nodes
    this.ring = this.ring.filter(vnode => vnode.nodeId !== nodeId);
  }
}
```

**Benefits of consistent hashing:**
- Minimizes key redistribution when nodes are added/removed
- Provides a deterministic way to locate cached data
- Enables horizontal scaling of caching layer
- Supports hot spot mitigation through virtual nodes

### Cache Invalidation Strategies

#### Time-Based Expiration

```javascript
// Set TTL when caching
cache.set('user:123', userData, 3600); // Expires in 1 hour
```

#### Write-Through Caching

```javascript
async function updateUser(userId, userData) {
  // Update database first
  await database.users.update(userId, userData);

  // Then update cache
  await cache.set(`user:${userId}`, userData);

  return userData;
}
```

#### Cache Invalidation on Update

```javascript
async function updateUser(userId, userData) {
  // Update database
  await database.users.update(userId, userData);

  // Invalidate cache
  await cache.delete(`user:${userId}`);

  // Optionally invalidate related cached data
  await cache.delete(`userPosts:${userId}`);

  return userData;
}
```

## Message Queues in Distributed Systems

Message queues decouple system components and enable asynchronous communication:

```javascript
// Example: Implementing a message queue for order processing
class OrderProcessingSystem {
  constructor(messageQueue) {
    this.messageQueue = messageQueue;
  }

  async placeOrder(orderData) {
    // Validate order
    if (!this.validateOrder(orderData)) {
      throw new Error('Invalid order data');
    }

    // Save to database
    const order = await this.saveOrderToDatabase(orderData);

    // Send to processing queue
    await this.messageQueue.publish('orders.new', {
      orderId: order.id,
      userId: order.userId,
      items: order.items,
      timestamp: Date.now()
    });

    // Return order confirmation immediately
    return {
      orderId: order.id,
      status: 'processing',
      estimatedCompletion: new Date(Date.now() + 1800000) // 30 minutes
    };
  }

  startOrderProcessor() {
    // Subscribe to order queue
    this.messageQueue.subscribe('orders.new', async (message) => {
      try {
        // Process order asynchronously
        const result = await this.processOrder(message);

        // Publish result to completion queue
        await this.messageQueue.publish('orders.completed', {
          orderId: message.orderId,
          status: 'completed',
          processingResult: result
        });
      } catch (error) {
        // Handle failure
        await this.messageQueue.publish('orders.failed', {
          orderId: message.orderId,
          error: error.message
        });
      }
    });
  }

  async processOrder(orderMessage) {
    // Simulated processing (would include inventory check, payment, etc.)
    console.log(`Processing order ${orderMessage.orderId}`);
    await new Promise(resolve => setTimeout(resolve, 5000));

    return {
      success: true,
      processingTime: 5000
    };
  }
}
```

### Benefits of Message Queues

- **Decoupling**: Services don't need direct awareness of each other
- **Load leveling**: Handle traffic spikes gracefully
- **Resilience**: Messages persist even if consumers are down
- **Scalability**: Easy to add more producers or consumers
- **Asynchronous processing**: Non-blocking operations

### Common Message Queue Patterns

#### Publish-Subscribe

```javascript
// Producer (publishes events)
async function publishUserActivity(userId, activity) {
  await messageQueue.publish('user.activity', {
    userId,
    activity,
    timestamp: Date.now()
  });
}

// Multiple consumers (receive all events)
messageQueue.subscribe('user.activity', async (message) => {
  await analyticsService.recordActivity(message);
});

messageQueue.subscribe('user.activity', async (message) => {
  await notificationService.processActivity(message);
});
```

#### Work Queues

```javascript
// Distribute tasks among multiple workers
for (let i = 0; i < 1000; i++) {
  await messageQueue.publish('image.resize', {
    imageId: `img_${i}`,
    dimensions: { width: 800, height: 600 }
  });
}

// Workers compete for tasks
function startWorker(workerId) {
  messageQueue.subscribe('image.resize', async (message) => {
    console.log(`Worker ${workerId} processing image ${message.imageId}`);
    await imageService.resize(message.imageId, message.dimensions);
  });
}

// Start multiple workers
for (let i = 1; i <= 10; i++) {
  startWorker(i);
}
```

## Performance Tips for Distributed Systems

1. **Design for failure** - Assume components will fail and design accordingly
2. **Implement circuit breakers** - Prevent cascading failures when services are down
3. **Use appropriate consistency models** - Choose based on application requirements
4. **Implement retries with backoff** - Handle transient failures gracefully
5. **Monitor system health** - Track key metrics across all components
6. **Implement distributed tracing** - Follow requests through multiple services
7. **Design idempotent operations** - Ensure that operations can be repeated safely
8. **Consider data locality** - Keep data close to computation when possible
9. **Implement proper timeouts** - Don't let requests hang indefinitely
10. **Test with chaos engineering** - Verify system resilience by introducing failures

---

**Navigation**
- [⬅️ Previous: Microservices vs. Monolith](./microservices-vs-monolith.md)
- [⬆️ Up to System Design](./README.md)
- [➡️ Next: Load Balancing](./load-balancing.md)