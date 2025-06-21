declare namespace Internal {
  export interface EngineFlags {
    debug: boolean; // Enable or disable debug mode
    verbose: boolean; // Enable or disable verbose logging
  }

  export interface EngineConfig {
    flags: EngineFlags; // Configuration flags for the engine
    world: Engine.World.World | string;
    resources: any; // Resources used by the engine (e.g., assets, configurations)
  }
}

declare namespace Engine {
  namespace World {
    export interface GameObject {
      components: Components[];
      children: GameObject[];
      parent?: GameObject;
    }

    export interface Components {
      type: string;
      gameObject: GameObject; // Reference to the GameObject this component belongs to
      [key: string]: any; // Additional properties for the component
    }

    export interface World {
      name: string;
      gameObjects: GameObject[];
    }
  }

  export interface Game {
    title: string;
    author: string;
    version: string;
    worlds: World.World[]; // List of worlds in the game
    resources: any; // TODO: Define a more specific type for resources
  }
}