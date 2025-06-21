export class Engine {
  private config: Internal.EngineConfig;
  private world: Engine.World.World | null = null;

  constructor(config: Partial<Internal.EngineConfig>) {
    this.config = {
      ...Engine.defaultConfig(),
      ...config,
    }


  }

  public async initialize(): Promise<void> {
    if(this.config.world) {
      if (typeof this.config.world === "string") {
        const response = await fetch(this.config.world);
        if (!response.ok) {
          throw new Error(`Failed to load world: ${response.statusText}`);
        }
        const worldData = await response.json();
        this.world = worldData as Engine.World.World;
      } else {
        // Use the provided world object directly
        this.world = this.config.world;
      }
    }
  }

  public start(): void {

  }

  private update(): void {

  }

  private static defaultConfig(): Internal.EngineConfig {
    return {
      flags: {
        debug: false, // Default to not debugging
        verbose: false, // Default to not verbose logging
      },
      world: "/game/world.json", // Default world name
      resources: {}, // Empty resources by default
    }
  }
}