import { Engine } from "./engine/engine";

const engine = new Engine();
engine.setFlag("uncappedFps", false)


engine.initialize().then(() => {
  console.log("Engine initialized successfully.");
  engine.start();
}).catch((error) => {
  console.error("Failed to initialize engine:", error);
});

