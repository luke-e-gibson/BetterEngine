#version 300 es
precision highp float;

in vec4 aPosition;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

void main() {
    gl_Position =  uProjectionMatrix * uViewMatrix * uModelMatrix * aPosition;
}