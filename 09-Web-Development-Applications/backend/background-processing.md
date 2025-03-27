# Background Processing Optimization

**Navigation:** [🏠 Home](../../README.md) > [🌐 Web Development Applications](../README.md) > [🖥️ Backend Systems](./README.md) > Background Processing

## Understanding Background Processing

Background processing allows servers to handle time-consuming operations asynchronously, without blocking the main request-response cycle. This pattern is crucial for maintaining responsiveness in web applications, especially when dealing with resource-intensive tasks like image processing, report generation, or bulk operations.

## Job Queue Implementations

### Problem: Synchronous Processing of Heavy Tasks

Processing expensive operations within the request lifecycle leads to poor user experience:

```javascript
// Inefficient: Synchronous processing in the request handler
app.post('/api/orders', async (req, res) => {
  try {
    // Validate order
    const order = new Order(req.body);
    await order.save();

    // Process payment (takes 2-5 seconds)
    await paymentProcessor.charge(order.paymentDetails);

    // Generate invoice (takes 1-3 seconds)
    const invoice = await invoiceGenerator.create(order);

    // Send confirmation email (takes 1-2 seconds)
    await emailService.sendOrderConfirmation(order, invoice);

    // Generate shipping label (takes 2-4 seconds)
    const shippingLabel = await shippingService.createLabel(order);

    // Update inventory (takes 1-3 seconds)
    await inventoryService.updateStock(order.items);

    // Request can take 7-17 seconds to complete!
    res.status(201).json({ orderId: order.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

This approach:
- Forces the user to wait for the entire process to complete
- Ties up server resources for extended periods
- Creates a poor user experience
- Is vulnerable to connection timeouts
- Doesn't handle retries for failed operations

### Solution: Message Queue with Workers

Implement a job queue system to process tasks asynchronously:

```javascript
// Optimized: Using a job queue with Bull/Redis
const Queue = require('bull');

// Create queue instances for different job types
const paymentQueue = new Queue('payment-processing');
const emailQueue = new Queue('email-notifications');
const invoiceQueue = new Queue('invoice-generation');
const shippingQueue = new Queue('shipping-labels');
const inventoryQueue = new Queue('inventory-updates');

// Configure queues with appropriate settings
paymentQueue.process(async (job) => {
  const { orderId } = job.data;
  const order = await Order.findById(orderId);
  await paymentProcessor.charge(order.paymentDetails);
  return { success: true };
});

// Similar processors for other queues...

// API route that queues jobs instead of processing them
app.post('/api/orders', async (req, res) => {
  try {
    // Only do essential synchronous work
    const order = new Order(req.body);
    order.status = 'processing';
    await order.save();

    // Queue all heavy tasks
    await paymentQueue.add({ orderId: order.id }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    });

    // Use job dependencies to create a workflow
    const invoiceJob = await invoiceQueue.add(
      { orderId: order.id },
      {
        attempts: 3,
        delay: 1000, // Start after 1 second
        // Wait for payment to complete
        waitChildrenCount: await paymentQueue.getActiveCount()
      }
    );

    // Email depends on invoice
    await emailQueue.add(
      { orderId: order.id },
      { jobId: `email:${order.id}`, depends: invoiceJob.id }
    );

    // These can run in parallel
    await shippingQueue.add({ orderId: order.id });
    await inventoryQueue.add({ orderId: order.id });

    // Respond immediately to the client
    res.status(202).json({
      orderId: order.id,
      message: 'Order received and processing has begun',
      statusCheckUrl: `/api/orders/${order.id}/status`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Status endpoint to check progress
app.get('/api/orders/:id/status', async (req, res) => {
  const order = await Order.findById(req.params.id);
  res.json({ status: order.status, lastUpdated: order.updatedAt });
});
```

This implementation:
- Responds to the user immediately
- Processes time-consuming tasks in the background
- Handles retries for failed operations
- Scales horizontally by adding more workers
- Creates a workflow with job dependencies
- Provides a status endpoint for the client to check progress

## Worker Pools and Thread Management

### Problem: Limited Concurrency and CPU Bottlenecks

Node.js is single-threaded by default, which can limit throughput for CPU-intensive tasks:

```javascript
// Inefficient: CPU-bound tasks block the event loop
app.post('/api/images/resize', async (req, res) => {
  try {
    const { imagePath, width, height } = req.body;

    // This is CPU intensive and blocks the event loop
    const resizedImage = await sharp(imagePath)
      .resize(width, height)
      .toBuffer();

    // Save the result
    await fs.writeFile(`resized-${path.basename(imagePath)}`, resizedImage);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

This approach:
- Blocks the event loop during image processing
- Limits the server to processing one image at a time per Node.js instance
- Creates a bottleneck for concurrent requests
- Underutilizes multi-core CPUs

### Solution: Worker Threads for CPU-Intensive Tasks

Use worker threads to process CPU-bound tasks across multiple cores:

```javascript
// Optimized: Using worker threads for CPU-intensive tasks
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const os = require('os');
const path = require('path');
const Queue = require('bull');

// Create a worker pool
class WorkerPool {
  constructor(size, filePath) {
    this.size = size;
    this.filePath = filePath;
    this.workers = [];
    this.freeWorkers = [];

    for (let i = 0; i < this.size; i++) {
      const worker = new Worker(this.filePath);
      this.workers.push(worker);
      this.freeWorkers.push(i);
    }
  }

  async runTask(data) {
    return new Promise((resolve, reject) => {
      if (this.freeWorkers.length === 0) {
        return reject(new Error('No free workers'));
      }

      const workerId = this.freeWorkers.pop();
      const worker = this.workers[workerId];

      const messageHandler = (result) => {
        // Free the worker
        this.freeWorkers.push(workerId);
        worker.removeListener('message', messageHandler);
        worker.removeListener('error', errorHandler);
        resolve(result);
      };

      const errorHandler = (error) => {
        // Free the worker
        this.freeWorkers.push(workerId);
        worker.removeListener('message', messageHandler);
        worker.removeListener('error', errorHandler);
        reject(error);
      };

      worker.on('message', messageHandler);
      worker.on('error', errorHandler);

      worker.postMessage(data);
    });
  }

  close() {
    for (const worker of this.workers) {
      worker.terminate();
    }
  }
}

// Create a worker file (image-worker.js)
// -----------------------------------
if (!isMainThread) {
  const sharp = require('sharp');
  const fs = require('fs').promises;

  parentPort.on('message', async (data) => {
    try {
      const { imagePath, width, height, outputPath } = data;

      // Perform CPU-intensive work
      const resizedImage = await sharp(imagePath)
        .resize(width, height)
        .toBuffer();

      // Save the result
      await fs.writeFile(outputPath, resizedImage);

      // Send the result back
      parentPort.postMessage({ success: true, outputPath });
    } catch (error) {
      parentPort.postMessage({
        success: false,
        error: error.message
      });
    }
  });
}
// -----------------------------------

// In the main application
const imageQueue = new Queue('image-processing');
const workerPool = new WorkerPool(
  Math.max(1, os.cpus().length - 1), // Use all CPUs except one
  path.join(__dirname, 'image-worker.js')
);

// Process images using the worker pool
imageQueue.process(10, async (job) => {
  const { imagePath, width, height } = job.data;
  const outputPath = `resized-${path.basename(imagePath)}`;

  // Process in worker thread
  return await workerPool.runTask({
    imagePath,
    width,
    height,
    outputPath
  });
});

// API endpoint to enqueue image processing
app.post('/api/images/resize', async (req, res) => {
  try {
    const { imagePath, width, height } = req.body;

    // Add job to queue
    const job = await imageQueue.add({
      imagePath,
      width,
      height
    }, {
      attempts: 3,
      removeOnComplete: true
    });

    res.json({
      jobId: job.id,
      status: 'queued',
      statusUrl: `/api/images/status/${job.id}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Status endpoint
app.get('/api/images/status/:jobId', async (req, res) => {
  const job = await imageQueue.getJob(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  const state = await job.getState();
  const result = job.returnvalue;

  res.json({
    jobId: job.id,
    state,
    result: state === 'completed' ? result : null
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await imageQueue.close();
  workerPool.close();
  process.exit(0);
});
```

This implementation:
- Utilizes all available CPU cores
- Prevents blocking the event loop
- Scales with the number of cores
- Maintains a pool of reusable workers
- Queues jobs when all workers are busy
- Provides status tracking for each job

## Scheduled Task Optimization

### Problem: Inefficient Periodic Task Execution

Many applications need to run periodic tasks that can impact performance if implemented poorly:

```javascript
// Inefficient: Basic interval-based scheduling
function setupScheduledTasks() {
  // Daily report generation - runs at the same time for all users
  setInterval(async () => {
    try {
      // Get all users
      const users = await User.find({ dailyReportEnabled: true });

      // Generate and email report for each user
      for (const user of users) {
        await generateUserReport(user);
        await emailService.sendReport(user.email, 'Daily Report');
      }
    } catch (error) {
      console.error('Error in daily report job:', error);
    }
  }, 24 * 60 * 60 * 1000); // Run every 24 hours

  // Hourly data sync - might overlap with other intensive tasks
  setInterval(async () => {
    try {
      await syncExternalData();
    } catch (error) {
      console.error('Error in data sync job:', error);
    }
  }, 60 * 60 * 1000); // Run every hour
}

setupScheduledTasks();
```

This approach:
- Doesn't handle distributed environments (job runs on every instance)
- Has no error recovery for failed jobs
- Processes all tasks at once, creating load spikes
- Uses imprecise timing (intervals drift over time)
- Doesn't account for task duration (can overlap)
- No logging or monitoring of job execution

### Solution: Distributed Scheduled Jobs with Cron

Use a proper scheduling library with distributed locking:

```javascript
// Optimized: Using agenda for scheduled tasks
const Agenda = require('agenda');
const mongoose = require('mongoose');

// Create agenda instance
const agenda = new Agenda({
  db: {
    address: process.env.MONGODB_URI,
    collection: 'scheduledJobs'
  },
  processEvery: '30 seconds',
  maxConcurrency: 20
});

// Define jobs
agenda.define('generate-daily-reports', { lockLifetime: 10 * 60 * 1000 }, async (job) => {
  const { batchSize = 100 } = job.attrs.data || {};

  try {
    // Find users that need reports, using pagination
    const query = { dailyReportEnabled: true };
    const totalUsers = await User.countDocuments(query);

    // Process in batches to avoid memory issues
    for (let skip = 0; skip < totalUsers; skip += batchSize) {
      const users = await User.find(query)
        .skip(skip)
        .limit(batchSize);

      // Process each user in the batch
      for (const user of users) {
        try {
          // Each report is its own queued job
          await agenda.now('email-single-report', {
            userId: user._id,
            reportType: 'daily'
          });
        } catch (userError) {
          // Log individual user errors but continue with batch
          console.error(`Error scheduling report for user ${user._id}:`, userError);
        }
      }

      // Allow other jobs to run between batches
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } catch (error) {
    console.error('Error in generate-daily-reports job:', error);
    throw error; // Let agenda handle the retry
  }
});

// Individual report job - can be retried independently
agenda.define('email-single-report', { priority: 'high' }, async (job) => {
  const { userId, reportType } = job.attrs.data;

  try {
    const user = await User.findById(userId);
    if (!user) {
      job.fail(`User ${userId} not found`);
      return;
    }

    // Generate the report
    const report = await generateUserReport(user, reportType);

    // Send the email
    await emailService.sendReport(user.email, `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`, report);

    // Update last report date
    user.lastReportSent = new Date();
    await user.save();
  } catch (error) {
    console.error(`Error in email-single-report job for user ${userId}:`, error);
    throw error; // Will be retried
  }
});

// Data sync job with distributed lock
agenda.define('sync-external-data', { lockLifetime: 50 * 60 * 1000 }, async (job) => {
  const lock = await mongoose.connection.db.collection('locks').findOneAndUpdate(
    { _id: 'data-sync-lock' },
    { $set: { lockedAt: new Date() } },
    { upsert: true, returnDocument: 'after' }
  );

  try {
    // Check last sync time and determine what needs updating
    const lastSync = job.attrs.lastRunAt || new Date(0);
    await syncExternalData(lastSync);
  } catch (error) {
    console.error('Error in sync-external-data job:', error);
    throw error;
  } finally {
    // Release lock
    await mongoose.connection.db.collection('locks').updateOne(
      { _id: 'data-sync-lock' },
      { $set: { lockedAt: null } }
    );
  }
});

// Schedule jobs
async function startScheduler() {
  // Wait for agenda to connect
  await new Promise(resolve => agenda.once('ready', resolve));

  // Daily reports at 7 AM
  agenda.every('0 7 * * *', 'generate-daily-reports', {
    timezone: 'UTC',
    // Distributed work across server instances
    // Different servers handle different user segments
    data: {
      batchSize: 100,
      serverIdentifier: process.env.SERVER_ID || 'default'
    }
  });

  // Hourly data sync but with slight randomization to prevent thundering herd
  const randomMinute = Math.floor(Math.random() * 10); // 0-9 minutes
  agenda.every(`${randomMinute} * * * *`, 'sync-external-data');

  // Schedule cleanup job to remove old completed jobs
  agenda.every('0 0 * * *', 'clean-up-old-jobs');

  // Define cleanup job
  agenda.define('clean-up-old-jobs', async () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    await agenda.cancel({
      nextRunAt: { $lt: oneWeekAgo },
      lastFinishedAt: { $exists: true }
    });
  });

  // Start agenda
  await agenda.start();

  console.log('Job scheduler started');
}

// Graceful shutdown
async function shutdown() {
  await agenda.stop();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start the scheduler
startScheduler().catch(console.error);
```

This implementation:
- Uses proper cron syntax for precise timing
- Prevents duplicate job execution across server instances
- Processes tasks in batches to avoid memory issues
- Provides job-specific error handling and retries
- Implements graceful shutdown
- Includes job history and cleanup
- Distributes load by randomizing start times
- Has built-in locking mechanisms
- Scales horizontally with workload

## Monitoring and Alerting for Background Jobs

```javascript
// Add monitoring to background jobs
agenda.on('start', job => {
  console.log(`Job ${job.attrs.name} starting`);

  // Update metrics
  metrics.increment(`job.${job.attrs.name}.started`);

  // Record job start time for duration calculation
  job.attrs.data = job.attrs.data || {};
  job.attrs.data.startedAt = new Date();
});

agenda.on('complete', job => {
  const duration = new Date() - new Date(job.attrs.data.startedAt);
  console.log(`Job ${job.attrs.name} completed in ${duration}ms`);

  // Update metrics
  metrics.increment(`job.${job.attrs.name}.completed`);
  metrics.timing(`job.${job.attrs.name}.duration`, duration);

  // Alert on long-running jobs
  if (duration > 30000) { // 30 seconds
    alerts.send(`Job ${job.attrs.name} ran for ${duration}ms`, 'warning');
  }
});

agenda.on('fail', (err, job) => {
  console.error(`Job ${job.attrs.name} failed:`, err);

  // Update metrics
  metrics.increment(`job.${job.attrs.name}.failed`);

  // Send alert for failed jobs
  alerts.send(`Job ${job.attrs.name} failed: ${err.message}`, 'error');

  // Log detailed error information
  logger.error({
    job: job.attrs.name,
    data: job.attrs.data,
    error: err.stack
  });
});
```

## Performance Tips for Background Processing

1. **Use dedicated job queues** - Process heavy tasks asynchronously
2. **Implement priority queues** - Handle critical jobs first
3. **Batch similar operations** - Group related tasks for efficiency
4. **Use worker pools** - Distribute CPU-intensive tasks across cores
5. **Implement job concurrency limits** - Prevent resource exhaustion
6. **Add circuit breakers** - Fail fast when dependencies are down
7. **Implement graceful shutdown** - Handle in-progress jobs during restart
8. **Set reasonable timeouts** - Prevent jobs from running indefinitely
9. **Monitor queue depths** - Alert on growing backlogs
10. **Implement distributed locks** - Prevent duplicate job execution

---

**Navigation**
- [⬅️ Back to Backend Systems](./README.md)
- [➡️ Next: Server Scaling Patterns](./server-scaling-patterns.md)