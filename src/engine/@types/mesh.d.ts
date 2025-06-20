interface MeshFile {
  name: string;
  content: {
    vertices: number[];
    indices?: number[];
    normals?: number[];
    uvs?: number[];
  };
}

namespace Internal {
  interface MeshBuffers {
    vertex: WebGLBuffer | null;
    index: WebGLBuffer | null;
    normal: WebGLBuffer | null;
    uv: WebGLBuffer | null;
    vao: WebGLVertexArrayObject | null;
  }

  interface MeshFlags {
    hasNormals: boolean;
    hasUvs: boolean;
    hasIndices: boolean;
  }

  interface MeshMatrixes {
    model: mat4;
  }

  interface MeshWithFlags {
    mesh: Mesh;
    flags: {
      isVisible: boolean;
    }
  }

  interface GraphicsFlags {
    renderWireframe: boolean;
    renderMesh: boolean;
    renderGrid: boolean;
  }

  interface EngineFlags {
    uncappedFps: boolean;
    engineModules: EngineModule[]
  }

  interface FpsCamera {
    position: {
      x: number;
      y: number;
      z: number;
    };
    rotation: {
      x: number; // Yaw
      y: number; // Pitch
    };
    mouseSensitivity: number;
    moveSpeed: number;
    keyboard: {
      w: boolean;
      a: boolean;
      s: boolean;
      d: boolean;
      q: boolean;
      e: boolean;
    };
  }
}

interface MeshData {
  vertices: number[];
  indices: number[];
  normals?: number[];
  uvs?: number[];
}