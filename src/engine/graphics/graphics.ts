import type { Canvas } from "../canvas";
import { Mesh } from "./mesh";
import { Shader, shaderSources } from "./shader";

export class Graphics {
  public static current: Graphics; 
  private _gl: WebGL2RenderingContext;
  private _canvas: Canvas;
  
  private _shaders: Map<string, Shader> = new Map();
  private _meshes: Map<Internal.Shaders, Internal.MeshWithFlags> = new Map();
  
  private _flags: Internal.GraphicsFlags = Graphics.defaultFlags();

  constructor(context: Canvas) {
    this._canvas = context;
    this._gl = context.context;
    if (!this._gl) {
      throw new Error("WebGL2 context not available");
    }
    this._logGpuInfo()
    this._createBuiltinShader();
    this._gl.clearColor(0, 0, 0, 1);
    
    //Depth test
    this._gl.enable(this._gl.DEPTH_TEST);
    this._gl.depthFunc(this._gl.LESS);

    //blending
    this._gl.enable(this._gl.BLEND);
    this._gl.blendFunc(this._gl.SRC_ALPHA, this._gl.ONE_MINUS_SRC_ALPHA);
    Graphics.current = this;

    //Anti-aliasing
    this._gl.enable(this._gl.SAMPLE_COVERAGE);
    this._gl.sampleCoverage(1.0, false);

  }

  private _logGpuInfo() {
    const debugInfo = this._gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const vendor = this._gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      const renderer = this._gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      console.log(`GPU Vendor: ${vendor}`);
      console.log(`GPU Renderer: ${renderer}`);
    } else {
      console.warn("WEBGL_debug_renderer_info extension not supported");
    }
  }

  private _createBuiltinShader() {
    this._createShader(shaderSources.wireframe, "wireframe");
  }

  private _createShader(shaderFile: ShaderFile, name?: string, flags: Internal.ShaderFlags = Shader.defaultFlags()): { shader: Shader; name: string } {
    console.log(`Creating shader: ${name || shaderFile.name}`);
    const shader = new Shader(this._gl, shaderFile.content.vertex, shaderFile.content.fragment);
    shader.flags = flags;
    this._shaders.set(name || shaderFile.name, shader);
    return { shader, name: name || shaderFile.name };
  }

  private _createMesh(meshFile: MeshFile, shader: Shader, name?: string) {
    const meshData: MeshData = {
      vertices: meshFile.content.vertices,
      indices: meshFile.content.indices || [],
      normals: meshFile.content.normals || [],
      uvs: meshFile.content.uvs || [],
    };
    // Check if indices, normals, and uvs are present, otherwise omit them from meshData
    const mesh = new Mesh(meshData, shader, this._gl);

    this._meshes.set(name || meshFile.name, { mesh, flags: { isVisible: true } });
    return { mesh, name: name || meshFile.name };
  }

  public clear(): void {
    this._gl.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT);
  }

  public async initialize(): Promise<void> {
    
  }

  public createShader(shaderFile: ShaderFile, name?: string, flags: Internal.ShaderFlags = Shader.defaultFlags()): { shader: Shader; name: string } {
    return this._createShader(shaderFile, name, flags);
  }

  public createMesh(meshFile: MeshFile, shader: Shader, name?: string): { mesh: Mesh; name: string } {
    return this._createMesh(meshFile, shader, name);
  }

  public getShader(name: string): Shader {
    return this._shaders.get(name) as Shader;
  }

  public render(): void {
    this._meshes.forEach((mesh) => {
      if(mesh.flags.isVisible) {
        mesh.mesh.render(this._flags);
      }
    });
  }

  public getMesh(arg0: string) {
    return this._meshes.get(arg0)?.mesh || null;
  }

  public setFlag(flag: keyof Internal.GraphicsFlags, value: any): void {
    if (this._flags.hasOwnProperty(flag)) {
      this._flags[flag] = value;
    } else {
      throw new Error(`Flag ${flag} does not exist in GraphicsFlags`);
    }
  }

  private static defaultFlags(): Internal.GraphicsFlags {
    return {
      renderWireframe: false,
      renderMesh: true,
    };
  }

  public get gl() {
    return this._gl;
  }

}