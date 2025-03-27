# Transaction Management

**Navigation:** [🏠 Home](../../README.md) > [🌐 Web Development Applications](../README.md) > [🗃️ Database Operations](./README.md) > Transaction Management

## Understanding Database Transactions

Transactions are units of work that must be executed atomically and in isolation from each other. They ensure data consistency and integrity in multi-user database environments.

### ACID Properties

Database transactions should guarantee the following properties:

- **Atomicity**: All operations in a transaction complete successfully, or none do
- **Consistency**: A transaction brings the database from one valid state to another
- **Isolation**: Concurrent transactions execute as if they were sequential
- **Durability**: Once committed, transaction effects persist even during system failures

## Transaction Isolation Levels

Isolation levels control how transactions interact with each other, trading off consistency for performance.

### Read Uncommitted

The lowest isolation level, allowing transactions to read uncommitted changes:

```sql
-- Setting isolation level in SQL Server
SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;

-- Example transaction
BEGIN TRANSACTION;
SELECT * FROM products WHERE id = 123; -- Can see uncommitted changes
COMMIT;
```

**Problems:**
- **Dirty Reads**: Reading uncommitted data that might be rolled back
- **Non-repeatable Reads**: Re-reading the same data yields different results
- **Phantom Reads**: Re-executing the same query returns different rows

**Performance:**
- Best performance
- Lowest consistency guarantees
- Suitable for read-only reporting queries where approximate values are acceptable

### Read Committed

The default in many databases, prevents dirty reads:

```sql
-- Setting isolation level in PostgreSQL
BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;

-- Example transaction
SELECT * FROM accounts WHERE user_id = 456; -- Only sees committed data
UPDATE accounts SET balance = balance - 100 WHERE id = 789;
COMMIT;
```

**Problems:**
- **Non-repeatable Reads**: Still possible
- **Phantom Reads**: Still possible

**Performance:**
- Good performance
- Moderate consistency guarantees
- Suitable for most OLTP applications

### Repeatable Read

Prevents non-repeatable reads, ensuring that data read during a transaction won't change:

```sql
-- Setting isolation level in MySQL
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;

BEGIN;
-- First read
SELECT * FROM inventory WHERE product_id = 101; -- Returns 10 units

-- Someone else updates the row and commits

-- Second read - same transaction
SELECT * FROM inventory WHERE product_id = 101; -- Still returns 10 units
COMMIT;
```

**Problems:**
- **Phantom Reads**: May still occur depending on implementation

**Performance:**
- Moderate to lower performance
- Higher consistency guarantees
- Suitable when consistent reads are critical

### Serializable

The strictest isolation level, preventing all concurrency anomalies:

```sql
-- Setting isolation level in Oracle
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;

BEGIN;
-- All row reads are consistent
SELECT * FROM products WHERE category = 'electronics';

-- No new rows matching this condition can be inserted by other transactions

-- Update based on calculation
UPDATE inventory
SET stock = stock - 5
WHERE product_id IN (SELECT id FROM products WHERE category = 'electronics');
COMMIT;
```

**Performance:**
- Lowest performance
- Highest consistency guarantees
- Risk of deadlocks and timeouts
- Suitable for financial transactions or critical data integrity operations

## Locking Mechanisms

Databases use locks to control concurrent access to data.

### Shared (Read) Locks

Multiple transactions can hold shared locks on the same data:

```sql
-- Explicit shared lock in SQL Server
SELECT * FROM orders WITH (HOLDLOCK)
WHERE customer_id = 123;
```

**Characteristics:**
- Allow concurrent reads
- Block exclusive locks
- Minimal impact on concurrency

### Exclusive (Write) Locks

Only one transaction can hold an exclusive lock:

```sql
-- Exclusive lock happens automatically with updates
UPDATE products SET stock = stock - 1 WHERE id = 456;

-- Explicit exclusive lock in PostgreSQL
SELECT * FROM inventory WHERE product_id = 789 FOR UPDATE;
```

**Characteristics:**
- Block both shared and exclusive locks
- Reduce concurrency
- Necessary for data modifications

### Row-Level vs. Table-Level Locks

```sql
-- Row-level lock (more concurrent)
UPDATE accounts SET balance = balance - 100 WHERE id = 123;

-- Table-level lock (less concurrent)
LOCK TABLE accounts IN EXCLUSIVE MODE;
UPDATE accounts SET interest_rate = 2.5;
```

**Trade-offs:**
- Row-level: Higher concurrency, more overhead
- Table-level: Lower concurrency, less overhead

## Optimistic vs. Pessimistic Concurrency Control

### Pessimistic Concurrency Control

Assumes conflicts will occur and locks data preemptively:

```sql
-- Pessimistic locking example
BEGIN TRANSACTION;
SELECT * FROM inventory WHERE product_id = 101 FOR UPDATE;
-- No other transaction can update this row until committed
UPDATE inventory SET quantity = quantity - 1 WHERE product_id = 101;
COMMIT;
```

**Characteristics:**
- Prevents conflicts before they happen
- Can lead to deadlocks
- Reduces concurrency
- Better for high-contention environments

### Optimistic Concurrency Control

Assumes conflicts are rare and checks for changes at commit time:

```sql
-- Optimistic locking using version number
BEGIN;
SELECT id, price, version FROM products WHERE id = 123;
-- No locks acquired

-- Later in the transaction
UPDATE products
SET price = 49.99, version = version + 1
WHERE id = 123 AND version = 5;

-- If row was modified by another transaction, 0 rows will be affected
IF @@ROWCOUNT = 0 THEN
    ROLLBACK;
    -- Handle conflict
ELSE
    COMMIT;
END IF;
```

**Characteristics:**
- Better concurrency
- No deadlocks
- May require conflict resolution
- Better for low-contention environments

## Common Transaction Patterns

### Read-Modify-Write Pattern

One of the most common transaction patterns:

```sql
BEGIN TRANSACTION;
-- Read current value
SELECT @current_balance = balance FROM accounts WHERE id = 123;

-- Modify value
SET @new_balance = @current_balance - 100;

-- Write back
UPDATE accounts SET balance = @new_balance WHERE id = 123;

-- Commit or rollback based on business rules
IF @new_balance >= 0 THEN
    COMMIT;
ELSE
    ROLLBACK;
END IF;
```

**Potential issues:**
- Race conditions with concurrent transactions
- Lost updates if not properly isolated

### Two-Phase Commit for Distributed Transactions

Coordinates transactions across multiple systems:

```
Phase 1: Prepare
- Coordinator asks each participant if they can commit
- Each participant replies YES or NO

Phase 2: Commit/Abort
- If all participants replied YES, coordinator tells all to commit
- If any participant replied NO, coordinator tells all to abort
```

**Implementation example (pseudo-code):**
```javascript
// Transaction coordinator
async function performDistributedTransaction() {
  const participants = [databaseA, databaseB, messageQueue];

  // Phase 1: Prepare
  try {
    for (const participant of participants) {
      const prepared = await participant.prepare();
      if (!prepared) {
        // Abort the transaction if any participant cannot prepare
        for (const p of participants) {
          await p.abort();
        }
        return false;
      }
    }

    // Phase 2: Commit
    for (const participant of participants) {
      await participant.commit();
    }
    return true;
  } catch (error) {
    // On error, abort all
    for (const participant of participants) {
      try {
        await participant.abort();
      } catch (abortError) {
        // Log abort errors but continue aborting others
        console.error('Error during abort:', abortError);
      }
    }
    return false;
  }
}
```

**Characteristics:**
- Ensures consistency across distributed systems
- Higher latency due to multiple network roundtrips
- Susceptible to coordinator failure
- Higher complexity

## Deadlock Prevention and Resolution

### Deadlock Example

```
Transaction A:
1. Update accounts set balance = balance - 100 where id = 1; -- Locks row 1
2. Update accounts set balance = balance + 100 where id = 2; -- Waits for lock on row 2

Transaction B (concurrent):
1. Update accounts set balance = balance - 100 where id = 2; -- Locks row 2
2. Update accounts set balance = balance + 100 where id = 1; -- Waits for lock on row 1

Result: Deadlock - each transaction is waiting for a resource held by the other
```

### Deadlock Prevention Strategies

**1. Resource Ordering:**

```sql
-- Always access resources in the same order
BEGIN TRANSACTION;
-- First update account with lower ID
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
-- Then update account with higher ID
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;
```

**2. Timeouts:**

```sql
-- Set transaction timeout
SET LOCK_TIMEOUT 5000; -- 5 seconds in SQL Server

BEGIN TRANSACTION;
-- If lock cannot be acquired within timeout, transaction will fail
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;
```

**3. Lock All Resources Upfront:**

```sql
BEGIN TRANSACTION;
-- Lock all resources at once
SELECT * FROM accounts WHERE id IN (1, 2) FOR UPDATE;

-- Now proceed with updates
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;
```

### Deadlock Detection and Resolution

Most databases automatically detect and resolve deadlocks:

```sql
-- PostgreSQL deadlock_timeout configuration
SET deadlock_timeout = '1s';
```

When a deadlock is detected, the database typically:
1. Chooses a victim transaction (often the one with the least work done)
2. Rolls back the victim transaction
3. Returns an error to the application
4. The application should be prepared to retry the transaction

## Batch Processing for Performance

### Problem: Multiple Individual Transactions

Processing records one at a time creates excessive transaction overhead:

```sql
-- Inefficient: One transaction per record
FOR record IN (SELECT * FROM pending_orders)
LOOP
    BEGIN TRANSACTION;
    INSERT INTO processed_orders (order_id, status, processed_at)
    VALUES (record.id, 'completed', NOW());

    DELETE FROM pending_orders WHERE id = record.id;
    COMMIT;
END LOOP;
```

### Solution: Batch Processing

```sql
-- Efficient: Process multiple records in a single transaction
BEGIN TRANSACTION;

INSERT INTO processed_orders (order_id, status, processed_at)
SELECT id, 'completed', NOW()
FROM pending_orders
WHERE status = 'pending'
LIMIT 1000;

DELETE FROM pending_orders
WHERE id IN (
    SELECT id FROM pending_orders
    WHERE status = 'pending'
    LIMIT 1000
);

COMMIT;
```

**Performance improvement:**
- Reduced transaction overhead
- Fewer log entries
- Better throughput
- Lower contention

## Performance Tips for Transaction Management

1. **Use appropriate isolation levels** - Choose the least restrictive level that meets requirements
2. **Keep transactions short** - Long-running transactions increase contention
3. **Avoid user input during transactions** - Never wait for user decisions within a transaction
4. **Consider transaction batching** - Group related operations for better performance
5. **Be prepared for deadlocks** - Implement retry logic for deadlock scenarios
6. **Monitor lock contention** - Identify and optimize high-contention queries
7. **Consider optimistic concurrency** - For low-contention scenarios
8. **Properly handle exceptions** - Ensure transactions are rolled back on errors
9. **Use connection pooling** - Reuse database connections to reduce overhead
10. **Set appropriate timeouts** - Prevent transactions from hanging indefinitely

---

**Navigation**
- [⬅️ Previous: Data Modeling](./data-modeling.md)
- [⬆️ Up to Database Operations](./README.md)