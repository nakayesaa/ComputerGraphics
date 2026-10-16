#version 300 es
precision highp float;
in vec3 v_position, v_normal;
in vec2 v_uv;
uniform sampler2D u_texture;
uniform vec3 u_light, u_camera;
uniform float u_ambient, u_shininess, u_uv;
uniform int u_mode;
uniform bool u_marker;
out vec4 outColor;
void main() {
  if (u_marker) { outColor = vec4(1.0); return; }
  vec3 texel = texture(u_texture, v_uv * u_uv).rgb;
  vec3 N = normalize(v_normal);
  vec3 L = normalize(u_light - v_position);
  vec3 V = normalize(u_camera - v_position);
  float diffuse = max(dot(N, L), 0.0);
  float specular = diffuse > 0.0 ? pow(max(dot(V, reflect(-L, N)), 0.0), u_shininess) : 0.0;
  vec3 color = vec3(0.0);
  if (u_mode == 0 || u_mode == 1 || u_mode == 4) color += texel * u_ambient;
  if (u_mode == 0 || u_mode == 2 || u_mode == 4) color += texel * diffuse * 0.75;
  if (u_mode == 0 || u_mode == 3) color += vec3(specular * 0.8);
  outColor = vec4(color, 1.0);
}
