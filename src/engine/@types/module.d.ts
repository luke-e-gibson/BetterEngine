namespace Internal {
  interface EngineModule {
    start: (canvas: Canvas) => void;
    update: (deltaTime: number, camera: Camera) => void;
    initialize: () => Promise<void>;
  }
}