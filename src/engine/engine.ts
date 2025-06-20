import "./main.css";
import { Canvas } from "./canvas";
import { Graphics } from "./graphics/graphics";
import { ResourceLoader } from "./resource/loader";
import { Camera } from "./camera";
import { vec3 } from "gl-matrix";
import { Grid } from "./graphics/grid";
import { Texture } from "./resource/Texture";

function createCanvas(id = "game-canvas"): HTMLCanvasElement {
  let canvas = document.getElementById(id) as HTMLCanvasElement;
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.id = id;
    document.body.appendChild(canvas);
  }
  return canvas;
}


export class Engine {
  private _canvas: Canvas;
  private _graphics: Graphics;
  private _loader: ResourceLoader;
  private _camera: Camera;
  private _fpsCamera: Internal.FpsCamera;
  private _lastFrameTime: number = 0;
  private _fpsElement: HTMLElement;
  private _frameCount: number = 0;
  private _fpsUpdateTime: number = 0;
  private _grid: Grid | null = null;
  private _flags: Internal.EngineFlags;

  constructor() {
    const canvasElement = createCanvas();
    this._loader = new ResourceLoader();

    this._canvas = new Canvas(canvasElement);
    this._canvas.fullscreen();

    this._graphics = new Graphics(this._canvas);
    this._graphics.clear(); 
    this._camera = new Camera(45, this._canvas.canvas.width / this._canvas.canvas.height, 0.1, 100.0);
    Camera.activeCamera = this._camera;    // Create FPS counter element
    this._fpsElement = this.createFpsElement();

    // Initialize engine flags
    this._flags = {
      uncappedFps: false, // Default to capped FPS
    };

    // Initialize FPS camera state
    this._fpsCamera = {
      position: {
        x: -7.4,
        y: 4,
        z: 5.5,
      }, rotation: {
        x: 0.8619999885559082, // Yaw
        y: 0.36800000071525574, // Pitch
      },
      mouseSensitivity: 0.002,
      moveSpeed: 5.0, // units per second
      keyboard: {
        w: false,
        a: false,
        s: false,
        d: false,
        q: false,
        e: false,
      }
    };
  }

  public async initialize(): Promise<void> {
    await this._graphics.initialize();
    this._loader.loadResource<Texture>("texture", new Texture(this._graphics.gl, "textures/monkey.jpg")),

    await Promise.all([
      this._loader.loadResourceAsync<ShaderFile>("uber", fetch("shaders/uber.json").then(res => res.json())),
      this._loader.loadResourceAsync<ShaderFile>("gird", fetch("shaders/grid.json").then(res => res.json())),

      this._loader.loadResourceAsync<MeshFile>("model", fetch("meshes/basicmesh.json").then(res => res.json())),
      this._loader.loadResourceAsync<MeshFile>("monkey", fetch("meshes/monkey.json").then(res => res.json())),
      this._loader.loadResourceAsync<MeshFile>("cube", fetch("meshes/cube.json").then(res => res.json())),
      this._loader.getResource<Texture>("texture").load()
    ]);

    // Create shaders in parallel
    await Promise.all([
      this._graphics.createShader(this._loader.getResource<ShaderFile>("uber"), "uber"),
      this._graphics.createShader(this._loader.getResource<ShaderFile>("uber"), "uberTexture"),
      this._graphics.createShader(this._loader.getResource<ShaderFile>("gird"), "gird")
    ]);

    const lightColor = this._graphics.getShader("uber").setFlags("config", { useLighting: true, smoothShading: false, lightingShader: true, useTextures: false });
    const lightingTexture = this._graphics.getShader("uberTexture").setFlags("config", { useLighting: true, smoothShading: false, lightingShader: true, useTextures: true });


    await Promise.all([
      this._graphics.createMesh(this._loader.getResource<MeshFile>("monkey"), lightingTexture, "monkey"),
    ]);

    this._grid = new Grid(this._graphics.getShader("gird"), this._graphics.gl)

    const lightingShader = this._graphics.getShader("uber");
    const cubesPerRow = 2;
    const cubesPerCol = 2;
    const cubesPerDepth = 2; // Add depth
    const spacing = 5;
    const depthSpacing = 5; // Spacing between cubes in depth
    const offsetX = -((cubesPerRow - 1) * spacing) / 2;
    const offsetY = -((cubesPerCol - 1) * spacing) / 2;
    const offsetZ = -5 - ((cubesPerDepth - 1) * depthSpacing) / 2; // Center depth

    for (let i = 0; i < cubesPerRow; i++) {
      for (let j = 0; j < cubesPerCol; j++) {
        for (let k = 0; k < cubesPerDepth; k++) {
          const name = `cube_${i}_${j}_${k}`;
          const { mesh } = this._graphics.createMesh(
            this._loader.getResource<MeshFile>("monkey"),
            lightingShader,
            name
          );
          mesh.setPosition(
            offsetX + i * spacing,
            offsetY + j * spacing,
            offsetZ - k * depthSpacing
          );
        }
      }
    }

  }

  public start(): void {
    let mesh = this._graphics.getMesh("monkey");
    if (!mesh) throw new Error("Mesh not found");
    mesh.setPosition(2, 0, -5);

    this._graphics.setFlag("renderWireframe", false);
    this._graphics.setFlag("renderMesh", true);

    // Initialize FPS camera controls
    this.initFpsCamera();

    this.update();
  }

  private initFpsCamera(): void {
    const canvas = this._canvas.canvas;

    window.addEventListener("keydown", (event) => {
      event.preventDefault(); // Prevent default actions like scrolling
      switch (event.key) {
        case "w":
          this._fpsCamera.keyboard.w = true;
          break;
        case "a":
          this._fpsCamera.keyboard.a = true;
          break;
        case "s":
          this._fpsCamera.keyboard.s = true;
          break;
        case "d":
          this._fpsCamera.keyboard.d = true;
          break;
        case "q":
          this._fpsCamera.keyboard.q = true;
          break;
        case "e":
          this._fpsCamera.keyboard.e = true;
          break; case "Control":
          this._fpsCamera.moveSpeed = 20;
          event.preventDefault(); // Prevent browser shortcuts like Ctrl+W
          break;
        default:
          break;
      }
    });

    window.addEventListener("keyup", (event) => {
      switch (event.key) {
        case "w":
          this._fpsCamera.keyboard.w = false;
          break;
        case "a":
          this._fpsCamera.keyboard.a = false;
          break;
        case "s":
          this._fpsCamera.keyboard.s = false;
          break;
        case "d":
          this._fpsCamera.keyboard.d = false;
          break;
        case "q":
          this._fpsCamera.keyboard.q = false;
          break;
        case "e":
          this._fpsCamera.keyboard.e = false;
          break; case "Control":
          this._fpsCamera.moveSpeed = 5;
          event.preventDefault(); // Prevent browser shortcuts
          break;
        default:
          break;
      }
    });

    // Prevent common browser shortcuts that might interfere with the game
    window.addEventListener("keydown", (event) => {
      // Prevent browser shortcuts when pointer is locked (game is active)
      if (document.pointerLockElement === canvas) {
        // Prevent common shortcuts
        if (event.ctrlKey || event.metaKey) {
          // Prevent Ctrl+W (close tab), Ctrl+R (refresh), etc.
          switch (event.key.toLowerCase()) {
            case 'w':
            case 'r':
            case 't':
            case 'n':
            case 'shift':
            case 'f4':
            case 'f5':
              event.preventDefault();
              break;
          }
        }

        // Prevent F5 refresh and other function keys
        if (event.key === 'F5' || event.key === 'F11' || event.key === 'F12') {
          event.preventDefault();
        }
      }
    });

    // Add extra protection against accidental page closing
    window.addEventListener("beforeunload", (event) => {
      // Only show confirmation if pointer is locked (game is active)
      if (document.pointerLockElement === canvas) {
        event.preventDefault();
        event.returnValue = ''; // Chrome requires returnValue to be set
        return ''; // Legacy browsers
      }
    });

    window.addEventListener("mousemove", (event) => {
      if (document.pointerLockElement === canvas) {
        this._fpsCamera.rotation.x += event.movementX * this._fpsCamera.mouseSensitivity; // Yaw
        this._fpsCamera.rotation.y += event.movementY * this._fpsCamera.mouseSensitivity; // Pitch

        // Clamp pitch to avoid flipping upside down
        this._fpsCamera.rotation.y = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this._fpsCamera.rotation.y));
      }
    });

    canvas.addEventListener("mousedown", () => {
      canvas.requestPointerLock().catch(err => {
        console.error("Pointer lock failed:", err);
      });
    });
  }

  private updateFpsCamera(deltaTime: number): void {
    const yaw = this._fpsCamera.rotation.x;
    const pitch = this._fpsCamera.rotation.y;

    // Calculate the forward vector based on yaw and pitch
    const forwardX = Math.sin(yaw) * Math.cos(pitch);
    const forwardY = -Math.sin(pitch);
    const forwardZ = -Math.cos(yaw) * Math.cos(pitch);

    // Calculate the right vector (perpendicular to forward and world up)
    const rightX = Math.cos(yaw);
    const rightZ = Math.sin(yaw); if (this._fpsCamera.keyboard.w) { // Forward
      this._fpsCamera.position.x += forwardX * this._fpsCamera.moveSpeed * deltaTime;
      this._fpsCamera.position.y += forwardY * this._fpsCamera.moveSpeed * deltaTime;
      this._fpsCamera.position.z += forwardZ * this._fpsCamera.moveSpeed * deltaTime;
    }

    if (this._fpsCamera.keyboard.s) { // Backward
      this._fpsCamera.position.x -= forwardX * this._fpsCamera.moveSpeed * deltaTime;
      this._fpsCamera.position.y -= forwardY * this._fpsCamera.moveSpeed * deltaTime;
      this._fpsCamera.position.z -= forwardZ * this._fpsCamera.moveSpeed * deltaTime;
    }

    if (this._fpsCamera.keyboard.a) { // Left strafe
      this._fpsCamera.position.x -= rightX * this._fpsCamera.moveSpeed * deltaTime;
      this._fpsCamera.position.z -= rightZ * this._fpsCamera.moveSpeed * deltaTime;
    }

    if (this._fpsCamera.keyboard.d) { // Right strafe
      this._fpsCamera.position.x += rightX * this._fpsCamera.moveSpeed * deltaTime;
      this._fpsCamera.position.z += rightZ * this._fpsCamera.moveSpeed * deltaTime;
    }

    if (this._fpsCamera.keyboard.q) { // Down
      this._fpsCamera.position.y -= this._fpsCamera.moveSpeed * deltaTime;
    }

    if (this._fpsCamera.keyboard.e) { // Up
      this._fpsCamera.position.y += this._fpsCamera.moveSpeed * deltaTime;
    }

    // Update camera position and rotation
    this._camera.position = [this._fpsCamera.position.x, this._fpsCamera.position.y, this._fpsCamera.position.z] as vec3;
    this._camera.rotation = [this._fpsCamera.rotation.y, this._fpsCamera.rotation.x, 0] as vec3; // [pitch, yaw, roll]
  }
  private update(currentTime: number = performance.now()): void {
    // Calculate delta time in seconds
    const deltaTime = this._lastFrameTime === 0 ? 0 : (currentTime - this._lastFrameTime) / 1000;
    this._lastFrameTime = currentTime;

    // Update FPS counter
    this.updateFpsCounter(deltaTime);

    this.updateFpsCamera(deltaTime);
    this._graphics.clear();
    this._loader.getResource<Texture>("texture").bind(0);
    this._grid?.render();
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

  private createFpsElement(): HTMLElement {
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
    return fpsElement;
  }
}