#version 300 es
precision highp float;

in vec3 vNormal;
in vec3 vFragPosition;
in vec3 vFlatNormal;
in vec2 vTextureCoord;

uniform vec3 uLightPos;
uniform vec4 uLightColor;
uniform vec4 uModelColor;
uniform sampler2D uTexture;

uniform bool uUseLighting;
uniform bool smoothShading;
uniform bool uUseTexture;

out vec4 fragColor;

void main() {
    vec3 baseColor;
    float alpha;
    if(uUseTexture) {
        // Sample the texture color
        vec4 texColor = texture(uTexture, vTextureCoord);
        baseColor = texColor.rgb;
        alpha = texColor.a;
        
        // If the texture is fully transparent, discard the fragment
        if (alpha < 0.01) {
            discard;
        }
    }else {
        baseColor = uModelColor.rgb;
        alpha = uModelColor.a;
    }
    
    // If lighting is disabled, just return the base color
    if (!uUseLighting) {
        fragColor = vec4(baseColor, uModelColor.a);
        return;
    }
    
    // Choose between smooth and flat shading
    vec3 N;
    if (smoothShading) {
        // Use interpolated normal for smooth shading
        N = normalize(vNormal);
    } else {
        // Use face normal for flat shading
        // Calculate face normal using derivatives
        vec3 dFdxPos = dFdx(vFragPosition);
        vec3 dFdyPos = dFdy(vFragPosition);
        N = normalize(cross(dFdxPos, dFdyPos));
    }
    
    // Calculate light direction and distance
    vec3 lightDiff = uLightPos - vFragPosition;
    float distance = length(lightDiff);
    vec3 L = normalize(lightDiff);
    
    // Simple Phong diffuse with ambient
    float diff = max(dot(N, L), 0.0);
    
    // Calculate attenuation (light falloff)
    // Using the inverse square law with some constants to control the falloff
    float constant = 1.0;
    float linear = 0.09;
    float quadratic = 0.032;
    float attenuation = 1.0 / (constant + linear * distance + quadratic * (distance * distance));
    
    vec3 ambient = 0.2 * baseColor;
    vec3 diffuse = diff * baseColor * uLightColor.rgb;
    
    // Apply attenuation to the diffuse component (not typically to ambient)
    diffuse *= attenuation;
    
    fragColor = vec4(ambient + diffuse, alpha);
    //fragColor = vec4(baseColor, alpha);
}