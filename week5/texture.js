// Procedural Textures & Texture Utilities for WebGL2

export function generateTextureCanvas(type = 'checker', size = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (type === 'checker') {
    // 8x8 Monochrome Checkerboard
    const cells = 8;
    const step = size / cells;
    for (let y = 0; y < cells; y++) {
      for (let x = 0; x < cells; x++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? '#ffffff' : '#111111';
        ctx.fillRect(x * step, y * step, step, step);
      }
    }
    // High-contrast border line
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, size - 2, size - 2);

  } else if (type === 'grid') {
    // Technical Tech Grid Pattern
    ctx.fillStyle = '#141414';
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    const step = size / 4;
    for (let i = 0; i <= size; i += step) {
      ctx.beginPath();
      ctx.moveTo(i, 0); ctx.lineTo(i, size);
      ctx.moveTo(0, i); ctx.lineTo(size, i);
      ctx.stroke();
    }

    // Concentric circle target
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 4, 0, Math.PI * 2);
    ctx.stroke();

  } else if (type === 'brick') {
    // Monochrome Brick Texture
    ctx.fillStyle = '#222222';
    ctx.fillRect(0, 0, size, size);

    const rows = 8;
    const h = size / rows;
    const w = size / 4;
    ctx.fillStyle = '#e0e0e0';
    for (let r = 0; r < rows; r++) {
      const offset = (r % 2) * (w / 2);
      for (let x = -w; x < size + w; x += w) {
        ctx.fillRect(x + offset + 2, r * h + 2, w - 4, h - 4);
      }
    }

  } else if (type === 'dots') {
    // Halftone Dots Matrix
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = '#ffffff';
    const step = size / 8;
    for (let y = step / 2; y < size; y += step) {
      for (let x = step / 2; x < size; x += step) {
        ctx.beginPath();
        ctx.arc(x, y, step / 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  return canvas;
}

export function createGLTexture(gl, imageSource, isLinear = true, wrapMode = 'REPEAT') {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Upload image pixel data
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    imageSource
  );

  updateTextureParams(gl, texture, isLinear, wrapMode);
  return texture;
}

export function updateTextureParams(gl, texture, isLinear, wrapMode) {
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Min / Mag Filtering
  const minFilter = isLinear ? gl.LINEAR_MIPMAP_LINEAR : gl.NEAREST;
  const magFilter = isLinear ? gl.LINEAR : gl.NEAREST;

  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter);

  // Wrapping Mode
  let glWrap = gl.REPEAT;
  if (wrapMode === 'CLAMP_TO_EDGE' || wrapMode === 'CLAMP') {
    glWrap = gl.CLAMP_TO_EDGE;
  } else if (wrapMode === 'MIRRORED_REPEAT' || wrapMode === 'MIRROR') {
    glWrap = gl.MIRRORED_REPEAT;
  }

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, glWrap);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, glWrap);
}
