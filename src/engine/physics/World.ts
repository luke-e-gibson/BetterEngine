import RAPIER from "@dimforge/rapier3d";
import type { Mesh } from "../graphics/gl/mesh";
import type { Shader } from "../graphics/gl/shader";
import { mat4 } from "gl-matrix";

export class World {
  private _gravity: { x: number; y: number; z: number };
  private _world: RAPIER.World;
  private _accumulatedTime: number = 0;

  constructor() {
    this._gravity = World.defaultGravity();
    this._world = new RAPIER.World(this._gravity);

    let groundColliderDesc = RAPIER.ColliderDesc.cuboid(10.0, 0.1, 10.0);
    this._world.createCollider(groundColliderDesc);
  }  public step(deltaTime: number) {
    // Use a consistent timestep for physics simulation
    // RAPIER recommends using a fixed timestep for stability
    const fixedTimeStep = 1.0 / 60.0; // 60 FPS physics
    
    // Accumulate time and step multiple times if needed for frame rate independence
    this._accumulatedTime += deltaTime;
    
    while (this._accumulatedTime >= fixedTimeStep) {
      this._world.step();
      this._accumulatedTime -= fixedTimeStep;
    }
  }  public createRigidBody(mesh: Mesh, position?: {x: number, y: number, z: number}, rotation?: {x: number, y: number, z: number, w: number}) {
    let rbDescriptor = RAPIER.RigidBodyDesc.dynamic();
    
    // Use mesh position if no position is provided
    if (position) {
      rbDescriptor.setTranslation(position.x, position.y, position.z);
    } else {
      // Get position from mesh (this assumes mesh has position getters)
      // For now, default to origin if no position is specified
      rbDescriptor.setTranslation(0, 0, 0);
    }
    
    if (rotation) {
      rbDescriptor.setRotation(rotation);
    }
    
    let rb = this._world.createRigidBody(rbDescriptor);

    let colliderDescriptor = RAPIER.ColliderDesc.convexHull(new Float32Array((mesh as any).meshData.vertices));
    if (!colliderDescriptor) {
      throw new Error("Collider descriptor could not be created from mesh data");
    }
    let collider = this._world.createCollider(colliderDescriptor, rb);

    return {rb, collider};
  }

  public createCollider(mesh: Mesh): RAPIER.Collider {
    let colliderDescriptor = RAPIER.ColliderDesc.convexHull(new Float32Array((mesh as any).meshData.vertices));
    if (!colliderDescriptor) {
      throw new Error("Collider descriptor could not be created from mesh data");
    }
    return this._world.createCollider(colliderDescriptor);
  }

  private _debugBuffer: WebGLBuffer | null = null;
  private _debugBufferSize: number = 0;

  public render(gl: WebGL2RenderingContext, shader: Shader) {
    const data = this._world.debugRender();
    if (!data) {
      throw new Error("Debug render data could not be retrieved from the physics world");
    }

    const vertices = new Float32Array(data.vertices);

    const view = mat4.identity(mat4.create());


    // Create buffer only once
    if (!this._debugBuffer) {
      this._debugBuffer = gl.createBuffer();
      if (!this._debugBuffer) {
        throw new Error("Could not create buffer for physics debug rendering");
      }
      this._debugBufferSize = 0;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this._debugBuffer);

    // Only reallocate if size changes
    if (vertices.byteLength > this._debugBufferSize) {
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);
      this._debugBufferSize = vertices.byteLength;
    } else {
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, vertices);
    }

    shader.use();
    shader.setCameraUniforms();
    shader.setUniform("uModelMatrix", view);

    // Assume shader expects position at location 0
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.LINES, 0, vertices.length / 3);

    gl.disableVertexAttribArray(0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  public removeRigidBody(rigidBody: RAPIER.RigidBody): void {
    this._world.removeRigidBody(rigidBody);
  }

  public static defaultGravity() {
    return { x: 0.0, y: -9.81, z: 0.0 };
  }
}