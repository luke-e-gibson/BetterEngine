import { EngineTypes, Internal } from "../types";

export class ResourceManager {
  private _resources: Record<string, any> = {};     // TODO: Create resource class that can be extended for different resource types
  private _config: Internal.ResourceManagerConfig = ResourceManager._defaultConfig();

  constructor(config: Partial<Internal.ResourceManagerConfig> = {}) {
    this._config = { ...this._config, ...config };
  }

  public async loadResource(name: string, url: string): Promise<any> {
    if (this._resources[name]) {
      console.warn(`Resource ${name} already loaded.`);
      return this._resources[name];
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load resource ${name} from ${url}: ${response.statusText}`);
    }

    const resource = await response.json(); // Assuming JSON for simplicity; can be extended for other types
    this._resources[name] = resource;
    return resource;
  }

  public getResource<Type>(name: string): Type {
    const resource = this._resources[name];
    if (!resource) {
      throw new Error(`Resource ${name} not found.`);
    }
    return resource as Type;
  }

  public hasResource(name: string): boolean {
    return !!this._resources[name];
  }

  public async loadResources(resources: Record<string, EngineTypes.Resource>): Promise<void> {
    // TODO: Implement batch loading of resources
  }

  private static _defaultConfig(): Internal.ResourceManagerConfig {
    return {
      flags: {
        useCache: false,
        cacheSize: sizeStringToBytes("100MB"), // Default cache size
        cachePrefix: "resource_cache_",
        cacheMethod: "indexedDB" // Default cache method
      }
    };
  }
}

function sizeStringToBytes(size: string): number {
  const match = size.match(/^(\d+)([KMGT]B)?$/i);
  if (!match) {
    throw new Error(`Invalid size string: ${size}`);
  }
  const value = parseInt(match[1], 10);
  const unit = match[2]?.toUpperCase() || '';
  
  switch (unit) {
    case 'KB':
      return value * 1024;
    case 'MB':
      return value * 1024 * 1024;
    case 'GB':
      return value * 1024 * 1024 * 1024;
    case 'TB':
      return value * 1024 * 1024 * 1024 * 1024;
    default:
      return value; // Bytes
  }
}