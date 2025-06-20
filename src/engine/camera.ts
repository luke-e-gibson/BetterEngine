import { mat4, vec3 } from "gl-matrix";
import { MathUtils } from "./math";

export class Camera {
  private static _activeCamera: Camera | null = null;
  private _viewMatrix: mat4;
  private _projectionMatrix: mat4;
  private _position: vec3;
  private _rotation: vec3; // [pitch, yaw, roll]

  constructor(fovdeg: number = 45, aspectRatio: number = 1.0, near: number = 0.1, far: number = 100.0) {
    this._viewMatrix = mat4.create();
    this._projectionMatrix = mat4.create();
    this._position = vec3.fromValues(-7.4, 4, 5.5);
    this._rotation = vec3.fromValues(0.36800000071525574, 0.8619999885559082, 0);

    mat4.identity(this._viewMatrix);
    mat4.perspective(this._projectionMatrix, MathUtils.degToRad(fovdeg), aspectRatio, near, far);
    
  }

  public static get activeCamera(): Camera | null {
    return Camera._activeCamera;
  }

  public static set activeCamera(camera: Camera | null) {
    Camera._activeCamera = camera;
  }

  public get position(): vec3 {
    return this._position;
  }

  public set position(pos: vec3) {
    vec3.copy(this._position, pos);
    this.updateViewMatrix();
  }

  public get rotation(): vec3 {
    return this._rotation;
  }

  public set rotation(rot: vec3) {
    vec3.copy(this._rotation, rot);
    this.updateViewMatrix();
  }

  private updateViewMatrix(): void {
    mat4.identity(this._viewMatrix);
    
    // Apply rotations (pitch, yaw, roll)
    mat4.rotateX(this._viewMatrix, this._viewMatrix, this._rotation[0]); // pitch
    mat4.rotateY(this._viewMatrix, this._viewMatrix, this._rotation[1]); // yaw
    mat4.rotateZ(this._viewMatrix, this._viewMatrix, this._rotation[2]); // roll
    
    // Apply translation
    mat4.translate(this._viewMatrix, this._viewMatrix, [-this._position[0], -this._position[1], -this._position[2]]);
  }

  public get cameraMatrixes() {
    return {
      view: this._viewMatrix,
      projection: this._projectionMatrix,
    };
  }
}