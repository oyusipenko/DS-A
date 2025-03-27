# Data Modeling Choices

**Navigation:** [🏠 Home](../../README.md) > [🌐 Web Development Applications](../README.md) > [🗃️ Database Operations](./README.md) > Data Modeling

## Understanding Data Modeling

Data modeling is the process of creating a conceptual representation of data structures and the relationships between them. The way data is modeled significantly impacts application performance, maintainability, and scalability.

## Normalization vs. Denormalization

### Normalization Principles

Normalization is the process of organizing data to minimize redundancy and dependency by dividing larger tables into smaller ones and defining relationships between them.

**Example of a Normalized Schema:**

```sql
-- User table
CREATE TABLE users (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  created_at TIMESTAMP
);

-- Address table (one-to-many relationship with users)
CREATE TABLE addresses (
  id INT PRIMARY KEY,
  user_id INT,
  type VARCHAR(20), -- 'home', 'work', etc.
  street VARCHAR(100),
  city VARCHAR(100),
  state VARCHAR(50),
  country VARCHAR(50),
  postal_code VARCHAR(20),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Order table
CREATE TABLE orders (
  id INT PRIMARY KEY,
  user_id INT,
  order_date TIMESTAMP,
  status VARCHAR(20),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- OrderItem table (one-to-many relationship with orders)
CREATE TABLE order_items (
  id INT PRIMARY KEY,
  order_id INT,
  product_id INT,
  quantity INT,
  price DECIMAL(10, 2),
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Product table
CREATE TABLE products (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  description TEXT,
  category_id INT,
  price DECIMAL(10, 2),
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Category table
CREATE TABLE categories (
  id INT PRIMARY KEY,
  name VARCHAR(50),
  parent_id INT,
  FOREIGN KEY (parent_id) REFERENCES categories(id)
);
```

**Benefits of Normalization:**
- Reduces data redundancy
- Minimizes update anomalies
- Smaller, more focused tables
- Better data integrity
- More flexible query capabilities

**Drawbacks of Normalization:**
- Requires joins for many queries
- More complex queries
- Can lead to performance issues for read-heavy operations

### Denormalization Strategies

Denormalization intentionally introduces redundancy to improve read performance by reducing the need for joins.

**Example of a Denormalized Schema:**

```sql
-- Denormalized order table that includes user and product information
CREATE TABLE orders_denormalized (
  id INT PRIMARY KEY,
  order_date TIMESTAMP,
  status VARCHAR(20),

  -- User information (denormalized)
  user_id INT,
  user_name VARCHAR(100),
  user_email VARCHAR(100),

  -- Embedded order items as JSON
  items JSON,

  -- Pre-calculated order totals
  item_count INT,
  total_amount DECIMAL(10, 2)
);

-- Example of the JSON items field:
/*
{
  "items": [
    {
      "product_id": 123,
      "product_name": "Smartphone",
      "quantity": 1,
      "price": 699.99,
      "category": "Electronics"
    },
    {
      "product_id": 456,
      "product_name": "Phone Case",
      "quantity": 2,
      "price": 24.99,
      "category": "Accessories"
    }
  ]
}
*/
```

**Benefits of Denormalization:**
- Faster reads with fewer joins
- Simpler queries for common operations
- Can improve performance for reporting
- Potentially fewer indexes needed

**Drawbacks of Denormalization:**
- Data redundancy
- More complex updates
- Increased storage requirements
- Potential for inconsistent data
- More difficult to change the schema

## When to Choose Each Approach

### Favor Normalization When:

- Data integrity is critical
- Update operations are frequent
- Storage space is a concern
- The application has diverse query patterns
- The schema is expected to change frequently

### Favor Denormalization When:

- Read performance is the top priority
- Queries frequently join the same tables
- The data model is relatively stable
- The application is read-heavy
- You're working with document databases like MongoDB
- You're building analytical or reporting systems

## SQL vs. NoSQL Data Modeling

### Relational (SQL) Data Modeling

Relational databases are structured around normalized tables with relationships:

```sql
-- Example of relational modeling for a blogging platform
CREATE TABLE authors (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  bio TEXT
);

CREATE TABLE posts (
  id INT PRIMARY KEY,
  title VARCHAR(200),
  content TEXT,
  author_id INT,
  published_at TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES authors(id)
);

CREATE TABLE comments (
  id INT PRIMARY KEY,
  post_id INT,
  user_id INT,
  content TEXT,
  created_at TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE tags (
  id INT PRIMARY KEY,
  name VARCHAR(50) UNIQUE
);

CREATE TABLE post_tags (
  post_id INT,
  tag_id INT,
  PRIMARY KEY (post_id, tag_id),
  FOREIGN KEY (post_id) REFERENCES posts(id),
  FOREIGN KEY (tag_id) REFERENCES tags(id)
);
```

**Key characteristics:**
- Structured schema with tables, columns, and constraints
- Relationships enforced through foreign keys
- ACID transactions
- Complex queries with joins and aggregations
- Schema changes can be challenging

### Document-Based (NoSQL) Data Modeling

Document databases like MongoDB store data in flexible, JSON-like documents:

```javascript
// Authors collection
{
  _id: ObjectId("5f8a7b..."),
  name: "Jane Smith",
  bio: "Award-winning author and technology journalist",
  social_media: {
    twitter: "@janesmith",
    instagram: "jane.writes"
  }
}

// Posts collection with embedded comments
{
  _id: ObjectId("5f8b2c..."),
  title: "Understanding NoSQL Data Modeling",
  content: "NoSQL databases provide flexibility in how you structure your data...",
  author_id: ObjectId("5f8a7b..."),
  published_at: ISODate("2023-03-15T14:30:00Z"),
  tags: ["database", "nosql", "mongodb"],

  // Embedded comments
  comments: [
    {
      user_id: ObjectId("6a1c3d..."),
      user_name: "Bob Johnson",
      content: "Great article! I especially liked the comparison with SQL.",
      created_at: ISODate("2023-03-15T15:42:00Z")
    },
    {
      user_id: ObjectId("7b2d4e..."),
      user_name: "Alice Williams",
      content: "Could you explain more about indexing in NoSQL?",
      created_at: ISODate("2023-03-15T16:05:00Z")
    }
  ],

  // Pre-calculated stats
  comment_count: 2,
  view_count: 1542
}
```

**Key characteristics:**
- Flexible schema with nested/embedded documents
- No formal relationships (references instead of foreign keys)
- Typically sacrifices ACID for performance and scalability
- Designed for horizontal scaling
- Can embed related data to avoid joins
- Schema evolution is simpler

## Data Modeling Patterns

### One-to-Many Relationships

#### SQL Approach:
```sql
-- Parent table
CREATE TABLE departments (
  id INT PRIMARY KEY,
  name VARCHAR(100)
);

-- Child table with foreign key
CREATE TABLE employees (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  department_id INT,
  FOREIGN KEY (department_id) REFERENCES departments(id)
);
```

#### NoSQL Approach:
```javascript
// Option 1: Embedding (when the "many" side is small and bounded)
{
  _id: ObjectId("..."),
  name: "Engineering",
  employees: [
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" }
  ]
}

// Option 2: References (when the "many" side is large or unbounded)
// Departments
{
  _id: ObjectId("dept1"),
  name: "Engineering"
}

// Employees (with reference to parent)
{
  _id: ObjectId("emp1"),
  name: "Alice",
  department_id: ObjectId("dept1")
}
```

### Many-to-Many Relationships

#### SQL Approach:
```sql
CREATE TABLE students (
  id INT PRIMARY KEY,
  name VARCHAR(100)
);

CREATE TABLE courses (
  id INT PRIMARY KEY,
  name VARCHAR(100)
);

-- Junction table
CREATE TABLE enrollments (
  student_id INT,
  course_id INT,
  enrollment_date DATE,
  PRIMARY KEY (student_id, course_id),
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (course_id) REFERENCES courses(id)
);
```

#### NoSQL Approach:
```javascript
// Option 1: References in both collections
// Students
{
  _id: ObjectId("student1"),
  name: "Alice",
  course_ids: [ObjectId("course1"), ObjectId("course2")]
}

// Courses
{
  _id: ObjectId("course1"),
  name: "Database Design",
  student_ids: [ObjectId("student1"), ObjectId("student3")]
}

// Option 2: Junction collection (for complex relationships)
// Enrollments
{
  _id: ObjectId("..."),
  student_id: ObjectId("student1"),
  course_id: ObjectId("course1"),
  enrollment_date: ISODate("2023-09-01"),
  grade: "A"
}
```

## Time-Series Data Modeling

Time-series data requires special consideration due to its volume and access patterns:

### SQL Approach:
```sql
-- Single table with partitioning
CREATE TABLE sensor_readings (
  sensor_id INT,
  timestamp TIMESTAMP,
  value FLOAT,
  PRIMARY KEY (sensor_id, timestamp)
) PARTITION BY RANGE (timestamp);

-- Create monthly partitions
CREATE TABLE sensor_readings_202301 PARTITION OF sensor_readings
FOR VALUES FROM ('2023-01-01') TO ('2023-02-01');

CREATE TABLE sensor_readings_202302 PARTITION OF sensor_readings
FOR VALUES FROM ('2023-02-01') TO ('2023-03-01');
```

### NoSQL Approach:
```javascript
// Using a timestamp-based document structure
{
  sensor_id: "sensor123",
  date: "2023-01-15",  // Used for partitioning
  readings: [
    { ts: ISODate("2023-01-15T00:00:00Z"), value: 22.5 },
    { ts: ISODate("2023-01-15T00:05:00Z"), value: 22.7 },
    { ts: ISODate("2023-01-15T00:10:00Z"), value: 22.8 }
  ]
}
```

## Performance Trade-offs in Data Modeling

| Approach | Read Performance | Write Performance | Storage Efficiency | Query Flexibility | Data Integrity |
|----------|------------------|-------------------|-------------------|------------------|----------------|
| Highly Normalized | Slower (many joins) | Faster (less redundancy) | Excellent | High | Excellent |
| Moderately Normalized | Balanced | Balanced | Good | Good | Good |
| Denormalized | Faster (fewer joins) | Slower (more redundancy) | Poor | Limited | Risk of inconsistency |
| Document Embedding | Very fast for related data | Fast for inserts, slow for updates | Depends | Good for embedded data | Manual enforcement |
| Sharded/Partitioned | Very fast for partition key | Depends on shard key | Good | Limited by partition key | Depends on implementation |

## Performance Tips for Data Modeling

1. **Understand access patterns** - Model data around how it will be accessed
2. **Start normalized** - Denormalize selectively based on performance needs
3. **Consider read/write ratio** - Higher read frequency may justify denormalization
4. **Use appropriate data types** - Choose the most efficient type for each column
5. **Design for scalability** - Consider future growth in your data model
6. **Monitor and refine** - Adjust your model based on actual usage patterns
7. **Use appropriate databases** - Some workloads fit relational databases, others fit NoSQL
8. **Consider caching** - In-memory caches can offset modeling trade-offs
9. **Test with realistic data volumes** - Small test datasets often hide performance issues
10. **Use database features** - Partitioning, materialized views, and other features can help

---

**Navigation**
- [⬅️ Previous: Join Operations](./join-operations.md)
- [⬆️ Up to Database Operations](./README.md)
- [➡️ Next: Transaction Management](./transaction-management.md)