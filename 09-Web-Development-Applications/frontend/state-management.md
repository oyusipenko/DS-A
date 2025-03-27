# State Management Optimization

**Navigation:** [🏠 Home](../../README.md) > [🌐 Web Development Applications](../README.md) > [💻 Frontend Performance](./README.md) > State Management

## Efficient State Updates

### Problem: Deep Nested Updates

Updating deeply nested state in an immutable way can lead to inefficient code and poor performance:

```javascript
// Inefficient: Manual deep cloning with spread operators
function updateNestedState(state, userId, newEmail) {
  return {
    ...state,
    users: {
      ...state.users,
      [userId]: {
        ...state.users[userId],
        contact: {
          ...state.users[userId].contact,
          email: newEmail
        }
      }
    }
  };
}

// Usage
const newState = updateNestedState(state, 'user123', 'newemail@example.com');
```

This approach:
- Creates multiple intermediate objects that are immediately discarded
- Has O(depth) complexity, where depth is the nesting level
- Becomes verbose and error-prone as nesting increases

### Solution: Immutability Helpers

Use specialized libraries designed for immutable updates:

```javascript
// Using Immer for simpler immutable updates
import produce from 'immer';

function updateNestedState(state, userId, newEmail) {
  return produce(state, draft => {
    draft.users[userId].contact.email = newEmail;
  });
}

// Usage
const newState = updateNestedState(state, 'user123', 'newemail@example.com');
```

This approach:
- Provides a mutable API but produces immutable results
- Only clones objects on the path that needs updating (structural sharing)
- Has significantly better performance for deep updates

## State Normalization

### Problem: Redundant and Nested Data

Nested data structures lead to redundancy and inefficient updates:

```javascript
// Inefficient: Nested state structure
const state = {
  posts: [
    {
      id: 'post1',
      title: 'First Post',
      author: {
        id: 'user1',
        name: 'Alice',
        avatar: 'alice.jpg'
      },
      comments: [
        {
          id: 'comment1',
          text: 'Great post!',
          author: {
            id: 'user2',
            name: 'Bob',
            avatar: 'bob.jpg'
          }
        },
        // More comments...
      ]
    },
    // More posts...
  ]
};

// Updating a user is problematic:
// 1. Need to find all places where user data appears
// 2. Create new objects at each level of nesting
// 3. Time complexity: O(posts × comments)
```

### Solution: Normalized State Shape

Normalize data to avoid nesting and redundancy:

```javascript
// Efficient: Normalized state structure
const normalizedState = {
  users: {
    'user1': { id: 'user1', name: 'Alice', avatar: 'alice.jpg' },
    'user2': { id: 'user2', name: 'Bob', avatar: 'bob.jpg' }
  },
  posts: {
    'post1': {
      id: 'post1',
      title: 'First Post',
      authorId: 'user1',
      commentIds: ['comment1', 'comment2']
    }
  },
  comments: {
    'comment1': {
      id: 'comment1',
      text: 'Great post!',
      authorId: 'user2'
    }
  }
};

// Updating a user is now simple:
// 1. Update once in users dictionary
// 2. O(1) complexity for the update
// 3. No redundant data to maintain
```

## State Selector Optimization

### Problem: Expensive Derived State

Calculating derived state within render methods leads to repeated calculations:

```javascript
// Inefficient: Recalculating on every render
function Dashboard({ tasks }) {
  // O(n) calculations performed on every render
  const completedTasks = tasks.filter(task => task.completed);
  const importantTasks = tasks.filter(task => task.priority === 'high');
  const completionRate = tasks.length > 0
    ? (completedTasks.length / tasks.length) * 100
    : 0;

  return (
    <div>
      <TaskSummary
        total={tasks.length}
        completed={completedTasks.length}
        important={importantTasks.length}
        completionRate={completionRate}
      />
      <TaskList tasks={tasks} />
    </div>
  );
}
```

### Solution: Memoized Selectors

Use memoized selector functions to compute derived state only when inputs change:

```javascript
// Using Reselect for efficient memoization
import { createSelector } from 'reselect';

// Selectors that only recalculate when tasks change
const selectTasks = state => state.tasks;

const selectCompletedTasks = createSelector(
  [selectTasks],
  (tasks) => tasks.filter(task => task.completed)
);

const selectImportantTasks = createSelector(
  [selectTasks],
  (tasks) => tasks.filter(task => task.priority === 'high')
);

const selectCompletionRate = createSelector(
  [selectTasks, selectCompletedTasks],
  (tasks, completedTasks) => tasks.length > 0
    ? (completedTasks.length / tasks.length) * 100
    : 0
);

// Component using selectors
function Dashboard({ tasks, completedTasks, importantTasks, completionRate }) {
  return (
    <div>
      <TaskSummary
        total={tasks.length}
        completed={completedTasks.length}
        important={importantTasks.length}
        completionRate={completionRate}
      />
      <TaskList tasks={tasks} />
    </div>
  );
}

// Connect component with Redux (example)
const mapStateToProps = (state) => ({
  tasks: selectTasks(state),
  completedTasks: selectCompletedTasks(state),
  importantTasks: selectImportantTasks(state),
  completionRate: selectCompletionRate(state)
});
```

## Global State Management Performance

### Problem: Excessive Re-renders

When using a global state store, changes to any part of the state can trigger re-renders throughout the component tree:

```javascript
// Inefficient: All components re-render when any state changes
function App() {
  const state = useContext(AppContext);
  // This component re-renders whenever ANY part of state changes

  return (
    <>
      <Header user={state.user} />
      <Sidebar categories={state.categories} />
      <MainContent posts={state.posts} />
      <Footer />
    </>
  );
}
```

### Solution: State Slicing and Selective Subscription

Split state into smaller contexts or use selective subscription:

```javascript
// Context splitting approach
const UserContext = React.createContext();
const CategoriesContext = React.createContext();
const PostsContext = React.createContext();

function App() {
  const { user, categories, posts } = useGlobalState();

  return (
    <UserContext.Provider value={user}>
      <CategoriesContext.Provider value={categories}>
        <PostsContext.Provider value={posts}>
          <AppLayout />
        </PostsContext.Provider>
      </CategoriesContext.Provider>
    </UserContext.Provider>
  );
}

// Components only subscribe to what they need
function Header() {
  // Only re-renders when user changes
  const user = useContext(UserContext);
  return <header>{user.name}</header>;
}

function Sidebar() {
  // Only re-renders when categories change
  const categories = useContext(CategoriesContext);
  return <nav>{/* render categories */}</nav>;
}
```

```javascript
// Redux selective subscription example
function UserProfile() {
  // Only subscribes to user slice of state
  const user = useSelector(state => state.user);

  // This component only re-renders when user state changes
  return <div>{user.name}</div>;
}
```

## Performance Comparison of State Management Solutions

| Approach | Update Performance | Memory Usage | Re-render Efficiency | Best For |
|----------|-------------------|-------------|----------------------|----------|
| React useState | O(1) for shallow state | Low | Re-renders only component | Component-local state |
| React useReducer | O(1) for shallow, O(depth) for nested | Low | Re-renders only component | Complex component state |
| React Context | O(1) for shallow | Medium | Re-renders all consumers | UI themes, user data |
| Redux | O(1) with selectors | Medium-High | Component-specific with useSelector | App-wide state |
| MobX | O(1) with observables | Medium | Only affected components | Complex derived data |
| Recoil | O(1) with atoms | Medium | Atomic updates, minimal re-renders | Fine-grained state |

## Performance Tips for State Management

1. **Normalize state** - Flatten nested objects and avoid redundancy
2. **Use immutability helpers** - Libraries like Immer make immutable updates more efficient
3. **Implement memoized selectors** - Compute derived data only when inputs change
4. **Create granular contexts** - Split state into smaller, more focused contexts
5. **Use component composition** - Pass only needed props instead of entire state objects
6. **Profile before optimizing** - Measure performance to identify actual bottlenecks

---

**Navigation**
- [⬅️ Back to Frontend Performance](./README.md)
- [➡️ Next: DOM Manipulation](./dom-manipulation.md)