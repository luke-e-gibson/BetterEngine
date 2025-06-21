namespace Internal {
  export interface EngineFlags {
    debug: boolean; // Enable or disable debug mode
    verbose: boolean; // Enable or disable verbose logging
  }
}

namespace Engine.World {
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