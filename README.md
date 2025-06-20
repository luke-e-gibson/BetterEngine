# BetterEngine
A modern 3D graphics engine built with TypeScript and WebGL.

## Features

- **WebGL Rendering**: Hardware-accelerated 3D graphics
- **Modular Architecture**: Extensible system with engine modules
- **Resource Management**: Built-in loaders for meshes, shaders, and textures
- **Camera System**: Flexible camera controls including FlyCam
- **Modern TypeScript**: Full TypeScript support with type definitions
- **Vite Build System**: Fast development and building with Vite

## Project Structure

```
src/
├── engine/                 # Core engine code
│   ├── engine.ts          # Main engine class
│   ├── canvas.ts          # Canvas management
│   ├── graphics/          # Rendering system
│   │   ├── graphics.ts    # Graphics manager
│   │   ├── camera.ts      # Camera implementation
│   │   └── gl/            # WebGL utilities
│   ├── resource/          # Asset loading
│   │   ├── loader.ts      # Resource loader
│   │   ├── loaders.ts     # Specific loaders
│   │   └── Texture.ts     # Texture handling
│   ├── @modules/          # Engine modules
│   │   └── camera/        # Camera modules
│   ├── @types/            # Type definitions
│   └── @util/             # Utility functions
project/                   # Development assets
├── meshes/               # 3D model files
├── shaders/              # Shader programs
└── textures/             # Texture assets
public/                   # Built assets for production
```

## Getting Started

### Prerequisites

- Node.js (16+ recommended)
- pnpm package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd BetterEngine
```

2. Install dependencies:
```bash
pnpm install
```

### Development

Start the development server:
```bash
pnpm dev
```

This will start Vite's development server with hot module replacement.

### Building

Build for production:
```bash
pnpm build
```

Preview the production build:
```bash
pnpm preview
```
### Camera Controls

The FlyCam module provides free-look camera controls:
- WASD: Movement
- Mouse: Look around
- Scroll: Zoom/speed adjustment

## Asset Pipeline

### Meshes
Place 3D models in `project/meshes/` as JSON files. The engine supports custom mesh format for optimal loading.

### Shaders
Shaders are organized in `project/shaders/` with separate vertex and fragment shader files plus metadata.

### Textures
Texture assets go in `project/textures/` and support common image formats.

## Architecture

### Core Systems

- **Engine**: Main orchestrator, handles initialization and game loop
- **Graphics**: WebGL rendering pipeline and state management
- **Canvas**: Window and viewport management
- **Camera**: View and projection matrix calculations
- **Resource Loader**: Asynchronous asset loading and caching
