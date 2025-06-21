#version 300 es
precision highp float;

in vec4 aPosition;

uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform float uNear; // 0.01
uniform float uFar;  // 100.0

// Outputs to fragment shader
out float near;
out float far;
out vec3 nearPoint;
out vec3 farPoint;
out mat4 fragView;
out mat4 fragProj;

vec3 gridPlane[6] = vec3[](
    // First triangle
    vec3(-1, -1, 0), vec3(1, -1, 0), vec3(-1, 1, 0),
    // Second triangle  
    vec3(-1, 1, 0), vec3(1, -1, 0), vec3(1, 1, 0)
);

vec3 UnprojectPoint(float x, float y, float z, mat4 view, mat4 projection) {
    mat4 viewInv = inverse(view);
    mat4 projInv = inverse(projection);
    vec4 unprojectedPoint = viewInv * projInv * vec4(x, y, z, 1.0);
    return unprojectedPoint.xyz / unprojectedPoint.w;
}

void main() {
    vec3 p = gridPlane[gl_VertexID].xyz;
    
    // Pass uniforms to fragment shader
    near = uNear;
    far = uFar;
    fragView = uViewMatrix;
    fragProj = uProjectionMatrix;
    
    // Calculate near and far points
    nearPoint = UnprojectPoint(p.x, p.y, 0.0, uViewMatrix, uProjectionMatrix).xyz; // unprojecting on the near plane
    farPoint = UnprojectPoint(p.x, p.y, 1.0, uViewMatrix, uProjectionMatrix).xyz; // unprojecting on the far plane
    
    gl_Position = vec4(p, 1.0); // using directly the clipped coordinates
}