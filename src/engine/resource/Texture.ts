export class Texture {
  private texture: WebGLTexture | null = null;
  private gl: WebGL2RenderingContext;
  private image: string = '';


  constructor(gl: WebGL2RenderingContext, image: string = '') {
    this.gl = gl;
    this.texture = this.gl.createTexture();
    this.image = image;
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 255, 255]));
  }

  public load(image?: string): Promise<void> {
    image = image || this.image;
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = image;
      img.onload = () => {
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, img);
        this.gl.generateMipmap(this.gl.TEXTURE_2D);
        resolve();
      };
      img.onerror = (err) => {
        reject(new Error(`Failed to load texture: ${image}. Error: ${err}`));
      };
    });
  }

  public bind(unit: number = 0): void {
    if (!this.texture) {
      throw new Error("Texture not initialized");
    }
    this.gl.activeTexture(this.gl.TEXTURE0 + unit);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
  }

  public unbind(): void {
    if (!this.texture) {
      throw new Error("Texture not initialized");
    }
    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
  }
}