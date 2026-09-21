"use strict";

const Matrix3 = {
  identity() {
    return new Float32Array([
      1, 0, 0,
      0, 1, 0,
      0, 0, 1
    ]);
  },

  translation(x, y) {
    return new Float32Array([
      1, 0, 0,
      0, 1, 0,
      x, y, 1
    ]);
  },

  rotation(radians) {
    const cosine = Math.cos(radians);
    const sine = Math.sin(radians);

    return new Float32Array([
      cosine, sine, 0,
      -sine, cosine, 0,
      0, 0, 1
    ]);
  },

  scaling(x, y) {
    return new Float32Array([
      x, 0, 0,
      0, y, 0,
      0, 0, 1
    ]);
  },

  multiply(a, b) {
    const result = new Float32Array(9);

    for (let column = 0; column < 3; column += 1) {
      for (let row = 0; row < 3; row += 1) {
        result[column * 3 + row] =
          a[row] * b[column * 3] +
          a[3 + row] * b[column * 3 + 1] +
          a[6 + row] * b[column * 3 + 2];
      }
    }

    return result;
  },

  compose(transform, order = "TRS") {
    const translation = this.translation(transform.x, transform.y);
    const rotation = this.rotation(transform.rotation);
    const scale = this.scaling(transform.scaleX, transform.scaleY);

    if (order === "RTS") {
      return this.multiply(rotation, this.multiply(translation, scale));
    }

    return this.multiply(translation, this.multiply(rotation, scale));
  },

  transformPoint(matrix, x, y) {
    return {
      x: matrix[0] * x + matrix[3] * y + matrix[6],
      y: matrix[1] * x + matrix[4] * y + matrix[7]
    };
  },

  selfTest() {
    const model = this.compose({ x: 10, y: 20, rotation: 0, scaleX: 2, scaleY: 3 });
    const point = this.transformPoint(model, 4, 5);
    return point.x === 18 && point.y === 35;
  }
};

Object.freeze(Matrix3);
