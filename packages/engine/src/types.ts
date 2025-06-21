import { Renderer } from "./graphics/renderer";

export namespace Internal {
  export interface EngineFlags {
    debug: boolean; 
    verbose: boolean; 
    [key: string]: any;
  }

  export interface RendererFlags {
    antialias: boolean;
    shadows: boolean; 
    postProcessing: boolean; 
    [key: string]: any; 
  }

  export interface ResourceManagerFlags {
    useCache: boolean;
    cacheSize: number;
    cachePrefix: string;
    cacheMethod: "indexedDB" | "localStorage"
  }

  export interface EngineConfig {
    flags?: Partial<EngineFlags>;
    renderer?: Partial<RenderConfig>;
    resourceManager?: Partial<ResourceManagerConfig>;
    _temp: string
  }

  export interface RenderConfig {
    fullscreen: boolean;
    flags?: Partial<RendererFlags>;
  }

  export interface ResourceManagerConfig {
    flags?: Partial<ResourceManagerFlags>;
  }

  export interface EngineState {
    initialized: boolean; 
    running: boolean; 
    world?: EngineTypes.WorldData.World;
    lastUpdateTime: number; 
    deltaTime: number; 
  }

  export interface RendererState {
    canvas: HTMLCanvasElement | null;
  }

  export interface EnginePerformanceMetrics {
    frameRate: number; 
    deltaTime: number; 
    memoryUsage: number; 
  }
}

export namespace EngineTypes {
  export namespace WorldData {
    export interface GameObject {
      name: string;
      components: Components[];
      children?: GameObject[];
      parent?: GameObject;
    }

    export interface Components {
      type: string;
      gameObject: GameObject; 
      [key: string]: any; 
    }

    export interface World {
      name: string;
      gameObjects: GameObject[];
      resources: Record<string, Resource>;
    }
  }

  export enum ResourceType {
    Teture = "texture",
    Mesh = "mesh",
    JSON = "json",
  }

  export namespace ResourceSubtype {
    export enum Texture {
      PNG = "png",
      JPEG = "jpeg",
      WEBP = "webp",
    }

    export enum Mesh {
      MESH = "mesh",
    }

    export enum JSON {
      DATA = "data",
    }
  }


  export interface Resource {
    type: ResourceType;
    subtype: ResourceSubtype.Texture | ResourceSubtype.Mesh | ResourceSubtype.JSON;
    name: string;
    url: string;
  }

  export interface Game {
    name: string; 
    version: string;
    author?: string; 
    world?: WorldData.World;
    flags?: Internal.EngineFlags;
    defultWorld?: string; 
    resources: Record<string, Resource>;
  }
}
