export async function program(gl) {
  const result = gl.createProgram();
  for (const [file, type] of [['object.vert', gl.VERTEX_SHADER], ['object.frag', gl.FRAGMENT_SHADER]]) {
    const response = await fetch(new URL(`./shader/${file}`, import.meta.url));
    if (!response.ok) throw Error(`Shader ${file}: HTTP ${response.status}`);
    const shader = gl.createShader(type);
    gl.shaderSource(shader, await response.text()); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(shader));
    gl.attachShader(result, shader); gl.deleteShader(shader);
  }
  gl.linkProgram(result);
  if (!gl.getProgramParameter(result, gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(result));
  return result;
}
export async function texture(gl, name) {
  const image = new Image();
  image.src = new URL(`./assets/${name}.png`, import.meta.url).href;
  await image.decode();
  const result = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, result);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  return result;
}
