import { Internal } from "../types";

export class Renderer {
  private static _instance: Renderer | null = null;
  private _flags: Internal.RendererFlags = Renderer._defaultFlags();
  private _config: Internal.RenderConfig = Renderer._defaultConfig();
  private _state: Internal.RendererState = Renderer._defaultState();

  private gl: WebGL2RenderingContext;

  constructor(config: Partial<Internal.RenderConfig>) {
    if (Renderer._instance) {
      throw new Error("Renderer instance already exists. Use Renderer.getInstance() instead.");
    }
    this._config = { ...this._config, ...config };
    this._flags = { ...this._flags, ...this._config.flags };
    Renderer._instance = this;
  
    if (this._config.fullscreen) {
      this._setupFullscreen();
    } else {
      console.warn("Fullscreen mode is disabled. Some features may not work as expected.");
    }

    const canvas = this._state.canvas;
    if (!canvas) {
      throw new Error("Canvas not initialized. Ensure fullscreen mode is enabled or manually set up the canvas.");
    }

    this.gl = canvas.getContext("webgl2") as WebGL2RenderingContext;
    if (!this.gl) {
      throw new Error("WebGL2 context not available. Ensure your browser supports WebGL2.");
    }
 
  }

  public async initialize(): Promise<void> {
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0); // Set clear color to black
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT); // Clear the canvas
  }

  private _setupFullscreen(): void {
    const canvas = document.createElement("canvas");
    canvas.id = "gameCanvas";
    document.body.appendChild(canvas);
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";

    // Set the canvas to fill the entire viewport
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    this._state.canvas = canvas;
  }

  public static getInstance(): Renderer {
    if (!Renderer._instance) {
      throw new Error("Renderer instance not created. Please create an instance first.");
    }
    return Renderer._instance;
  }

  private static _defaultFlags(): Internal.RendererFlags {
    return {
      antialias: true,
      shadows: false,
      postProcessing: false,
    };
  }

  private static _defaultConfig(): Internal.RenderConfig {
    return {
      fullscreen: true,
    };
  }

  private static _defaultState(): Internal.RendererState {
    return {
      canvas: null,
    };
  }
}