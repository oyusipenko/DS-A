# Microservices vs. Monoliths

**Navigation:** [🏠 Home](../../README.md) > [🌐 Web Development Applications](../README.md) > [🏗️ System Design](./README.md) > Architectural Patterns

## Architecture Comparison

### Monolithic Architecture

In a monolithic architecture, all components are interconnected and function as a single unit:

```javascript
// Monolith example: Direct function calls between components
class OrderService {
  async createOrder(orderData) {
    // Validate input
    this.validateOrder(orderData);

    // Check inventory locally
    const inventoryResult = await this.inventoryService.checkInventory(orderData.items);
    if (!inventoryResult.available) {
      throw new Error('Some items are out of stock');
    }

    // Process payment locally
    const paymentResult = await this.paymentService.processPayment(orderData.payment);
    if (!paymentResult.success) {
      throw new Error('Payment processing failed');
    }

    // Create order in database
    const order = await this.orderRepository.save({
      items: orderData.items,
      userId: orderData.userId,
      paymentId: paymentResult.id,
      status: 'created'
    });

    // Update inventory locally
    await this.inventoryService.updateInventory(orderData.items);

    // Send notification locally
    await this.notificationService.sendOrderConfirmation(order);

    return order;
  }

  validateOrder(orderData) {
    // Validation logic
  }
}

// Direct service instantiation and dependency injection
const orderService = new OrderService(
  new InventoryService(inventoryRepository),
  new PaymentService(paymentRepository),
  new NotificationService(notificationRepository),
  new OrderRepository()
);
```

**Advantages:**
- Simplicity in development and deployment
- Lower latency for internal service calls
- Easier transaction management
- Simpler testing of integrated components

**Disadvantages:**
- Harder to scale individual components
- Lower fault isolation
- Technology lock-in
- More complex deployments as the application grows

### Microservices Architecture

In a microservices architecture, components are deployed as separate services with their own databases:

```javascript
// Microservices example: Network calls between services
class OrderService {
  constructor(
    inventoryServiceClient,
    paymentServiceClient,
    notificationServiceClient,
    orderRepository
  ) {
    this.inventoryServiceClient = inventoryServiceClient;
    this.paymentServiceClient = paymentServiceClient;
    this.notificationServiceClient = notificationServiceClient;
    this.orderRepository = orderRepository;
  }

  async createOrder(orderData) {
    // Validate input
    this.validateOrder(orderData);

    // Check inventory via network call
    const inventoryResult = await this.inventoryServiceClient.checkInventory(orderData.items);
    if (!inventoryResult.available) {
      throw new Error('Some items are out of stock');
    }

    // Process payment via network call
    const paymentResult = await this.paymentServiceClient.processPayment(orderData.payment);
    if (!paymentResult.success) {
      throw new Error('Payment processing failed');
    }

    // Create order in database
    const order = await this.orderRepository.save({
      items: orderData.items,
      userId: orderData.userId,
      paymentId: paymentResult.id,
      status: 'created'
    });

    // Update inventory via network call
    await this.inventoryServiceClient.updateInventory(orderData.items);

    // Send notification via network call
    await this.notificationServiceClient.sendOrderConfirmation(order);

    return order;
  }

  validateOrder(orderData) {
    // Validation logic
  }
}

// Service clients for remote API calls
class InventoryServiceClient {
  async checkInventory(items) {
    return await axios.post(`${process.env.INVENTORY_SERVICE_URL}/check`, { items });
  }

  async updateInventory(items) {
    return await axios.post(`${process.env.INVENTORY_SERVICE_URL}/update`, { items });
  }
}

// Similar implementations for other service clients
```

**Advantages:**
- Independent scaling of services
- Technology diversity
- Better fault isolation
- Smaller, more manageable codebases

**Disadvantages:**
- Increased network latency
- Distributed transaction challenges
- More complex deployment and monitoring
- Service discovery and orchestration overhead

## Performance Considerations

### Network Overhead in Microservices

The biggest performance consideration for microservices is network overhead:

```javascript
// Performance measurement for a monolith vs microservices
async function measurePerformance() {
  console.time('Monolith');

  // Monolith: Direct function calls
  const monolithOrder = await monolithOrderService.createOrder(sampleOrderData);

  console.timeEnd('Monolith');

  console.time('Microservices');

  // Microservices: Network calls
  const microservicesOrder = await microservicesOrderService.createOrder(sampleOrderData);

  console.timeEnd('Microservices');
}

// Typical output:
// Monolith: 50ms
// Microservices: 250ms
```

### Optimizing Microservices Communication

#### Service Mesh Implementation

A service mesh can optimize service-to-service communication:

```javascript
// Before service mesh: Direct HTTP calls
const response = await axios.post(`${serviceUrl}/api/resource`, data);

// With service mesh: Intelligent routing, retries, and observability
// The actual HTTP call is intercepted and enhanced by the mesh
const response = await axios.post(`${serviceUrl}/api/resource`, data);
// The service mesh handles:
// - Service discovery
// - Load balancing
// - Automatic retries
// - Circuit breaking
// - Metrics collection
// - Distributed tracing
```

#### Asynchronous Communication Patterns

For non-time-critical operations, use message queues:

```javascript
// Before: Synchronous call that blocks the main flow
await notificationServiceClient.sendOrderConfirmation(order);

// After: Asynchronous message publishing
await messageQueue.publish('order-confirmations', {
  orderId: order.id,
  userId: order.userId,
  items: order.items
});

// Separate consumer service processes the message
messageQueue.subscribe('order-confirmations', async (message) => {
  await notificationService.sendOrderConfirmation(message);
});
```

## Scaling Strategies

### Monolith Scaling

Monoliths typically scale by deploying multiple identical instances:

```javascript
// Load balancer configuration for a monolith (NGINX example)
http {
  upstream monolith_app {
    server monolith1.example.com;
    server monolith2.example.com;
    server monolith3.example.com;
  }

  server {
    listen 80;

    location / {
      proxy_pass http://monolith_app;
    }
  }
}
```

### Microservices Scaling

Microservices can scale individual components based on demand:

```javascript
// Kubernetes deployment scaling example
const { exec } = require('child_process');

// Scale up payment service based on queue depth
function scalePaymentService(queueDepth) {
  if (queueDepth > 1000) {
    exec('kubectl scale deployment payment-service --replicas=10', (error, stdout, stderr) => {
      if (error) {
        console.error(`Error scaling payment service: ${error}`);
        return;
      }
      console.log(`Scaled payment service to 10 replicas`);
    });
  } else if (queueDepth < 100) {
    exec('kubectl scale deployment payment-service --replicas=2', (error, stdout, stderr) => {
      if (error) {
        console.error(`Error scaling payment service: ${error}`);
        return;
      }
      console.log(`Scaled payment service down to 2 replicas`);
    });
  }
}

// Meanwhile, other services can remain at their current scale
```

## Decision Framework

When choosing between monolithic and microservices architectures, consider:

1. **Team Size and Structure**
   - Small teams: Monolith may be more manageable
   - Large teams: Microservices allow independent work

2. **Application Complexity**
   - Simple applications: Start with a monolith
   - Complex domains: Consider domain-driven microservices

3. **Scaling Requirements**
   - Uniform scaling needs: Monolith is simpler
   - Differential scaling needs: Microservices offer flexibility

4. **Development Velocity**
   - Initial development: Monolith is faster to get started
   - Long-term evolution: Microservices enable independent changes

5. **Technology Diversity**
   - Single technology stack: Monolith is consistent
   - Multiple technologies: Microservices allow appropriate tools for each domain

---

**Navigation**
- [⬅️ Back to System Design](./README.md)
- [➡️ Next: Distributed Systems](./distributed-systems.md)