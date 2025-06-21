import { Engine } from "engine"

const GAME_PATH = "/world.json"

const engine = new Engine({
  flags: {
    debug: true,
  },
  _temp: GAME_PATH,
});


engine.initialize().then(() => {
  engine.start();
})

window.engine = engine;

