import { Engine } from "./engine/engine";

const engine = new Engine();
engine.setFlag("uncappedFps", false)

engine.initialize().then(() => {
  engine.start();
})