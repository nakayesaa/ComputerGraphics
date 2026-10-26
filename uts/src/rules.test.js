import { test } from "node:test";
import assert from "node:assert/strict";
import { applyGate, fleetPosition, sectorAt } from "./rules.js";
// Memastikan gate, batas armada, formasi, dan perpindahan sektor mengikuti aturan gameplay.
test("fleet progression stays bounded, losses can end a run, formations remain unique", () => {
  assert.equal(applyGate(8, "multiply", 3), 24);
  assert.equal(applyGate(50, "multiply", 2), 60);
  assert.equal(applyGate(4, "add", -8), 0);
  assert.equal(applyGate(20, "add", 6), 26);
  assert.equal(
    new Set(
      Array.from({ length: 60 }, (_, i) => JSON.stringify(fleetPosition(i))),
    ).size,
    60,
  );
  assert.deepEqual([0, 260, 560].map(sectorAt), [1, 2, 3]);
});
