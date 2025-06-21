export class Canvas {
  private _canvas: HTMLCanvasElement;
  private _context: WebGL2RenderingContext;

  constructor(canvas: HTMLCanvasElement) {
    this._canvas = canvas;
    this._context = canvas.getContext('webgl2') as WebGL2RenderingContext;
    if (!this._context) {
      throw new Error('WebGL2 not supported');
    }

    
    this._canvasResize = this._canvasResize.bind(this);
    this.canvas.addEventListener('resize', this._canvasResize.bind(this));  
  }


  public get canvas(): HTMLCanvasElement {
    return this._canvas;
  }

  public get context(): WebGL2RenderingContext {
    return this._context;
  }

  private _setFullscreen(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this._canvasResize();
  }

  private _canvasResize(): void {
    this._canvas.width = this.canvas.clientWidth;
    this._canvas.height = this.canvas.clientHeight;
    this._context.viewport(0, 0, this._canvas.width, this._canvas.height);
  }

  public fullscreen(): void {
    this._setFullscreen();
    this._canvasResize();
  }
}