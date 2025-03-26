/*
GRAPH ALGORITHMS PATTERNS

Concept:
Graph algorithms solve problems related to graph data structures, which consist of vertices (nodes) 
and edges connecting these vertices. They're fundamental for solving network-related problems and 
various optimization challenges.

Common Graph Representations:
1. Adjacency Matrix: 2D array where matrix[i][j] indicates edge between i and j
2. Adjacency List: Array of lists where list[i] contains all vertices adjacent to i

Key Graph Algorithms:

1. TRAVERSAL ALGORITHMS
   - Breadth-First Search (BFS): Explore all neighbors at current depth before moving to next depth
   - Depth-First Search (DFS): Explore as far as possible along a branch before backtracking

2. SHORTEST PATH ALGORITHMS
   - Dijkstra's Algorithm: Find shortest path from source to all vertices (non-negative weights)
   - Bellman-Ford: Find shortest path with negative weights (and detect negative cycles)
   - Floyd-Warshall: Find shortest paths between all pairs of vertices

3. MINIMUM SPANNING TREE ALGORITHMS
   - Kruskal's Algorithm: Sort edges by weight and add if no cycle is formed
   - Prim's Algorithm: Grow tree from a starting vertex by adding lowest-weight edge

4. TOPOLOGICAL SORTING
   - Used for directed acyclic graphs (DAGs) to order vertices such that for every edge u->v, u comes before v

Time Complexity: Varies based on algorithm and implementation, from O(V+E) to O(V³)
Space Complexity: Usually O(V) or O(E) where V is vertices and E is edges

Example 1: Breadth-First Search (BFS)
*/

function bfs(graph, startNode) {
  const visited = new Set([startNode]);
  const queue = [startNode];
  const result = [];

  while (queue.length > 0) {
    const current = queue.shift();
    result.push(current);

    // Add all unvisited neighbors to queue
    for (const neighbor of graph[current]) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  return result;
}

/*
Example 2: Depth-First Search (DFS)
*/

function dfs(graph, startNode) {
  const visited = new Set();
  const result = [];

  function dfsHelper(node) {
    visited.add(node);
    result.push(node);

    for (const neighbor of graph[node]) {
      if (!visited.has(neighbor)) {
        dfsHelper(neighbor);
      }
    }
  }

  dfsHelper(startNode);
  return result;
}

/*
Example 3: Dijkstra's Algorithm for Shortest Path
*/

function dijkstra(graph, start) {
  // Initialize distances with Infinity
  const distances = {};
  const previous = {};
  const nodes = new Set();

  // Set initial distances
  for (const vertex in graph) {
    distances[vertex] = Infinity;
    previous[vertex] = null;
    nodes.add(vertex);
  }
  distances[start] = 0;

  while (nodes.size > 0) {
    // Find vertex with minimum distance
    let minVertex = null;
    for (const vertex of nodes) {
      if (minVertex === null || distances[vertex] < distances[minVertex]) {
        minVertex = vertex;
      }
    }

    // Remove min vertex from unvisited set
    nodes.delete(minVertex);

    // If the shortest distance to the min vertex is Infinity, then remaining vertices are unreachable
    if (distances[minVertex] === Infinity) break;

    // For each neighbor of current vertex
    for (const neighbor in graph[minVertex]) {
      const distance = distances[minVertex] + graph[minVertex][neighbor];

      // If shorter path found
      if (distance < distances[neighbor]) {
        distances[neighbor] = distance;
        previous[neighbor] = minVertex;
      }
    }
  }

  return { distances, previous };
}

/*
Example 4: Topological Sort
*/

function topologicalSort(graph) {
  const visited = new Set();
  const temp = new Set();  // For cycle detection
  const result = [];

  function dfs(node) {
    // If node is in temp, we have a cycle
    if (temp.has(node)) return false;

    // If node is already processed, skip
    if (visited.has(node)) return true;

    temp.add(node);

    // Visit all neighbors
    for (const neighbor of graph[node]) {
      if (!dfs(neighbor)) return false;
    }

    // Remove from temp and add to visited
    temp.delete(node);
    visited.add(node);

    // Add to result (prepend as we're working backwards)
    result.unshift(node);
    return true;
  }

  // Process all vertices
  for (const node in graph) {
    if (!visited.has(node)) {
      if (!dfs(node)) return null; // Cycle detected
    }
  }

  return result;
}

/*
When to Use:
- BFS: When finding shortest path in unweighted graphs, level-order traversal
- DFS: When exploring all possible paths, cycle detection, connected components
- Dijkstra's: When finding shortest path with non-negative weights
- Bellman-Ford: When finding shortest path with possible negative weights
- Topological Sort: When ordering tasks with dependencies (DAG)
- MST Algorithms: When connecting all vertices with minimum total edge weight
*/ 