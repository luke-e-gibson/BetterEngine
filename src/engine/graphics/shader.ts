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
  }
};