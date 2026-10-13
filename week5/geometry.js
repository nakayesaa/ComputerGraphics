// 3D Cube with 36 vertices (6 faces x 2 triangles)
// Attributes: Position (vec3), Normal (vec3), UV (vec2)

export function createCubeData(uvScale = 2.0) {
  const positions = [];
  const normals = [];
  const uvs = [];

  const faces = [
    // Front face (Z+)
    {
      n: [0, 0, 1],
      v: [
        [-1, -1, 1], [1, -1, 1], [1, 1, 1],
        [-1, -1, 1], [1, 1, 1], [-1, 1, 1],
      ],
    },
    // Back face (Z-)
    {
      n: [0, 0, -1],
      v: [
        [1, -1, -1], [-1, -1, -1], [-1, 1, -1],
        [1, -1, -1], [-1, 1, -1], [1, 1, -1],
      ],
    },
    // Top face (Y+)
    {
      n: [0, 1, 0],
      v: [
        [-1, 1, 1], [1, 1, 1], [1, 1, -1],
        [-1, 1, 1], [1, 1, -1], [-1, 1, -1],
      ],
    },
    // Bottom face (Y-)
    {
      n: [0, -1, 0],
      v: [
        [-1, -1, -1], [1, -1, -1], [1, -1, 1],
        [-1, -1, -1], [1, -1, 1], [-1, -1, 1],
      ],
    },
    // Right face (X+)
    {
      n: [1, 0, 0],
      v: [
        [1, -1, 1], [1, -1, -1], [1, 1, -1],
        [1, -1, 1], [1, 1, -1], [1, 1, 1],
      ],
    },
    // Left face (X-)
    {
      n: [-1, 0, 0],
      v: [
        [-1, -1, -1], [-1, -1, 1], [-1, 1, 1],
        [-1, -1, -1], [-1, 1, 1], [-1, 1, -1],
      ],
    },
  ];

  const faceUVs = [
    [0, 0], [uvScale, 0], [uvScale, uvScale],
    [0, 0], [uvScale, uvScale], [0, uvScale],
  ];

  faces.forEach((f) => {
    f.v.forEach((vert, i) => {
      positions.push(...vert);
      normals.push(...f.n);
      uvs.push(...faceUVs[i]);
    });
  });

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    uvs: new Float32Array(uvs),
    vertexCount: positions.length / 3,
  };
}

export function createLightMarkerData(s = 0.16) {
  const v = [
    // Front
    -s, -s, s,  s, -s, s,  s, s, s,  -s, -s, s,  s, s, s,  -s, s, s,
    // Back
    s, -s, -s,  -s, -s, -s,  -s, s, -s,  s, -s, -s,  -s, s, -s,  s, s, -s,
    // Top
    -s, s, s,  s, s, s,  s, s, -s,  -s, s, s,  s, s, -s,  -s, s, -s,
    // Bottom
    -s, -s, -s,  s, -s, -s,  s, -s, s,  -s, -s, -s,  s, -s, s,  -s, -s, s,
    // Right
    s, -s, s,  s, -s, -s,  s, s, -s,  s, -s, s,  s, s, -s,  s, s, s,
    // Left
    -s, -s, -s,  -s, -s, s,  -s, s, s,  -s, -s, -s,  -s, s, s,  -s, s, -s,
  ];
  return {
    positions: new Float32Array(v),
    vertexCount: v.length / 3,
  };
}
