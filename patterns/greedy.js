/*
GREEDY ALGORITHMS PATTERN

Concept:
Greedy algorithms make locally optimal choices at each step with the hope of finding 
a global optimum. At each step, the algorithm chooses the best option available at that moment 
without considering the future consequences of that choice.

Characteristics:
1. Makes the best possible choice at each step
2. Never reconsiders previous choices
3. Simple and often efficient

Applications:
- Scheduling problems
- Huffman coding
- Minimum spanning trees (Kruskal's, Prim's)
- Shortest path (Dijkstra's for non-negative edges)
- Coin change problems
- Activity selection problems

Time Complexity: Usually O(n log n) due to sorting, or O(n) if sorting isn't needed
Space Complexity: Usually O(1) to O(n)

Example 1: Activity Selection Problem
*/

function activitySelection(start, finish) {
  // First sort activities by finish time
  const activities = start.map((s, i) => ({ start: s, finish: finish[i] }));
  activities.sort((a, b) => a.finish - b.finish);

  const selected = [0]; // Select first activity
  let lastFinishTime = activities[0].finish;

  // Consider rest of the activities
  for (let i = 1; i < activities.length; i++) {
    // If this activity starts after the finish time of previously selected activity
    if (activities[i].start >= lastFinishTime) {
      selected.push(i);
      lastFinishTime = activities[i].finish;
    }
  }

  return selected;
}

/*
Example 2: Fractional Knapsack
*/

function fractionalKnapsack(values, weights, capacity) {
  // Calculate value-to-weight ratio for each item
  const items = values.map((v, i) => ({
    value: v,
    weight: weights[i],
    ratio: v / weights[i]
  }));

  // Sort by value-to-weight ratio (descending)
  items.sort((a, b) => b.ratio - a.ratio);

  let totalValue = 0;
  let remainingCapacity = capacity;

  for (const item of items) {
    if (remainingCapacity >= item.weight) {
      // Take the whole item
      totalValue += item.value;
      remainingCapacity -= item.weight;
    } else {
      // Take a fraction of the item
      totalValue += item.ratio * remainingCapacity;
      break; // Knapsack is full
    }
  }

  return totalValue;
}

/*
Example 3: Huffman Coding (simplified)
*/

class HuffmanNode {
  constructor(char, freq) {
    this.char = char;
    this.freq = freq;
    this.left = null;
    this.right = null;
  }
}

function buildHuffmanTree(data) {
  // Count frequency of each character
  const freqMap = new Map();
  for (const char of data) {
    freqMap.set(char, (freqMap.get(char) || 0) + 1);
  }

  // Create leaf nodes and add to priority queue (min-heap)
  // (Simplified: using a sorted array as priority queue)
  const priorityQueue = [];
  for (const [char, freq] of freqMap.entries()) {
    priorityQueue.push(new HuffmanNode(char, freq));
  }

  // Build Huffman Tree
  while (priorityQueue.length > 1) {
    // Sort by frequency (for a real implementation, use a proper min-heap)
    priorityQueue.sort((a, b) => a.freq - b.freq);

    // Extract two nodes with lowest frequency
    const left = priorityQueue.shift();
    const right = priorityQueue.shift();

    // Create a new internal node with these two nodes as children
    // and frequency equal to sum of both nodes' frequencies
    const newNode = new HuffmanNode('$', left.freq + right.freq);
    newNode.left = left;
    newNode.right = right;

    // Add the new node to the priority queue
    priorityQueue.push(newNode);
  }

  // Return the root of Huffman Tree
  return priorityQueue[0];
}

/*
When to Use:
- When a problem can be solved by making a series of choices
- When local optimal choice leads to global optimal solution
- When the problem has optimal substructure
- For optimization problems where we want to maximize/minimize something
- When a simple, efficient algorithm is needed over a complex exact solution
*/ 