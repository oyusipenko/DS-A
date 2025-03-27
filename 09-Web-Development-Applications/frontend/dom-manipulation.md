# DOM Manipulation Optimization

**Navigation:** [🏠 Home](../../README.md) > [🌐 Web Development Applications](../README.md) > [💻 Frontend Performance](./README.md) > DOM Manipulation

## Understanding Browser Rendering

### The Critical Rendering Path

Browser rendering involves several steps that can be expensive:

1. **DOM Construction**: Parsing HTML to build Document Object Model
2. **CSSOM Construction**: Parsing CSS to build CSS Object Model
3. **Render Tree Construction**: Combining DOM and CSSOM
4. **Layout**: Calculating positions and dimensions (reflow)
5. **Paint**: Filling in pixels (repaint)
6. **Compositing**: Layering elements together

Understanding this process is crucial for optimizing DOM manipulations.

## Minimizing Reflows and Repaints

### Problem: Frequent Layout Calculations

Multiple DOM manipulations that affect layout trigger expensive reflows:

```javascript
// Inefficient: Causes multiple reflows
function animateElement(element) {
  // Each of these property reads/writes forces a reflow
  element.style.width = (element.offsetWidth + 1) + 'px';
  element.style.height = (element.offsetHeight + 1) + 'px';
  element.style.left = (element.offsetLeft + 1) + 'px';
  element.style.top = (element.offsetTop + 1) + 'px';
}
```

### Solution: Batch DOM Reads and Writes

Separate read and write operations to reduce reflows:

```javascript
// Optimized: Read first, then write
function animateElement(element) {
  // Read phase (forces a single reflow)
  const width = element.offsetWidth;
  const height = element.offsetHeight;
  const left = element.offsetLeft;
  const top = element.offsetTop;

  // Write phase (batched by the browser into a single reflow)
  element.style.width = (width + 1) + 'px';
  element.style.height = (height + 1) + 'px';
  element.style.left = (left + 1) + 'px';
  element.style.top = (top + 1) + 'px';
}
```

For more complex animations, use requestAnimationFrame:

```javascript
// Even better: Use requestAnimationFrame for animations
function animateElement(element) {
  requestAnimationFrame(() => {
    // Read phase
    const width = element.offsetWidth;
    const height = element.offsetHeight;
    const left = element.offsetLeft;
    const top = element.offsetTop;

    // Write phase
    element.style.width = (width + 1) + 'px';
    element.style.height = (height + 1) + 'px';
    element.style.left = (left + 1) + 'px';
    element.style.top = (top + 1) + 'px';
  });
}
```

## Document Fragment for Batch Insertions

### Problem: Individual DOM Insertions

Adding multiple elements one by one forces multiple reflows:

```javascript
// Inefficient: Adding items individually (O(n) reflows)
function appendItems(container, items) {
  items.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    // Each append triggers reflow
    container.appendChild(li);
  });
}
```

### Solution: Document Fragments

Use DocumentFragment for batch operations:

```javascript
// Optimized: Using DocumentFragment (O(1) reflow)
function appendItems(container, items) {
  // Create a document fragment (in-memory container)
  const fragment = document.createDocumentFragment();

  // Build all elements in memory
  items.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    fragment.appendChild(li);
  });

  // Single DOM operation
  container.appendChild(fragment);
}
```

## Event Delegation

### Problem: Too Many Event Listeners

Attaching event listeners to many elements creates memory and performance overhead:

```javascript
// Inefficient: Individual event listeners (O(n) memory and setup time)
function setupItemClicks(items) {
  // Attaching an event listener to each item
  items.forEach(item => {
    item.addEventListener('click', (e) => {
      handleItemClick(item.dataset.id);
    });
  });
}
```

### Solution: Event Delegation

Use a single event listener with event bubbling:

```javascript
// Optimized: Event delegation (O(1) memory and setup time)
function setupItemClicks(container) {
  // Single event listener on the parent
  container.addEventListener('click', (e) => {
    // Find the closest matching element
    const item = e.target.closest('[data-id]');
    if (item) {
      handleItemClick(item.dataset.id);
    }
  });
}
```

Event delegation is especially valuable for dynamic lists where items are frequently added or removed.

## Virtualized Lists for Large Datasets

### Problem: Rendering All Items

Rendering large lists can freeze the UI:

```javascript
// Inefficient: Rendering all items at once
function renderList(container, items) {
  container.innerHTML = '';

  // This can freeze the UI for large lists
  items.forEach(item => {
    const element = document.createElement('div');
    element.className = 'item';
    // Complex item rendering
    element.innerHTML = `
      <div class="item-header">
        <h3>${item.title}</h3>
        <span class="date">${formatDate(item.date)}</span>
      </div>
      <div class="item-body">${item.description}</div>
      <div class="item-footer">
        <button>View Details</button>
        <div class="tags">${renderTags(item.tags)}</div>
      </div>
    `;
    container.appendChild(element);
  });
}
```

### Solution: Windowing Technique

Render only visible items:

```javascript
// Simplified virtual list implementation
class VirtualList {
  constructor(container, items, itemHeight) {
    this.container = container;
    this.items = items;
    this.itemHeight = itemHeight;

    this.visibleItems = Math.ceil(container.clientHeight / itemHeight) + 2; // +2 for buffer
    this.scrollPosition = 0;

    this.renderList();
    this.container.addEventListener('scroll', this.handleScroll.bind(this));
  }

  handleScroll() {
    const newPosition = Math.floor(this.container.scrollTop / this.itemHeight);
    if (newPosition !== this.scrollPosition) {
      this.scrollPosition = newPosition;
      this.renderList();
    }
  }

  renderList() {
    // Calculate visible range
    const startIndex = Math.max(0, this.scrollPosition - 1);
    const endIndex = Math.min(this.items.length, startIndex + this.visibleItems);

    // Update container height to accommodate all items
    const totalHeight = this.items.length * this.itemHeight;
    this.container.style.height = `${totalHeight}px`;

    // Clear existing items
    this.container.innerHTML = '';

    // Render only visible items
    for (let i = startIndex; i < endIndex; i++) {
      const item = this.items[i];
      const element = document.createElement('div');
      element.className = 'item';
      element.style.position = 'absolute';
      element.style.top = `${i * this.itemHeight}px`;
      element.style.height = `${this.itemHeight}px`;
      element.style.width = '100%';

      // Render item content
      element.textContent = item.title;

      this.container.appendChild(element);
    }
  }
}

// Usage
const virtualList = new VirtualList(
  document.getElementById('list-container'),
  largeDataArray,
  50 // Item height in pixels
);
```

For production use, consider libraries like `react-window` or `react-virtualized` which handle edge cases and optimizations.

## CSS Animation vs. JavaScript Animation

### Problem: JavaScript-Based Animations

Animations implemented in JavaScript can be inefficient:

```javascript
// Inefficient: JavaScript-based animation
function animateWidth(element, targetWidth, duration) {
  const startWidth = element.offsetWidth;
  const change = targetWidth - startWidth;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Calculate current width (linear easing)
    const currentWidth = startWidth + change * progress;

    // Update DOM - causes reflow
    element.style.width = `${currentWidth}px`;

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}
```

### Solution: CSS Transitions and Animations

Use CSS for animations where possible:

```javascript
// Optimized: CSS-based animation
function animateWidth(element, targetWidth) {
  // Add transition property if not already set
  element.style.transition = 'width 0.3s ease-out';

  // Set the target width - browser optimizes the animation
  element.style.width = `${targetWidth}px`;
}
```

CSS animations are typically more performant because:
1. They run on the compositor thread (not main thread)
2. The browser can optimize them for hardware acceleration
3. They don't require JavaScript execution for each frame

## Performance Tips for DOM Manipulation

1. **Minimize DOM access** - Cache references to DOM elements
2. **Batch DOM operations** - Use document fragments and update styles in batches
3. **Use event delegation** - Attach listeners to containers instead of individual elements
4. **Virtualize large lists** - Only render visible elements
5. **Prefer CSS animations** - They can run off the main thread
6. **Use transform and opacity** - These properties don't trigger layout
7. **Measure and test** - Use browser DevTools to profile performance

---

**Navigation**
- [⬅️ Back to Frontend Performance](./README.md)
- [➡️ Next: Client-Side Search](./client-side-search.md)