import "./main.css";
import { Canvas } from "./canvas";
import { Graphics } from "./graphics/graphics";
import { ResourceLoader } from "./resource/loader";
import { Camera } from "./graphics/camera";
import { vec3 } from "gl-matrix";
import { createCanvas } from "./@util/util";
import { loadAndCreateMesh, loadAndCreateShader, loadAndCreateTexture } from "./resource/loaders";

export class Engine {
  private _canvas: Canvas;
  private _graphics: Graphics;
  private _loader: ResourceLoader;
  private _camera: Camera;
  private _flags: Internal.EngineFlags;
  private _lastFrameTime: number = 0;
  private _fpsElement: HTMLElement;
  private _debugElement: HTMLElement;
  private _frameCount: number = 0;
  private _fpsUpdateTime: number = 0;

  constructor() {
    const canvasElement = createCanvas();
    this._loader = new ResourceLoader();

    this._canvas = new Canvas(canvasElement);
    this._canvas.fullscreen();

    this._graphics = new Graphics(this._canvas);
    this._graphics.clear();
    this._camera = new Camera(45, this._canvas.canvas.width / this._canvas.canvas.height, 0.1, 100.0);
    Camera.activeCamera = this._camera;

    const dom = this.createFpsElement();// Create FPS counter element
    this._fpsElement = dom.fps;
    this._debugElement = dom.debug;

    // Initialize engine flags
    this._flags = {
      uncappedFps: false, // Default to capped FPS
      engineModules: []
    };

    this._graphics.setFlag("renderGrid", true);

  }

  public async initialize(): Promise<void> {
    this._debugElement.innerHTML = "Loading Shaders";
    //load Shaders
    await Promise.all([
      await loadAndCreateShader("shaders/uber.json", "uber", this._loader, this._graphics),
      await loadAndCreateShader("shaders/uber.json", "uberTexture", this._loader, this._graphics),
    ])

    this._graphics.getShader("uber").setFlags("config", { useLighting: true, smoothShading: false, lightingShader: true, useTextures: false });
    this._graphics.getShader("uberTexture").setFlags("config", { useLighting: true, smoothShading: false, lightingShader: true, useTextures: true });

    this._debugElement.innerHTML = "Loading Textures";
    //Load Textures
    await Promise.all([
      await await loadAndCreateTexture("textures/monkey.jpg", "texture", this._graphics),
    ])

    this._debugElement.innerHTML = "Loading Meshes";

    //Load Meshes
    await Promise.all([
      loadAndCreateMesh("meshes/monkey.json", "monkey", this._loader, this._graphics, this._graphics.getShader("uber")),
      loadAndCreateMesh("meshes/monkey.json", "monkeyTexture", this._loader, this._graphics, this._graphics.getShader("uberTexture")),
    ])


    const monkey = this._graphics.getMesh("monkey");
    monkey.setPosition(2, 0, 0);

    const monkeyTexture = this._graphics.getMesh("monkeyTexture");
    monkeyTexture.setPosition(-2, 0, 0);
    monkeyTexture.setColorTexture(this._graphics.getTexture("texture"))

    this._debugElement.innerHTML = "Done";

    await this._flags.engineModules.forEach( async (module) => {
      await module.initialize()
    });
  }

  public start(): void {
    this._graphics.setFlag("renderWireframe", false);
    this._graphics.setFlag("renderMesh", true);

    this._flags.engineModules.forEach((module) => {
      module.start(this._canvas);
    })
    
    this.update();
  }

  private update(currentTime: number = performance.now()): void {
    // Calculate delta time in seconds
    const deltaTime = this._lastFrameTime === 0 ? 0 : (currentTime - this._lastFrameTime) / 1000;
    this._lastFrameTime = currentTime;

    // Update FPS counter
    this.updateFpsCounter(deltaTime);

    this._flags.engineModules.forEach((module) => {
      module.update(deltaTime, this._camera);
    })
    
    this._graphics.clear();
    this._graphics.render();

    // Use uncapped FPS or standard 60fps cap
    if (this._flags.uncappedFps) {
      // Use setTimeout with 0 delay for maximum FPS
      setTimeout(() => this.update(performance.now()), 0);
    } else {
      // Use requestAnimationFrame (typically 60fps)
      requestAnimationFrame((time) => this.update(time));
    }
  }

  public setFlag<K extends keyof Internal.EngineFlags>(flagName: K, value: Internal.EngineFlags[K]): void {
    this._flags[flagName] = value;
  }

  public getFlag<K extends keyof Internal.EngineFlags>(flagName: K): Internal.EngineFlags[K] {
    return this._flags[flagName];
  }

  private updateFpsCounter(deltaTime: number): void {
    this._frameCount++;
    this._fpsUpdateTime += deltaTime;

    // Update FPS display every 0.5 seconds
    if (this._fpsUpdateTime >= 0.5) {
      const fps = Math.round(this._frameCount / this._fpsUpdateTime);
      this._fpsElement.textContent = `FPS: ${fps}`;
      this._frameCount = 0;
      this._fpsUpdateTime = 0;
    }
  }

  private createFpsElement() {
    const fpsElement = document.createElement('div');
    fpsElement.id = 'fps-counter';
    fpsElement.style.position = 'fixed';
    fpsElement.style.top = '10px';
    fpsElement.style.left = '10px';
    fpsElement.style.color = '#00ff00';
    fpsElement.style.fontFamily = 'monospace';
    fpsElement.style.fontSize = '16px';
    fpsElement.style.fontWeight = 'bold';
    fpsElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    fpsElement.style.padding = '5px 10px';
    fpsElement.style.borderRadius = '5px';
    fpsElement.style.zIndex = '9999';
    fpsElement.textContent = 'FPS: --';
    document.body.appendChild(fpsElement);

    const debug = document.createElement('div');
    debug.id = 'fps-counter';
    debug.style.position = 'fixed';
    debug.style.top = '30px';
    debug.style.left = '10px';
    debug.style.color = '#00ff00';
    debug.style.fontFamily = 'monospace';
    debug.style.fontSize = '16px';
    debug.style.fontWeight = 'bold';
    debug.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    debug.style.padding = '5px 10px';
    debug.style.borderRadius = '5px';
    debug.style.zIndex = '9999';
    debug.textContent = 'loading...';
    document.body.appendChild(debug);
    return { fps: fpsElement, debug: debug };
  }
}