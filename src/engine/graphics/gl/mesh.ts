import { mat4, vec3, vec4 } from "gl-matrix";
import type { Shader } from "./shader";
import { Graphics } from "../graphics";
import type { Texture } from "../../resource/Texture";

export class Mesh {
  private _gl: WebGL2RenderingContext;

  private _meshData: MeshData;
  private _shader: Shader;

  private buffers: Internal.MeshBuffers = Mesh.defaultBuffers();
  private matrixes: Internal.MeshMatrixes = Mesh.defaultMatrixes();
  private flags: Internal.MeshFlags = Mesh.defaultFlags();

  private colorTexture: Texture | null = null;

  constructor(meshData: MeshData, shader: Shader, gl: WebGL2RenderingContext) {
    this._meshData = meshData
    this._shader = shader;
    this._gl = gl;

    if (!this._meshData) {
      throw new Error("Mesh data must be provided");
    }

    if (!this._shader) {
      throw new Error("Shader must be provided");
    }

    this._initializeMatrixes();
    this._initializeMesh();
  }

  private _initializeMatrixes(): void {
    this.matrixes.model = mat4.create();
    mat4.identity(this.matrixes.model);
  }

  private _initializeMesh(): boolean {
    this.buffers.vao = this._gl.createVertexArray();
    this._gl.bindVertexArray(this.buffers.vao);

    if (!this._meshData.vertices) {
      throw new Error("Mesh data must contain vertices");
    }

    this.buffers.vertex = this._gl.createBuffer();
    this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this.buffers.vertex);
    this._gl.bufferData(this._gl.ARRAY_BUFFER, new Float32Array(this._meshData.vertices), this._gl.STATIC_DRAW);
    this._gl.enableVertexAttribArray(0);
    this._gl.vertexAttribPointer(0, 3, this._gl.FLOAT, false, 0, 0);

    if (this._meshData.indices) {
      this.buffers.index = this._gl.createBuffer();
      this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, this.buffers.index);
      this._gl.bufferData(this._gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this._meshData.indices), this._gl.STATIC_DRAW);
      this.flags.hasIndices = true;
    }

    if (this._meshData.normals) {
      this.buffers.normal = this._gl.createBuffer();
      this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this.buffers.normal);
      this._gl.bufferData(this._gl.ARRAY_BUFFER, new Float32Array(this._meshData.normals), this._gl.STATIC_DRAW);
      this._gl.enableVertexAttribArray(1);
      this._gl.vertexAttribPointer(1, 3, this._gl.FLOAT, false, 0, 0);
      this.flags.hasNormals = true;
    }

    if (this._meshData.uvs) {
      this.buffers.uv = this._gl.createBuffer();
      this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this.buffers.uv);
      this._gl.bufferData(this._gl.ARRAY_BUFFER, new Float32Array(this._meshData.uvs), this._gl.STATIC_DRAW);
      this._gl.enableVertexAttribArray(2);
      this._gl.vertexAttribPointer(2, 2, this._gl.FLOAT, true, 0, 0);
      this.flags.hasUvs = true;
    }

    return true;
  }

  public render(renderFlags: Internal.GraphicsFlags): void {
    if (!this.buffers.vao) {
      throw new Error("Mesh buffers not initialized");
    }

    const shaderFlags = this._shader.flags;
    this._gl.bindVertexArray(this.buffers.vao);
    this._shader.use();

    // Set uniforms for the shader
    this._shader.setUniform("uModelMatrix", this.matrixes.model);
    this._shader.setCameraUniforms();


    if (shaderFlags.config.lightingShader) {
      if (shaderFlags.config.useLighting) {
        this._shader.setUniform("uUseLighting", 1);
        this._shader.setUniform("uLightPos", vec3.fromValues(0, 5, 0));
        this._shader.setUniform("uLightColor", vec4.fromValues(1, 1, 1, 1));
        this._shader.setUniform("uModelColor", vec4.fromValues(1, 1, 1, 1));
      } else {
        this._shader.setUniform("uUseLighting", 0); // Disable lighting
        this._shader.setUniform("uModelColor", vec4.fromValues(1, 1, 1, 1)); // Default color
      }

      if (shaderFlags.config.smoothShading) {
        this._shader.setUniform("smoothShading", 1); // Smooth shading
      }
    }

    if(shaderFlags.config.useTextures) {
      if (!this.colorTexture) {
        throw new Error("Color texture must be set when using textures");
      }
      this.colorTexture.bind();
      this._shader.setUniform("uUseTexture", 1);
      this._shader.setUniform("uTexture", 0); // Assuming texture is bound to unit 0
    }

    if (renderFlags.renderMesh) {
      if (this.flags.hasIndices) {
        this._gl.drawElements(this._gl.TRIANGLES, this._meshData.indices!.length, this._gl.UNSIGNED_SHORT, 0);
      } else {
        this._gl.drawArrays(this._gl.TRIANGLES, 0, this._meshData.vertices.length / 3);
      }
    }

    if (renderFlags.renderWireframe) {
      Graphics.current.getShader("wireframe").use();
      Graphics.current.getShader("wireframe").setUniform("uModelMatrix", this.matrixes.model);
      Graphics.current.getShader("wireframe").setCameraUniforms();
      this._gl.drawElements(this._gl.LINE_LOOP, this._meshData.indices!.length, this._gl.UNSIGNED_SHORT, 0)
    }

    this._gl.bindVertexArray(null);
  }

  public setPosition(x: number, y: number, z: number): void {
    mat4.translate(this.matrixes.model, this.matrixes.model, [x, y, z]);
  }

  public setColorTexture(texture: Texture): void {
    this.colorTexture = texture;
  }

  private static defaultFlags(): Internal.MeshFlags {
    return {
      hasNormals: false,
      hasUvs: false,
      hasIndices: false
    };
  }

  private static defaultBuffers(): Internal.MeshBuffers {
    return {
      vertex: null,
      index: null,
      normal: null,
      uv: null,
      vao: null
    };
  }

  private static defaultMatrixes(): Internal.MeshMatrixes {
    return {
      model: mat4.identity(mat4.create()),
    };
  }
}