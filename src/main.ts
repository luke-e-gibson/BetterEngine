import { Engine } from "./engine/engine";
import { FlyCam } from "./engine/@modules/camera/FlyCam";


const engine = new Engine();
engine.setFlag("uncappedFps", false)
engine.setFlag("engineModules", [new FlyCam()]);

engine.initialize().then(() => {
  engine.start();
})