import type { Graphics } from "../graphics/graphics";
import { Mesh } from "../graphics/mesh";
import type { Shader } from "../graphics/shader";
import type { ResourceLoader } from "./loader";
import type { Texture } from "./Texture";

export async function loadAndCreateMesh(path: string, name: string, loader: ResourceLoader, graphics: Graphics, shader: Shader): Promise<Mesh> {
  const meshData = await loader.loadResourceAsync<MeshFile>(name, fetch(path).then(response => response.json()));
  if (!meshData) {
    throw new Error(`Mesh data for ${name} could not be loaded from ${path}`);
  }

  return graphics.createMesh(meshData, shader, name).mesh;
}

export async function loadAndCreateShader(path: string, name: string, loader: ResourceLoader, graphics: Graphics): Promise<Shader> {
  const shaderFile = await loader.loadResourceAsync<ShaderFile>(name, fetch(path).then(response => response.json()));
  if (!shaderFile) {
    throw new Error(`Shader file for ${name} could not be loaded from ${path}`);
  }

  return graphics.createShader(shaderFile, name).shader;
}

export async function loadAndCreateTexture(path: string, name: string, graphics: Graphics): Promise<Texture> {
  return await graphics.createTexture(path, name);
}