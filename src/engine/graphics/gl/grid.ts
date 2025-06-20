import type { Shader } from "./shader";

export class Grid {
  private _shader: Shader;
  private _gl: WebGL2RenderingContext;

  constructor(shader: Shader, gl: WebGL2RenderingContext) {
    this._shader = shader;
    this._gl = gl;
  }

  public render() {
    this._shader.use();
    this._shader.setCameraUniforms();

    // Draw a flat plane (2 triangles forming a quad)
    this._gl.drawArrays(this._gl.TRIANGLE_STRIP, 0, 8);
  }
}