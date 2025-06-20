import type { vec3 } from "gl-matrix";
import type { Camera } from "../../graphics/camera";
import type { Canvas } from "../../canvas";

export class FlyCam implements Internal.EngineModule {
  private _fpsCamera: Internal.FpsCamera;

  constructor() {
    this._fpsCamera = {
      position: {
        x: -7.4,
        y: 4,
        z: 5.5,
      }, rotation: {
        x: 0.8619999885559082, // Yaw
        y: 0.36800000071525574, // Pitch
      },
      mouseSensitivity: 0.002,
      moveSpeed: 5.0, // units per second
      keyboard: {
        w: false,
        a: false,
        s: false,
        d: false,
        q: false,
        e: false,
      }
    };
  }

  public start(canvas: Canvas) {
    const _canvas = canvas.canvas;

    window.addEventListener("keydown", (event) => {
      event.preventDefault(); // Prevent default actions like scrolling
      switch (event.key) {
        case "w":
          this._fpsCamera.keyboard.w = true;
          break;
        case "a":
          this._fpsCamera.keyboard.a = true;
          break;
        case "s":
          this._fpsCamera.keyboard.s = true;
          break;
        case "d":
          this._fpsCamera.keyboard.d = true;
          break;
        case "q":
          this._fpsCamera.keyboard.q = true;
          break;
        case "e":
          this._fpsCamera.keyboard.e = true;
          break; case "Control":
          this._fpsCamera.moveSpeed = 20;
          event.preventDefault(); // Prevent browser shortcuts like Ctrl+W
          break;
        default:
          break;
      }
    });

    window.addEventListener("keyup", (event) => {
      switch (event.key) {
        case "w":
          this._fpsCamera.keyboard.w = false;
          break;
        case "a":
          this._fpsCamera.keyboard.a = false;
          break;
        case "s":
          this._fpsCamera.keyboard.s = false;
          break;
        case "d":
          this._fpsCamera.keyboard.d = false;
          break;
        case "q":
          this._fpsCamera.keyboard.q = false;
          break;
        case "e":
          this._fpsCamera.keyboard.e = false;
          break; case "Control":
          this._fpsCamera.moveSpeed = 5;
          event.preventDefault(); // Prevent browser shortcuts
          break;
        default:
          break;
      }
    });

    // Prevent common browser shortcuts that might interfere with the game
    window.addEventListener("keydown", (event) => {
      // Prevent browser shortcuts when pointer is locked (game is active)
      if (document.pointerLockElement === _canvas) {
        // Prevent common shortcuts
        if (event.ctrlKey || event.metaKey) {
          // Prevent Ctrl+W (close tab), Ctrl+R (refresh), etc.
          switch (event.key.toLowerCase()) {
            case 'w':
            case 'r':
            case 't':
            case 'n':
            case 'shift':
            case 'f4':
            case 'f5':
              event.preventDefault();
              break;
          }
        }

        // Prevent F5 refresh and other function keys
        if (event.key === 'F5' || event.key === 'F11' || event.key === 'F12') {
          event.preventDefault();
        }
      }
    });

    // Add extra protection against accidental page closing
    window.addEventListener("beforeunload", (event) => {
      // Only show confirmation if pointer is locked (game is active)
      if (document.pointerLockElement === _canvas) {
        event.preventDefault();
        event.returnValue = ''; // Chrome requires returnValue to be set
        return ''; // Legacy browsers
      }
    });

    window.addEventListener("mousemove", (event) => {
      if (document.pointerLockElement === _canvas) {
        this._fpsCamera.rotation.x += event.movementX * this._fpsCamera.mouseSensitivity; // Yaw
        this._fpsCamera.rotation.y += event.movementY * this._fpsCamera.mouseSensitivity; // Pitch

        // Clamp pitch to avoid flipping upside down
        this._fpsCamera.rotation.y = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this._fpsCamera.rotation.y));
      }
    });

    _canvas.addEventListener("mousedown", () => {
      _canvas.requestPointerLock().catch((err: string) => {
        console.error("Pointer lock failed:", err);
      });
    });
  };

  public update(deltaTime: number, camera: Camera) {
    const yaw = this._fpsCamera.rotation.x;
    const pitch = this._fpsCamera.rotation.y;

    // Calculate the forward vector based on yaw and pitch
    const forwardX = Math.sin(yaw) * Math.cos(pitch);
    const forwardY = -Math.sin(pitch);
    const forwardZ = -Math.cos(yaw) * Math.cos(pitch);

    // Calculate the right vector (perpendicular to forward and world up)
    const rightX = Math.cos(yaw);
    const rightZ = Math.sin(yaw); if (this._fpsCamera.keyboard.w) { // Forward
      this._fpsCamera.position.x += forwardX * this._fpsCamera.moveSpeed * deltaTime;
      this._fpsCamera.position.y += forwardY * this._fpsCamera.moveSpeed * deltaTime;
      this._fpsCamera.position.z += forwardZ * this._fpsCamera.moveSpeed * deltaTime;
    }

    if (this._fpsCamera.keyboard.s) { // Backward
      this._fpsCamera.position.x -= forwardX * this._fpsCamera.moveSpeed * deltaTime;
      this._fpsCamera.position.y -= forwardY * this._fpsCamera.moveSpeed * deltaTime;
      this._fpsCamera.position.z -= forwardZ * this._fpsCamera.moveSpeed * deltaTime;
    }

    if (this._fpsCamera.keyboard.a) { // Left strafe
      this._fpsCamera.position.x -= rightX * this._fpsCamera.moveSpeed * deltaTime;
      this._fpsCamera.position.z -= rightZ * this._fpsCamera.moveSpeed * deltaTime;
    }

    if (this._fpsCamera.keyboard.d) { // Right strafe
      this._fpsCamera.position.x += rightX * this._fpsCamera.moveSpeed * deltaTime;
      this._fpsCamera.position.z += rightZ * this._fpsCamera.moveSpeed * deltaTime;
    }

    if (this._fpsCamera.keyboard.q) { // Down
      this._fpsCamera.position.y -= this._fpsCamera.moveSpeed * deltaTime;
    }

    if (this._fpsCamera.keyboard.e) { // Up
      this._fpsCamera.position.y += this._fpsCamera.moveSpeed * deltaTime;
    }

    // Update camera position and rotation
    camera.position = [this._fpsCamera.position.x, this._fpsCamera.position.y, this._fpsCamera.position.z] as vec3;
    camera.rotation = [this._fpsCamera.rotation.y, this._fpsCamera.rotation.x, 0] as vec3; // [pitch, yaw, roll]
  };

  public async initialize(): Promise<void> {


  };
}