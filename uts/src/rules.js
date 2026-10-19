export const MAX_FLEET = 60;
export function applyGate(fleet, type, value) {
  return Math.max(
    0,
    Math.min(MAX_FLEET, type === "multiply" ? fleet * value : fleet + value),
  );
}
export function fleetPosition(index) {
  const row = Math.floor(Math.sqrt(index));
  const col = index - row * row;
  return { x: (col - row) * 0.48, z: row * 0.57 };
}
export function sectorAt(distance) {
  return distance < 260 ? 1 : distance < 560 ? 2 : 3;
}
