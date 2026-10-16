// Four independent vertices per face preserve hard normals and full-face UVs.
export function cube() {
  const faces = [
    [[0,0,1], [[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]]],
    [[0,0,-1], [[1,-1,-1],[-1,-1,-1],[-1,1,-1],[1,1,-1]]],
    [[1,0,0], [[1,-1,1],[1,-1,-1],[1,1,-1],[1,1,1]]],
    [[-1,0,0], [[-1,-1,-1],[-1,-1,1],[-1,1,1],[-1,1,-1]]],
    [[0,1,0], [[-1,1,1],[1,1,1],[1,1,-1],[-1,1,-1]]],
    [[0,-1,0], [[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,1]]]
  ];
  const position = [], normal = [], uv = [];
  for (const [n, points] of faces) for (const i of [0,1,2,0,2,3]) {
    position.push(...points[i]); normal.push(...n);
    uv.push(...[[0,0],[1,0],[1,1],[0,1]][i]);
  }
  return {position, normal, uv};
}
