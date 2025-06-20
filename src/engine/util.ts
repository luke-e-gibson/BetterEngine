export function createCanvas(id = "game-canvas"): HTMLCanvasElement {
  let canvas = document.getElementById(id) as HTMLCanvasElement;
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.id = id;
    document.body.appendChild(canvas);
  }
  return canvas;
}