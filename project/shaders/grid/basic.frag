#version 300 es
precision highp float;

// WebGL2 inputs (from vertex shader)
in float near; //0.01
in float far; //100
in vec3 nearPoint;
in vec3 farPoint;
in mat4 fragView;
in mat4 fragProj;

// WebGL2 output
out vec4 outColor;

vec4 grid(vec3 fragPos3D, float scale, bool drawAxis) {
    vec2 coord = fragPos3D.xz * scale;
    vec2 derivative = fwidth(coord);
    vec2 grid = abs(fract(coord - 0.5) - 0.5) / derivative;
    float line = min(grid.x, grid.y);
    float minimumz = min(derivative.y, 1.0);
    float minimumx = min(derivative.x, 1.0);
    vec4 color = vec4(0.2, 0.2, 0.2, 1.0 - min(line, 1.0));
    // z axis
    if(fragPos3D.x > -0.1 * minimumx && fragPos3D.x < 0.1 * minimumx)
        color.z = 1.0;
    // x axis
    if(fragPos3D.z > -0.1 * minimumz && fragPos3D.z < 0.1 * minimumz)
        color.x = 1.0;
    return color;
}

float computeDepth(vec3 pos) {
    vec4 clip_space_pos = fragProj * fragView * vec4(pos.xyz, 1.0);
    // Normalize from [-1, 1] to [0, 1] for depth buffer
    return ((clip_space_pos.z / clip_space_pos.w) + 1.0) * 0.5;
}

float computeLinearDepth(vec3 pos) {
    vec4 clip_space_pos = fragProj * fragView * vec4(pos.xyz, 1.0);
    float clip_space_depth = (clip_space_pos.z / clip_space_pos.w) * 2.0 - 1.0; // put back between -1 and 1
    float linearDepth = (2.0 * near * far) / (far + near - clip_space_depth * (far - near)); // get linear value between 0.01 and 100
    return linearDepth / far; // normalize
}

void main() {
    float t = -nearPoint.y / (farPoint.y - nearPoint.y);
    
    // Only render fragments that intersect the ground plane (y=0)
    if (t <= 0.0) {
        discard; // Ray doesn't hit the ground plane
    }
    
    vec3 fragPos3D = nearPoint + t * (farPoint - nearPoint);
    
    // Set proper depth to avoid overlapping with other meshes
    gl_FragDepth = computeDepth(fragPos3D);
    
    // Simple grid calculation
    vec2 coord = fragPos3D.xz; // Use X and Z coordinates for ground plane
    vec2 derivative = fwidth(coord);
    vec2 grid = abs(fract(coord - 0.5) - 0.5) / derivative;
    float line = min(grid.x, grid.y);
    
    // Create grid lines with better alpha handling to prevent overlap brightness
    float gridAlpha = 1.0 - min(line, 1.0);
    vec4 color = vec4(0.2, 0.2, 0.2, gridAlpha);
    
    // Add colored axes
    float minimumz = min(derivative.y, 1.0);
    float minimumx = min(derivative.x, 1.0);
    
    // Z axis (blue)
    if(fragPos3D.x > -0.1 * minimumx && fragPos3D.x < 0.1 * minimumx)
        color.z = 1.0;
    // X axis (red)
    if(fragPos3D.z > -0.1 * minimumz && fragPos3D.z < 0.1 * minimumz)
        color.x = 1.0;
    
    // Simple distance-based fading
    float dist = length(fragPos3D);
    float fade = 1.0 - clamp(dist / 50.0, 0.0, 1.0);
    color.a *= fade;
    
    // Clamp alpha to prevent over-bright areas from overlapping triangles
    color.a = clamp(color.a, 0.0, 0.8);
    
    // Discard if too transparent
    if (color.a < 0.05) {
        discard;
    }
    
    outColor = color;
}
