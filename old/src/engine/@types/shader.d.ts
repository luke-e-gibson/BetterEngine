interface ShaderFile {
  name: string; 
  content: {
    vertex: string;
    fragment: string;
  }
}

namespace Internal {
  type Shaders = "wireframe" | string

  interface ShaderFlags {
    config: {
      useLighting?: boolean;
      useTextures?: boolean;
      smoothShading?: boolean;
      [key: string]: any;
    };
  }

}