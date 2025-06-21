import { Renderer } from "./graphics/renderer";
import { ResourceManager } from "./resource/ResourceManager";
import { EngineTypes, Internal } from "./types";
import { makeRecordIterable } from "./util/util";

export class Engine {
  private _flags: Internal.EngineFlags = this._defaultFlags();
  private _state: Internal.EngineState = this._defaultState();
  private _performanceMetrics: Internal.EnginePerformanceMetrics = this._defaultPerformanceMetrics();

  private renderer: Renderer;
  private resources: ResourceManager;

  constructor(config: Partial<Internal.EngineConfig> = {}) {
    this._flags = { ...this._flags, ...config.flags, worldUrl: config._temp || "" };
    this.renderer = new Renderer({fullscreen: true, ...config.renderer });
    this.resources = new ResourceManager({ ...config.resourceManager });
  
  }

  public async initialize(): Promise<void> {
    this.renderer.initialize();

    const worldUrl = this._flags.worldUrl;
    if (!worldUrl) {
      throw new Error("World URL must be provided in the configuration.");
    }
    
    await this._loadWorld(worldUrl);
    
    if (this._flags.debug) {
      console.log("World loaded:", this._state.world?.name);
    }

    this._state.initialized = true;
  }

  public start(): void {
    this._state.running = true;
    this._state.lastUpdateTime = Date.now();
    this.update();
  }

  private update(): void {
    if (!this._state.running) {
      return;
    }

    const now = Date.now();
    this._state.deltaTime = now - this._state.lastUpdateTime;
    this._state.lastUpdateTime = now;

    // Update logic goes here
    
    if(this._flags.debug) {
      this._performanceMetrics.deltaTime = this._state.deltaTime;
      this._performanceMetrics.frameRate = 1000 / this._state.deltaTime;
      this._performanceMetrics.memoryUsage = (performance as any).memory?.usedJSHeapSize ?? 0;
    }

    // Schedule the next update
    requestAnimationFrame(() => this.update());
  }

  private async _loadWorld(url: string): Promise<void> {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to load world from ${url}: ${res.statusText}`);
    }

    const worldData: EngineTypes.WorldData.World = await res.json();
    this._state.world = worldData;
    
    this._state.world.gameObjects.forEach((gameObject) => {
      gameObject.components.forEach((component) => {
        component.gameObject = gameObject; // Set the reference to the GameObject
      });
    })

    this._state.world.gameObjects.forEach((gameObject) => {
      gameObject.children?.forEach((child) => {
        child.parent = gameObject; // Set the parent reference for children
      });
    })

    this.resources.loadResources(worldData.resources || {});

    if (this._flags.verbose) {
      console.log(`World loaded: ${worldData.name}`);
    }
  }

  private _defaultFlags(): Internal.EngineFlags {
    return {
      debug: false,
      verbose: false,
    };
  }

  private _defaultState(): Internal.EngineState {
    return {
      initialized: false,
      running: false,
      world: undefined,
      lastUpdateTime: Date.now(),
      deltaTime: 0,
    };
  }

  private _defaultPerformanceMetrics(): Internal.EnginePerformanceMetrics {
    return {
      frameRate: 0,
      deltaTime: 0,
      memoryUsage: 0,
    };
  }
}

// Re-export types for consumers
export * from "./types";