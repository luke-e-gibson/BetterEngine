#version 300 es
precision highp float;

in vec4 aPosition;
in vec3 aNormal;
in vec2 aTexCoord;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

uniform bool uUseLighting;
uniform bool smoothShading;
uniform bool uUseTexture;

out vec3 vNormal;
out vec3 vFragPosition;
out vec3 vFlatNormal;
out vec2 vTextureCoord;

void main() {
    vec4 worldPosition = uModelMatrix * aPosition;
    gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
    
    // Transform normal to world space
    mat3 normalMatrix = mat3(transpose(inverse(uModelMatrix)));
    vec3 worldNormal = normalMatrix * aNormal;
    
    // Pass both smooth and flat normals
    vNormal = normalize(worldNormal);
    vFlatNormal = worldNormal; // Will be flattened by flat interpolation in fragment shader
    vFragPosition = vec3(worldPosition);
    vTextureCoord = aTexCoord;
}