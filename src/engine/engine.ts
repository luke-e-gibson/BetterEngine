import "./main.css";
import { Canvas } from "./canvas";
import { Graphics } from "./graphics/graphics";
import { ResourceLoader } from "./resource/loader";
import { Camera } from "./graphics/camera";
import { createCanvas } from "./@util/util";
import { loadAndCreateMesh, loadAndCreateShader, loadAndCreateTexture } from "./resource/loaders";
import type RAPIER from "@dimforge/rapier3d";
import { MathUtils } from "./@util/math";
import { World } from "./physics/World";

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
  private _fpsUpdateTime: number = 0;  private _physicsWorld: World;

  // Physics-render synchronization
  private _rigidBodies: Map<string, { rb: RAPIER.RigidBody, collider: RAPIER.Collider, meshName: string }> = new Map();


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

    this._physicsWorld = new World();

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
      loadAndCreateMesh("meshes/basicmesh.json", "baiscMesh", this._loader, this._graphics, this._graphics.getShader("uber"))
    ])

    const floor = this._graphics.getMesh("baiscMesh");
    floor.setPosition(0, -1, 5);
    floor.setRotation(MathUtils.degToRad(90), 0, 0);
    floor.setScale(10, 10, 10);

      const monkey = this._graphics.getMesh("monkey");
    monkey.setPosition(2, 0, 0);
    const monkeyRb = this._physicsWorld.createRigidBody(monkey, {x: 2, y: 0, z: 0}, {x: 0, y: MathUtils.degToRad(180), z: 0, w: 1});
    this.registerRigidBody("monkey", monkeyRb, "monkey");

    const monkeyTexture = this._graphics.getMesh("monkeyTexture");
    monkeyTexture.setPosition(-2, 0, 0);
    monkeyTexture.setColorTexture(this._graphics.getTexture("texture"));
    const monkeyTextureRb = this._physicsWorld.createRigidBody(monkeyTexture, {x: -2, y: 0, z: 0}, {x: 0, y: MathUtils.degToRad(180), z: 0, w: 1});
    this.registerRigidBody("monkeyTexture", monkeyTextureRb, "monkeyTexture");

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
    this.updateFpsCounter(deltaTime);    this._flags.engineModules.forEach((module) => {
      module.update(deltaTime, this._camera);
    })
    
    // Step physics simulation with delta time
    this._physicsWorld.step(deltaTime);
    
    // Synchronize physics bodies with render meshes
    this.syncPhysicsToRender();
    
    // Render everything
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

  private syncPhysicsToRender(): void {
    // Synchronize all registered physics bodies with their corresponding render meshes
    this._rigidBodies.forEach((rigidBodyData, id) => {
      const mesh = this._graphics.getMesh(rigidBodyData.meshName);
      if (!mesh) {
        console.warn(`Mesh '${rigidBodyData.meshName}' not found for rigid body '${id}'`);
        return;
      }

      // Get position and rotation from physics body
      const translation = rigidBodyData.collider.translation();
      const rotation = rigidBodyData.rb.rotation();

      // Update mesh position
      mesh.setPosition(translation.x, translation.y, translation.z);

      // Convert quaternion to Euler angles for mesh rotation
      const eulerRotation = MathUtils.quatToEuler(rotation);
      mesh.setRotation(eulerRotation.x, eulerRotation.y, eulerRotation.z);
    });
  }

  private registerRigidBody(id: string, rigidBody: { rb: RAPIER.RigidBody, collider: RAPIER.Collider }, meshName: string): void {
    this._rigidBodies.set(id, { ...rigidBody, meshName });
  }

  public createPhysicsBodyForMesh(meshName: string, rigidBodyId?: string, position?: {x: number, y: number, z: number}, rotation?: {x: number, y: number, z: number, w: number}): void {
    const mesh = this._graphics.getMesh(meshName);
    if (!mesh) {
      throw new Error(`Mesh '${meshName}' not found`);
    }

    const id = rigidBodyId || meshName;
    const rigidBody = this._physicsWorld.createRigidBody(mesh, position, rotation);
    this.registerRigidBody(id, rigidBody, meshName);
  }

  public removePhysicsBody(id: string): void {
    const rigidBodyData = this._rigidBodies.get(id);
    if (rigidBodyData) {
      // Remove from physics world
      this._physicsWorld.removeRigidBody(rigidBodyData.rb);
      // Remove from our tracking
      this._rigidBodies.delete(id);
    }
  }

  public getPhysicsBodyInfo(id: string): { position: {x: number, y: number, z: number}, rotation: {x: number, y: number, z: number, w: number} } | null {
    const rigidBodyData = this._rigidBodies.get(id);
    if (!rigidBodyData) {
      return null;
    }

    const translation = rigidBodyData.collider.translation();
    const rotation = rigidBodyData.rb.rotation();

    return {
      position: { x: translation.x, y: translation.y, z: translation.z },
      rotation: { x: rotation.x, y: rotation.y, z: rotation.z, w: rotation.w }
    };
  }

  public createPhysicsBodyFromMeshTransform(meshName: string, rigidBodyId?: string): void {
    const mesh = this._graphics.getMesh(meshName);
    if (!mesh) {
      throw new Error(`Mesh '${meshName}' not found`);
    }

    // Get mesh transform
    const position = mesh.getPosition();
    const rotation = mesh.getRotation();
    
    // Convert Euler angles to quaternion for physics
    const quaternion = MathUtils.eulerToQuat(rotation);

    const id = rigidBodyId || meshName;
    const rigidBody = this._physicsWorld.createRigidBody(
      mesh, 
      { x: position[0], y: position[1], z: position[2] }, 
      quaternion
    );
    this.registerRigidBody(id, rigidBody, meshName);
  }
}
