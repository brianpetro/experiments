/**
 * @fileoverview Demonstrates performance overhead of async vs sync functions in Node.js using cosine similarity as the test function.
 * Measures the time difference in executing a simple cosine similarity computation 100,000 times.
 */

/**
 * Computes the cosine similarity between two vectors.
 * @param {number[]} vecA - First vector
 * @param {number[]} vecB - Second vector
 * @returns {number} Cosine similarity between vecA and vecB
 */
function cosine_similarity(vecA, vecB) {
  let dotProduct = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magA += vecA[i] * vecA[i];
    magB += vecB[i] * vecB[i];
  }

  return dotProduct / (Math.sqrt(magA) * Math.sqrt(magB));
}

/**
 * A simple synchronous function that computes cosine similarity between two vectors.
 * @returns {number} - Computed cosine similarity.
 */
function sync_task() {
  const vecA = Array.from({ length: 1536 }, () => Math.random());
  const vecB = Array.from({ length: 1536 }, () => Math.random());
  return cosine_similarity(vecA, vecB);
}

/**
 * A simple asynchronous function that computes cosine similarity between two vectors.
 * @returns {Promise<number>} - A promise that resolves to computed cosine similarity.
 */
async function async_task() {
  const vecA = Array.from({ length: 1536 }, () => Math.random());
  const vecB = Array.from({ length: 1536 }, () => Math.random());
  return cosine_similarity(vecA, vecB);
}

/**
 * Executes a given function N times and returns the duration of execution in milliseconds.
 * @param {Function} fn - The function to execute.
 * @param {number} iterations - Number of times to execute the function.
 * @returns {number} - The total time taken in milliseconds.
 */
function measure_sync(fn, iterations) {
  const start = Date.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  return Date.now() - start;
}

/**
 * Executes a given async function N times (in sequence) and returns the duration in milliseconds.
 * @param {Function} fn - The async function to execute.
 * @param {number} iterations - Number of times to execute the function.
 * @returns {Promise<number>} - The total time taken in milliseconds.
 */
async function measure_async(fn, iterations) {
  const start = Date.now();
  for (let i = 0; i < iterations; i++) {
    await fn();
  }
  return Date.now() - start;
}

(async () => {
  const iterations = 10000;

  // initial operation to ensure both are warmed up
  sync_task();
  await async_task();

  const syncTime = measure_sync(sync_task, iterations);
  console.log(`Synchronous (${iterations} executions): ${syncTime}ms`);
  const asyncTime = await measure_async(async_task, iterations);
  console.log(`Asynchronous (${iterations} executions): ${asyncTime}ms`);

  console.log('Performance difference (async - sync):', asyncTime - syncTime, 'ms');
})();

/*
Technical Flow Documentation:
1. Defined a `cosine_similarity()` function that computes the cosine similarity between two fixed vectors.
2. Implemented `sync_task()` and `async_task()` to run the same cosine similarity computation on identical vectors.
3. Implemented `measure_sync()` to run a synchronous function `iterations` times, measuring total time.
4. Implemented `measure_async()` to run an async function `iterations` times sequentially, measuring total time.
5. Set iterations to 100,000.
6. Measured synchronous execution time and logged it.
7. Measured asynchronous execution time (awaiting each result) and logged it.
8. Logged the difference to show the overhead introduced by async when running a computational task repeatedly.
*/