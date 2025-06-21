export class ResourceLoader {
  private _resources: Map<string, any> = new Map();

  public loadResource<T>(name: string, resource: T): void {
    if (this._resources.has(name)) {
      throw new Error(`Resource with name ${name} already exists.`);
    }
    this._resources.set(name, resource);
  }

  public getResource<T>(name: string): T {
    const resource = this._resources.get(name);
    if (!resource) {
      throw new Error(`Resource with name ${name} not found.`);
    }
    return resource as T;
  }

  public async loadResourceAsync<T>(name: string, resourcePromise: Promise<T>): Promise<T> {
    if (this._resources.has(name)) {
      throw new Error(`Resource with name ${name} already exists.`);
    }
    const resource = await resourcePromise;
    this._resources.set(name, resource);
    return resource;
  }

  public hasResource(name: string): boolean {
    return this._resources.has(name);
  }

  public clear(): void {
    this._resources.clear();
  }
}