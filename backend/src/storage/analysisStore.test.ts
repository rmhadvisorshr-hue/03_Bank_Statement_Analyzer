import assert from "node:assert/strict";
import { evictOldest } from "./analysisStore";

const map = new Map<number, string>();
for (let i = 0; i < 205; i++) map.set(i, `record-${i}`);

evictOldest(map, 200);

assert.equal(map.size, 200, "map should be trimmed to maxSize");
assert.equal(map.has(0), false, "oldest keys should be evicted first");
assert.equal(map.has(204), true, "newest key should survive");

console.log("evictOldest: ok");
