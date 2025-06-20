import { mat4, vec2, vec3, vec4 } from "gl-matrix";
import { Camera } from "../camera";

export class Shader {
  private _gl: WebGL2RenderingContext;
  private _program: WebGLProgram;
  private _flags: Internal.ShaderFlags = Shader.defaultFlags();

  constructor(gl: WebGL2RenderingContext, vertexShaderSource: string, fragmentShaderSource: string) {
    this._gl = gl;
    this._program = this._createProgram(vertexShaderSource, fragmentShaderSource);
  }

  private _createShader(type: number, source: string): WebGLShader {
    const shader = this._gl.createShader(type);
    if (!shader) {
      throw new Error('Failed to create shader');
    }
    this._gl.shaderSource(shader, source);
    this._gl.compileShader(shader);

    if (!this._gl.getShaderParameter(shader, this._gl.COMPILE_STATUS)) {
      const info = this._gl.getShaderInfoLog(shader);
      this._gl.deleteShader(shader);
      throw new Error(`Error compiling shader: ${info}`);
    }

    return shader;
  }

  private _createProgram(vertexShaderSource: string, fragmentShaderSource: string): WebGLProgram {
    const vertexShader = this._createShader(this._gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = this._createShader(this._gl.FRAGMENT_SHADER, fragmentShaderSource);

    const program = this._gl.createProgram();
    if (!program) {
      throw new Error('Failed to create program');
    }

    this._gl.attachShader(program, vertexShader);
    this._gl.attachShader(program, fragmentShader);
    this._gl.linkProgram(program);

    if (!this._gl.getProgramParameter(program, this._gl.LINK_STATUS)) {
      const info = this._gl.getProgramInfoLog(program);
      this._gl.deleteProgram(program);
      throw new Error(`Error linking program: ${info}`);
    }

    this._gl.deleteShader(vertexShader);
    this._gl.deleteShader(fragmentShader);

    return program;
  }

  public use() {
    this._gl.useProgram(this._program);
  }

  public setCameraUniforms() {
    const camera = Camera.activeCamera;
    if (!camera) {
      throw new Error("No active camera set");
    }

    const viewMatrix = camera.cameraMatrixes.view;
    const projectionMatrix = camera.cameraMatrixes.projection;

    this.setUniform("uViewMatrix", viewMatrix);
    this.setUniform("uProjectionMatrix", projectionMatrix);

  }

  public get flags(): Internal.ShaderFlags {
    return this._flags;
  }

  public setFlags(flag: keyof Internal.ShaderFlags, value: any) {
    if (this._flags.hasOwnProperty(flag)) {
      this._flags[flag] = value;
    } else {
      throw new Error(`Flag ${flag} does not exist in ShaderFlags`);
    }
    return this
  }

  public set flags(flags: Internal.ShaderFlags) {
    this._flags = { ...this._flags, ...flags };
  }

  public static defaultFlags(): Internal.ShaderFlags {
    return {
      config: {}
    }
  }

  public setUniform(name: string, value: number): void;
  public setUniform(name: string, value: vec2): void;
  public setUniform(name: string, value: vec3): void;
  public setUniform(name: string, value: vec4): void;
  public setUniform(name: string, value: mat4): void;
  public setUniform(name: string, value: boolean): void;
  public setUniform(name: string, value: Int32Array): void;
  public setUniform(name: string, value: number | vec2 | vec3 | vec4 | mat4 | boolean | Int32Array): void {
    const location = this._gl.getUniformLocation(this._program, name);
    if (location === null) {
      throw new Error(`Uniform ${name} not found in shader program`);
    }

    // Handle primitives first
    if (typeof value === 'number') {
      this._gl.uniform1f(location, value);
      return;
    }

    if (typeof value === 'boolean') {
      this._gl.uniform1i(location, value ? 1 : 0);
      return;
    }

    // Handle typed arrays
    if (value instanceof Int32Array) {
      if (value.length === 1) {
        this._gl.uniform1iv(location, value);
      } else {
        throw new Error(`Unsupported Int32Array uniform length ${value.length} for ${name}`);
      }
      return;
    }

    if (value instanceof Float32Array) {
      switch (value.length) {
        case 1:
          this._gl.uniform1fv(location, value);
          break;
        case 2:
          this._gl.uniform2fv(location, value);
          break;
        case 3:
          this._gl.uniform3fv(location, value);
          break;
        case 4:
          this._gl.uniform4fv(location, value);
          break;
        case 9:
          this._gl.uniformMatrix3fv(location, false, value);
          break;
        case 16:
          this._gl.uniformMatrix4fv(location, false, value);
          break;
        default:
          throw new Error(`Unsupported Float32Array uniform length ${value.length} for ${name}`);
      }
      return;
    }

    throw new Error(`Unsupported uniform type for ${name}: ${typeof value}`);
  }

}

export const shaderSources = {
  wireframe: {
    "name": "WireFrame",
    "content": {
      "vertex": "attribute vec4 a_position;\r\n\r\nuniform mat4 uModelMatrix;\r\nuniform mat4 uViewMatrix;\r\nuniform mat4 uProjectionMatrix;\r\n\r\nvoid main() {\r\n    gl_Position =  uProjectionMatrix * uViewMatrix * uModelMatrix * a_position;\r\n}",
      "fragment": "precision mediump float;\r\n\r\nvoid main() {\r\n  gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0); // Set the fragment color to white\r\n}"
    }
  },
  grid: {"name":"Basic","content":{"vertex":"#version 300 es\r\nprecision highp float;\r\n\r\nin vec4 aPosition;\r\n\r\nuniform mat4 uViewMatrix;\r\nuniform mat4 uProjectionMatrix;\r\nuniform float uNear; // 0.01\r\nuniform float uFar;  // 100.0\r\n\r\n// Outputs to fragment shader\r\nout float near;\r\nout float far;\r\nout vec3 nearPoint;\r\nout vec3 farPoint;\r\nout mat4 fragView;\r\nout mat4 fragProj;\r\n\r\nvec3 gridPlane[6] = vec3[](\r\n    // First triangle\r\n    vec3(-1, -1, 0), vec3(1, -1, 0), vec3(-1, 1, 0),\r\n    // Second triangle  \r\n    vec3(-1, 1, 0), vec3(1, -1, 0), vec3(1, 1, 0)\r\n);\r\n\r\nvec3 UnprojectPoint(float x, float y, float z, mat4 view, mat4 projection) {\r\n    mat4 viewInv = inverse(view);\r\n    mat4 projInv = inverse(projection);\r\n    vec4 unprojectedPoint = viewInv * projInv * vec4(x, y, z, 1.0);\r\n    return unprojectedPoint.xyz / unprojectedPoint.w;\r\n}\r\n\r\nvoid main() {\r\n    vec3 p = gridPlane[gl_VertexID].xyz;\r\n    \r\n    // Pass uniforms to fragment shader\r\n    near = uNear;\r\n    far = uFar;\r\n    fragView = uViewMatrix;\r\n    fragProj = uProjectionMatrix;\r\n    \r\n    // Calculate near and far points\r\n    nearPoint = UnprojectPoint(p.x, p.y, 0.0, uViewMatrix, uProjectionMatrix).xyz; // unprojecting on the near plane\r\n    farPoint = UnprojectPoint(p.x, p.y, 1.0, uViewMatrix, uProjectionMatrix).xyz; // unprojecting on the far plane\r\n    \r\n    gl_Position = vec4(p, 1.0); // using directly the clipped coordinates\r\n}","fragment":"#version 300 es\r\nprecision highp float;\r\n\r\n// WebGL2 inputs (from vertex shader)\r\nin float near; //0.01\r\nin float far; //100\r\nin vec3 nearPoint;\r\nin vec3 farPoint;\r\nin mat4 fragView;\r\nin mat4 fragProj;\r\n\r\n// WebGL2 output\r\nout vec4 outColor;\r\n\r\nvec4 grid(vec3 fragPos3D, float scale, bool drawAxis) {\r\n    vec2 coord = fragPos3D.xz * scale;\r\n    vec2 derivative = fwidth(coord);\r\n    vec2 grid = abs(fract(coord - 0.5) - 0.5) / derivative;\r\n    float line = min(grid.x, grid.y);\r\n    float minimumz = min(derivative.y, 1.0);\r\n    float minimumx = min(derivative.x, 1.0);\r\n    vec4 color = vec4(0.2, 0.2, 0.2, 1.0 - min(line, 1.0));\r\n    // z axis\r\n    if(fragPos3D.x > -0.1 * minimumx && fragPos3D.x < 0.1 * minimumx)\r\n        color.z = 1.0;\r\n    // x axis\r\n    if(fragPos3D.z > -0.1 * minimumz && fragPos3D.z < 0.1 * minimumz)\r\n        color.x = 1.0;\r\n    return color;\r\n}\r\n\r\nfloat computeDepth(vec3 pos) {\r\n    vec4 clip_space_pos = fragProj * fragView * vec4(pos.xyz, 1.0);\r\n    // Normalize from [-1, 1] to [0, 1] for depth buffer\r\n    return ((clip_space_pos.z / clip_space_pos.w) + 1.0) * 0.5;\r\n}\r\n\r\nfloat computeLinearDepth(vec3 pos) {\r\n    vec4 clip_space_pos = fragProj * fragView * vec4(pos.xyz, 1.0);\r\n    float clip_space_depth = (clip_space_pos.z / clip_space_pos.w) * 2.0 - 1.0; // put back between -1 and 1\r\n    float linearDepth = (2.0 * near * far) / (far + near - clip_space_depth * (far - near)); // get linear value between 0.01 and 100\r\n    return linearDepth / far; // normalize\r\n}\r\n\r\nvoid main() {\r\n    float t = -nearPoint.y / (farPoint.y - nearPoint.y);\r\n    \r\n    // Only render fragments that intersect the ground plane (y=0)\r\n    if (t <= 0.0) {\r\n        discard; // Ray doesn't hit the ground plane\r\n    }\r\n    \r\n    vec3 fragPos3D = nearPoint + t * (farPoint - nearPoint);\r\n    \r\n    // Set proper depth to avoid overlapping with other meshes\r\n    gl_FragDepth = computeDepth(fragPos3D);\r\n    \r\n    // Simple grid calculation\r\n    vec2 coord = fragPos3D.xz; // Use X and Z coordinates for ground plane\r\n    vec2 derivative = fwidth(coord);\r\n    vec2 grid = abs(fract(coord - 0.5) - 0.5) / derivative;\r\n    float line = min(grid.x, grid.y);\r\n    \r\n    // Create grid lines with better alpha handling to prevent overlap brightness\r\n    float gridAlpha = 1.0 - min(line, 1.0);\r\n    vec4 color = vec4(0.2, 0.2, 0.2, gridAlpha);\r\n    \r\n    // Add colored axes\r\n    float minimumz = min(derivative.y, 1.0);\r\n    float minimumx = min(derivative.x, 1.0);\r\n    \r\n    // Z axis (blue)\r\n    if(fragPos3D.x > -0.1 * minimumx && fragPos3D.x < 0.1 * minimumx)\r\n        color.z = 1.0;\r\n    // X axis (red)\r\n    if(fragPos3D.z > -0.1 * minimumz && fragPos3D.z < 0.1 * minimumz)\r\n        color.x = 1.0;\r\n    \r\n    // Simple distance-based fading\r\n    float dist = length(fragPos3D);\r\n    float fade = 1.0 - clamp(dist / 50.0, 0.0, 1.0);\r\n    color.a *= fade;\r\n    \r\n    // Clamp alpha to prevent over-bright areas from overlapping triangles\r\n    color.a = clamp(color.a, 0.0, 0.8);\r\n    \r\n    // Discard if too transparent\r\n    if (color.a < 0.05) {\r\n        discard;\r\n    }\r\n    \r\n    outColor = color;\r\n}\r\n"}}
};