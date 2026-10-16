#version 300 es
in vec3 a_position;
in vec3 a_normal;
in vec2 a_uv;
uniform mat4 u_model, u_view, u_projection;
out vec3 v_position, v_normal;
out vec2 v_uv;
void main() {
  vec4 world = u_model * vec4(a_position, 1.0);
  v_position = world.xyz;
  v_normal = transpose(inverse(mat3(u_model))) * a_normal;
  v_uv = a_uv;
  gl_Position = u_projection * u_view * world;
}
