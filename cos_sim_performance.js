/**
 * @file cos_sim_performance.js
 * @description Compare performance between two cosine similarity implementations.
 *
 * This script measures and compares the average execution time of two `cos_sim` functions
 * across multiple runs using random test vectors, similar to how `nearest_performance.js` does.
 *
 * Run: `node cos_sim_performance.js`
 *
 * Adjust VECTOR_SIZE, NUM_INNER_RUNS, and RUNS as needed.
 */

/**
 * First cosine similarity implementation (Reduce-based)
 * @param {number[]} vector1
 * @param {number[]} vector2
 * @returns {number}
 */
function cos_sim_reduce(vector1, vector2) {
  const dotProduct = vector1.reduce((acc, val, i) => acc + val * vector2[i], 0);
  const normA = Math.sqrt(vector1.reduce((acc, val) => acc + val * val, 0));
  const normB = Math.sqrt(vector2.reduce((acc, val) => acc + val * val, 0));
  return normA === 0 || normB === 0 ? 0 : dotProduct / (normA * normB);
}

/**
 * Second cosine similarity implementation (For-loop-based)
 * @param {number[]} vector1
 * @param {number[]} vector2
 * @returns {number}
 */
function cos_sim_loop(vector1, vector2) {
  if (vector1.length !== vector2.length) {
    throw new Error('Vectors must have the same length');
  }

  let dot_product = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;
  const epsilon = 1e-8;

  for (let i = 0; i < vector1.length; i++) {
    dot_product += vector1[i] * vector2[i];
    magnitude1 += vector1[i] * vector1[i];
    magnitude2 += vector2[i] * vector2[i];
  }

  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);

  if (magnitude1 < epsilon || magnitude2 < epsilon) {
    return 0;
  }

  return dot_product / (magnitude1 * magnitude2);
}

// Generate test vectors
function generate_random_vector(size) {
  const vec = [];
  for (let i = 0; i < size; i++) {
    vec.push(Math.random());
  }
  return vec;
}

// Parameters for the performance test
const VECTOR_SIZE = 1536;
const NUM_INNER_RUNS = 100000; // Number of computations inside each measurement run
const RUNS = 5; // Number of times we measure performance to compute a stable average

// Generate two random test vectors
const testVector1 = generate_random_vector(VECTOR_SIZE);
const testVector2 = generate_random_vector(VECTOR_SIZE);

/**
 * Runs the given cos_sim function NUM_INNER_RUNS times and returns total time in ms.
 * @param {Function} fn - cos_sim function to benchmark
 * @returns {number} total time in ms
 */
function benchmark_cos_sim(fn) {
  const start = process.hrtime.bigint();
  let result = 0;
  for (let i = 0; i < NUM_INNER_RUNS; i++) {
    result += fn(testVector1, testVector2);
  }
  const end = process.hrtime.bigint();
  const diffMs = Number(end - start) / 1e6;
  // Use result to avoid potential JIT optimizations
  return diffMs;
}

// Benchmark both implementations multiple times (like nearest_performance.js)
(async () => {
  let reduceTimes = [];
  let loopTimes = [];

  for (let i = 0; i < RUNS; i++) {
    const reduceTime = benchmark_cos_sim(cos_sim_reduce);
    const loopTime = benchmark_cos_sim(cos_sim_loop);
    reduceTimes.push(reduceTime);
    loopTimes.push(loopTime);
  }

  // Compute averages
  const avgReduce = reduceTimes.reduce((a, b) => a + b, 0) / RUNS;
  const avgLoop = loopTimes.reduce((a, b) => a + b, 0) / RUNS;

  // Print results
  console.log(`Average reduce-based cos_sim execution time (ms): ${avgReduce}`);
  console.log(`Average loop-based cos_sim execution time (ms): ${avgLoop}`);

  // Determine faster and slower
  const avgs = { reduce: avgReduce, loop: avgLoop };
  const faster = Object.entries(avgs).reduce((a,b)=>a[1]<b[1]?a:b)[0];
  const slower = Object.entries(avgs).reduce((a,b)=>a[1]>b[1]?a:b)[0];

  // Calculate percentage improvement
  const pct = ((1 - (avgs[faster] / avgs[slower])) * 100).toFixed(2);

  console.log(JSON.stringify(avgs, null, 2));
  console.log(`${faster} is ${pct}% faster than ${slower}`);
})();

/**
 * TECHNICAL FLOW:
 * 1. Two cos_sim functions: `cos_sim_reduce` and `cos_sim_loop`.
 * 2. Generate random test vectors of size VECTOR_SIZE.
 * 3. Run each function multiple times (RUNS) to get a stable average.
 * 4. Each run calls the benchmark function which itself executes the cos_sim NUM_INNER_RUNS times.
 * 5. Compute average execution times and compare.
 * 6. Print out average times, JSON results, and improvement percentage, similar to the approach in `nearest_performance.js`.
 *
 * MULTIPLE-CHOICE DELIVERABLE OPTIONS:
 *
 * A) Produce a README.md file describing how to run and interpret the script results.
 * B) Introduce a CLI argument to adjust VECTOR_SIZE, NUM_INNER_RUNS, and RUNS, then show instructions.
 * C) Save JSON results to a `results.json` file.
 * D) Add a function to run multiple vector size tests and print a summary.
 */
