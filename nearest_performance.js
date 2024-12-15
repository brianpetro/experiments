/**
 * @file nearest_performance.js
 * @description Compare performance between two nearest algorithms.
 *
 * This script runs two different `nearest` implementations multiple times against the same dataset and vector,
 * then logs out their respective execution times to compare performance.
 *
 * No external dependencies are required. Simply run:
 * `node nearest_performance.js`
 *
 * Adjust dataset size and repetition count as needed.
 */

/**
 * @typedef {Object} Item
 * @property {number[]} vec
 * @property {any} data
 */

/**
 * @typedef {Object} FilterOptions
 * @property {number} [limit]
 */

"use strict";

/**
 * @function cos_sim
 * @description Compute cosine similarity between two vectors
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number}
 */
function cos_sim(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom ? dot / denom : 0;
}

/**
 * @function results_acc
 * @description Accumulate results while maintaining only top scoring items.
 * @param {{min:number, results:Set<{item:Item,score:number}>,minResult:{item:Item,score:number}}} _acc
 * @param {{item:Item, score:number}} result
 * @param {number} ct
 */
function results_acc(_acc, result, ct = 10) {
  if (_acc.results.size < ct) {
    _acc.results.add(result);
    if (!_acc.minResult || result.score < _acc.minResult.score) {
      _acc.minResult = result;
      _acc.min = result.score;
    }
  } else if (result.score > _acc.min) {
    _acc.results.add(result);
    _acc.results.delete(_acc.minResult);
    _acc.minResult = Array.from(_acc.results).reduce((min, curr) => (curr.score < min.score ? curr : min));
    _acc.min = _acc.minResult.score;
  }
}

/**
 * @class Collection
 * @description Mock collection class holding items with vectors
 */
class Collection {
  constructor(items) {
    this.items = {};
    for (let i = 0; i < items.length; i++) {
      this.items[i] = items[i];
    }
  }

  /**
   * @function filter
   * @description filter items based on any criteria. For simplicity, returns all items.
   * @returns {Item[]}
   */
  filter() {
    return Object.values(this.items);
  }

  /**
   * @async
   * @function nearest_for_loop
   * @description The first version of nearest algorithm (async)
   * @param {number[]} vec
   * @param {FilterOptions} filter
   * @returns {Promise<{item:Item,score:number}[]>}
   */
  async nearest_for_loop(vec, filter = {}) {
    if (!vec || !Array.isArray(vec)) {
      throw new Error("Invalid vector input to nearest_for_loop()");
    }
    const { limit = 50 } = filter;
    const items = Object.values(this.items).filter(item => item.vec);
    const acc = { min: 0, results: new Set(), minResult: null };
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const score = cos_sim(vec, item.vec);
      const result = { item, score };
      results_acc(acc, result, limit);
    }
    return Array.from(acc.results).sort((a,b) => b.score - a.score);
  }

  /**
   * @function nearest_reduce
   * @description The second version of nearest algorithm
   * @param {number[]} vec
   * @param {FilterOptions} filter
   * @returns {{item:Item,score:number}[]}
   */
  async nearest_reduce(vec, filter = {}) {
    if (!vec) {
      console.log("no vec");
      return [];
    }
    const { limit = 50 } = filter;
    const nearest = this.filter()
      .reduce((acc, item) => {
        if (!item.vec) return acc; // skip if no vec
        const result = { item, score: cos_sim(vec, item.vec) };
        results_acc(acc, result, limit); // update acc
        return acc;
      }, { min: 0, results: new Set(), minResult: null });
    return Array.from(nearest.results);
  }
}

// -------------------------------------------------------------
// Example usage and performance comparison
// -------------------------------------------------------------

// Create a mock dataset
// Each item will have a random vector of size 128
const VECTOR_SIZE = 1536;
const NUM_ITEMS = 10000;
const dataset = [];
for (let i = 0; i < NUM_ITEMS; i++) {
  const vec = [];
  for (let j = 0; j < VECTOR_SIZE; j++) {
    vec.push(Math.random());
  }
  dataset.push({ vec, data: `Item ${i}` });
}

const collection = new Collection(dataset);
// Query vector
const queryVector = [];
for (let j = 0; j < VECTOR_SIZE; j++) {
  queryVector.push(Math.random());
}

// Number of runs to get a stable average
const RUNS = 5;

(async () => {
  // Async version performance
  let asyncTimes = [];
  for (let i = 0; i < RUNS; i++) {
    const start = process.hrtime.bigint();
    await collection.nearest_for_loop(queryVector, { limit: 50 });
    const end = process.hrtime.bigint();
    const diff = Number(end - start) / 1e6; // ms
    asyncTimes.push(diff);
  }

  // Sync version performance
  let syncTimes = [];
  for (let i = 0; i < RUNS; i++) {
    const start = process.hrtime.bigint();
    await collection.nearest_reduce(queryVector, { limit: 50 });
    const end = process.hrtime.bigint();
    const diff = Number(end - start) / 1e6; // ms
    syncTimes.push(diff);
  }

  const avgs = {};
  avgs.for_loop = asyncTimes.reduce((a,b)=>a+b,0)/RUNS;
  avgs.reduce = syncTimes.reduce((a,b)=>a+b,0)/RUNS;

  console.log("Average for_loop nearest execution time (ms):", avgs.for_loop);
  console.log("Average reduce nearest execution time (ms):", avgs.reduce);
  const faster = Object.entries(avgs).reduce((a,b)=>a[1] < b[1] ? a : b)[0];
  const slower = Object.entries(avgs).reduce((a,b)=>a[1] > b[1] ? a : b)[0];
  // calculate percentage improvement of winner over loser
  // winner improvement pct calc
  const pct = ((1 - (avgs[faster] / avgs[slower])) * 100).toFixed(2);
  console.log(JSON.stringify(avgs, null, 2));
  console.log(`${faster} is ${pct}% faster than ${slower}`);
})();