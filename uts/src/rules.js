export const MAX_FLEET = 60;
// Menghitung jumlah kapal setelah melewati gate dan membatasinya antara nol dan kapasitas armada.
export function applyGate(fleet, type, value) {
  return Math.max(
    0,
    Math.min(MAX_FLEET, type === "multiply" ? fleet * value : fleet + value),
  );
}
// Menentukan posisi setiap kapal agar formasi bertambah lebar saat armada membesar.
export function fleetPosition(index) {
  const row = Math.floor(Math.sqrt(index));
  const col = index - row * row;
  return { x: (col - row) * 0.48, z: row * 0.57 };
}
// Menentukan sektor misi berdasarkan jarak yang sudah ditempuh armada.
export function sectorAt(distance) {
  return distance < 260 ? 1 : distance < 560 ? 2 : 3;
}
