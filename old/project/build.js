import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

// Console formatting helpers for better output
const consoleColors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

// Logging helper functions
const log = {
  info: (message) => console.log(`${consoleColors.blue}[INFO]${consoleColors.reset} ${message}`),
  success: (message) => console.log(`${consoleColors.green}[SUCCESS]${consoleColors.reset} ${message}`),
  warning: (message) => console.log(`${consoleColors.yellow}[WARNING]${consoleColors.reset} ${message}`),
  error: (message) => console.log(`${consoleColors.red}[ERROR]${consoleColors.reset} ${message}`),
  header: (message) => console.log(`\n${consoleColors.bright}${consoleColors.cyan}=== ${message} ===${consoleColors.reset}\n`)
};

// Paths configuration
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = __dirname;
const CONFIG_FILE = path.join(ROOT_DIR, 'build.json');
const SHADERS_DIR = path.join(ROOT_DIR, 'shaders');
const SHADERS_LIST_FILE = path.join(SHADERS_DIR, 'shaders.json');
const MESHES_DIR = path.join(ROOT_DIR, 'meshes');
const MESHES_LIST_FILE = path.join(MESHES_DIR, 'meshes.json');
const TEXTURES_DIR = path.join(ROOT_DIR, 'textures');
const TEXTURES_LIST_FILE = path.join(TEXTURES_DIR, 'textures.json');
const BUILD_DIR = path.join(ROOT_DIR, 'build');
const PUBLIC_DIR = path.join(ROOT_DIR, '..', 'public');

// Load configuration
let config = {
  minify: false,  // Default: don't minify
  indent: 2,      // Default: pretty print with 2 spaces
  verbose: true   // Default: show detailed logs
};

try {
  log.info(`Loading configuration from: ${CONFIG_FILE}`);
  const configData = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  config = { ...config, ...configData };
  log.success('Configuration loaded successfully');
  
  if (config.verbose) {
    log.info(`Configuration settings:`);
    log.info(`- Minify: ${config.minify ? 'Yes' : 'No'}`);
    log.info(`- Indent: ${config.indent === null ? 'None (minified)' : config.indent}`);
    log.info(`- Verbose: ${config.verbose ? 'Yes' : 'No'}`);
  }
} catch (error) {
  log.warning(`Failed to load configuration file: ${error.message}`);
  log.info('Using default configuration');
}

log.info =  (message) => {
  if (config.verbose) {
    console.log(`${consoleColors.blue}[INFO]${consoleColors.reset} ${message}`);
  }
}

// Helper function to write JSON files with configured minification
function writeJsonFile(filePath, data) {
  const indent = config.minify ? null : (config.indent || 2);
  fs.writeFileSync(filePath, JSON.stringify(data, null, indent));
  
  // If verbose and minifying, show size savings
  if (config.verbose && config.minify) {
    const minifiedSize = fs.statSync(filePath).size;
    const prettySize = Buffer.byteLength(JSON.stringify(data, null, 2), 'utf8');
    const savings = ((1 - minifiedSize / prettySize) * 100).toFixed(2);
    log.info(`Minification reduced file size by ${savings}% (${prettySize} → ${minifiedSize} bytes)`);
  }
}

// Create build directory if it doesn't exist
if (!fs.existsSync(BUILD_DIR)) {
  fs.mkdirSync(BUILD_DIR);
  log.success(`Created build directory: ${BUILD_DIR}`);
}

// --- SHADER BUILDING ---
log.header('Building Shaders');

// Create shaders build directory
const SHADERS_BUILD_DIR = path.join(BUILD_DIR, 'shaders');
if (!fs.existsSync(SHADERS_BUILD_DIR)) {
  fs.mkdirSync(SHADERS_BUILD_DIR);
  log.success(`Created shaders build directory: ${SHADERS_BUILD_DIR}`);
}

// Read the main shaders.json file
log.info(`Reading shaders list from: ${SHADERS_LIST_FILE}`);
let shadersList;
try {
  shadersList = JSON.parse(fs.readFileSync(SHADERS_LIST_FILE, 'utf8'));
} catch (error) {
  log.error(`Error reading shaders list: ${error.message}`);
  // If shaders.json doesn't exist or has issues, look for shader.json files directly
  log.info('Looking for shader.json files directly...');
  shadersList = { shaders: [] };
  
  // Add the basic shader from the baisc directory
  shadersList.shaders.push({
    name: "Basic",
    folder: "baisc"
  });
}

// Process each shader
let shadersProcessed = 0;
let shadersSucceeded = 0;

shadersList.shaders.forEach(shaderInfo => {
  const shaderName = shaderInfo.name;
  let shaderFolder = shaderInfo.folder.replace('./', ''); // Remove leading './' if present
  
  log.info(`Processing shader: ${shaderName}`);
  shadersProcessed++;
  
  // Handle the folder path - account for typo in the folder name
  const folderPath = path.join(SHADERS_DIR, shaderFolder);
  if (!fs.existsSync(folderPath)) {
    log.warning(`Folder '${folderPath}' does not exist. Checking for 'baisc' folder.`);
    // Try with the typo 'baisc' if the correct folder doesn't exist
    const altFolderPath = path.join(SHADERS_DIR, 'baisc');
    if (fs.existsSync(altFolderPath)) {
      log.info(`Using alternative folder: ${altFolderPath}`);
      shaderFolder = 'baisc';
    } else {
      log.error(`Neither '${folderPath}' nor '${altFolderPath}' exist.`);
      return;
    }
  }
  
  const shaderConfigPath = path.join(SHADERS_DIR, shaderFolder, 'shader.json');
  log.info(`Reading shader config from: ${shaderConfigPath}`);
  
  try {
    // Read the shader configuration file
    const shaderConfig = JSON.parse(fs.readFileSync(shaderConfigPath, 'utf8'));
    
    // Get the vertex and fragment shader file paths relative to the shader.json
    const vertexShaderPath = path.join(path.dirname(shaderConfigPath), shaderConfig.vertex);
    const fragmentShaderPath = path.join(path.dirname(shaderConfigPath), shaderConfig.fragment);
    
    // Check if files exist with potential typo handling
    let vertexShaderContent;
    let fragmentShaderContent;
    
    try {
      vertexShaderContent = fs.readFileSync(vertexShaderPath, 'utf8');
    } catch (error) {
      log.error(`Error reading vertex shader: ${error.message}`);
      return;
    }
    
    try {
      fragmentShaderContent = fs.readFileSync(fragmentShaderPath, 'utf8');
    } catch (error) {
      log.error(`Error reading fragment shader: ${error.message}`);
      
      // Try to handle the typo in fragment shader name
      const baseName = path.basename(shaderConfig.fragment, path.extname(shaderConfig.fragment));
      const ext = path.extname(shaderConfig.fragment);
      const typoPath = path.join(path.dirname(fragmentShaderPath), `${baseName.replace('basic', 'baisc')}${ext}`);
      
      if (fs.existsSync(typoPath)) {
        log.info(`Using alternative fragment shader path due to typo: ${typoPath}`);
        fragmentShaderContent = fs.readFileSync(typoPath, 'utf8');
      } else {
        return;
      }
    }
    
    // Create the transformed shader object according to the schema
    const transformedShader = {
      name: shaderConfig.name,
      content: {
        vertex: vertexShaderContent,
        fragment: fragmentShaderContent
      }
    };
    
    // Write the transformed shader to the build directory
    const outputPath = path.join(SHADERS_BUILD_DIR, `${shaderName.toLowerCase()}.json`);
    writeJsonFile(outputPath, transformedShader);
    log.success(`Built shader: ${outputPath}`);
    shadersSucceeded++;
  } catch (error) {
    log.error(`Error processing shader ${shaderName}: ${error.message}`);
  }
});

// --- MESH BUILDING ---
log.header('Building Meshes');

// Create meshes build directory
const MESHES_BUILD_DIR = path.join(BUILD_DIR, 'meshes');
if (!fs.existsSync(MESHES_BUILD_DIR)) {
  fs.mkdirSync(MESHES_BUILD_DIR);
  log.success(`Created meshes build directory: ${MESHES_BUILD_DIR}`);
}

// Read the main meshes.json file
log.info(`Reading meshes list from: ${MESHES_LIST_FILE}`);
let meshesList;
try {
  meshesList = JSON.parse(fs.readFileSync(MESHES_LIST_FILE, 'utf8'));
} catch (error) {
  log.error(`Error reading meshes list: ${error.message}`);
  log.info('Looking for mesh.json files directly...');
  meshesList = { meshes: [] };
  
  // Try to find individual mesh files
  const files = fs.readdirSync(MESHES_DIR);
  files.forEach(file => {
    if (file !== 'meshes.json' && file.endsWith('.json')) {
      try {
        const meshData = JSON.parse(fs.readFileSync(path.join(MESHES_DIR, file), 'utf8'));
        meshesList.meshes.push({
          name: meshData.name || path.basename(file, '.json'),
          file: `./${file}`
        });
      } catch (err) {
        log.error(`Error parsing mesh file ${file}: ${err.message}`);
      }
    }
  });
}

// Process each mesh
let meshesProcessed = 0;
let meshesSucceeded = 0;

meshesList.meshes.forEach(meshInfo => {
  const meshName = meshInfo.name;
  const meshFile = meshInfo.file.replace('./', ''); // Remove leading './' if present
  
  log.info(`Processing mesh: ${meshName}`);
  meshesProcessed++;
  
  const meshFilePath = path.join(MESHES_DIR, meshFile);
  log.info(`Reading mesh from: ${meshFilePath}`);
  
  try {
    // Read the mesh file
    const meshData = JSON.parse(fs.readFileSync(meshFilePath, 'utf8'));
    
    // Validate the mesh data against our schema
    if (!meshData.name) {
      log.warning(`Mesh ${meshName} is missing a name property. Using file name as fallback.`);
      meshData.name = meshName;
    }
    
    if (!meshData.content) {
      log.error(`Mesh ${meshName} is missing content property.`);
      return;
    }
    
    if (!meshData.content.vertices || !Array.isArray(meshData.content.vertices)) {
      log.error(`Mesh ${meshName} is missing vertices array or it's not an array.`);
      return;
    }
    
    // Create the output mesh with schema validation
    const outputMesh = {
      name: meshData.name,
      content: {
        vertices: meshData.content.vertices
      }
    };
    
    // Add optional properties if they exist
    if (meshData.content.indices && Array.isArray(meshData.content.indices)) {
      outputMesh.content.indices = meshData.content.indices;
    }
    
    if (meshData.content.normals && Array.isArray(meshData.content.normals)) {
      outputMesh.content.normals = meshData.content.normals;
    }
    
    if (meshData.content.uvs && Array.isArray(meshData.content.uvs)) {
      outputMesh.content.uvs = meshData.content.uvs;
    }
    
    // Write the mesh to the build directory
    const outputPath = path.join(MESHES_BUILD_DIR, `${meshName.toLowerCase()}.json`);
    writeJsonFile(outputPath, outputMesh);
    log.success(`Built mesh: ${outputPath}`);
    meshesSucceeded++;
  } catch (error) {
    log.error(`Error processing mesh ${meshName}: ${error.message}`);
  }
});

// --- TEXTURE BUILDING ---
log.header('Building Textures');

// Create textures build directory
const TEXTURES_BUILD_DIR = path.join(BUILD_DIR, 'textures');
if (!fs.existsSync(TEXTURES_BUILD_DIR)) {
  fs.mkdirSync(TEXTURES_BUILD_DIR);
  log.success(`Created textures build directory: ${TEXTURES_BUILD_DIR}`);
}

// Read the main textures.json file
log.info(`Reading textures list from: ${TEXTURES_LIST_FILE}`);
let texturesList;
try {
  texturesList = JSON.parse(fs.readFileSync(TEXTURES_LIST_FILE, 'utf8'));
} catch (error) {
  log.error(`Error reading textures list: ${error.message}`);
  log.info('Looking for texture files directly...');
  texturesList = { textures: [] };
  
  // Try to find individual texture files
  const files = fs.readdirSync(TEXTURES_DIR);
  files.forEach(file => {
    if (file !== 'textures.json' && (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg'))) {
      texturesList.textures.push({
        name: path.basename(file, path.extname(file)),
        file: `./${file}`
      });
    }
  });
}

// Process each texture
let texturesProcessed = 0;
let texturesSucceeded = 0;

for (const textureInfo of texturesList.textures) {
  const textureName = textureInfo.name;
  const textureFile = textureInfo.file.replace('./', ''); // Remove leading './' if present
  
  log.info(`Processing texture: ${textureName}`);
  texturesProcessed++;
  
  const textureFilePath = path.join(TEXTURES_DIR, textureFile);
  log.info(`Reading texture from: ${textureFilePath}`);
  
  try {
    // Check if the texture file exists
    if (!fs.existsSync(textureFilePath)) {
      log.error(`Texture file does not exist: ${textureFilePath}`);
      continue;
    }
    
    // Get image metadata using sharp
    const metadata = await sharp(textureFilePath).metadata();
    log.info(`Texture ${textureName}: ${metadata.width}x${metadata.height}, format: ${metadata.format}`);
      let needsProcessing = false;
    let outputPath = path.join(TEXTURES_BUILD_DIR, `${textureName.toLowerCase()}.jpg`);
      // Check if image is larger than 1080p (1920x1080)
    const maxDimension = Math.max(metadata.width, metadata.height);
    if (maxDimension > 1920) {
      log.warning(`Texture ${textureName} is ${maxDimension}px, needs resizing to 1080p max`);
      needsProcessing = true;
    }
    
    // Check if image is not JPEG format
    if (metadata.format !== 'jpeg' && metadata.format !== 'jpg') {
      log.info(`Texture ${textureName} is ${metadata.format}, converting to JPEG`);
      needsProcessing = true;
    }
    
    if (needsProcessing) {
      // Create sharp pipeline
      let pipeline = sharp(textureFilePath);
        // Resize if needed (maintain aspect ratio)
      if (maxDimension > 1920) {
        const scale = 1920 / maxDimension;
        const newWidth = Math.round(metadata.width * scale);
        const newHeight = Math.round(metadata.height * scale);
        pipeline = pipeline.resize(newWidth, newHeight, {
          kernel: sharp.kernel.lanczos3,
          withoutEnlargement: true
        });        log.info(`Resizing ${textureName} to ${newWidth}x${newHeight}`);
      }
      
      // Convert to JPEG
      pipeline = pipeline.jpeg({
        quality: 90,
        progressive: true
      });
      
      // Save the processed image
      await pipeline.toFile(outputPath);
      log.success(`Processed and saved texture: ${outputPath}`);
    } else {
      // Just copy the file if no processing needed
      fs.copyFileSync(textureFilePath, outputPath);
      log.success(`Copied texture: ${outputPath}`);
    }
    
    texturesSucceeded++;
  } catch (error) {
    log.error(`Error processing texture ${textureName}: ${error.message}`);
  }
}

// --- BUILD SUMMARY ---
log.header('Build Summary');
log.success(`Shaders: ${shadersSucceeded}/${shadersProcessed} successfully built`);
log.success(`Meshes: ${meshesSucceeded}/${meshesProcessed} successfully built`);
log.success(`Textures: ${texturesSucceeded}/${texturesProcessed} successfully built`);

if (shadersSucceeded === shadersProcessed && meshesSucceeded === meshesProcessed && texturesSucceeded === texturesProcessed) {
  log.success('Build completed successfully!');
  
  // Copy build output to public directory
  log.header('Copying Build Output to Public Directory');
  try {
    copyDirectory(BUILD_DIR, PUBLIC_DIR);
    log.success(`Build output copied to: ${PUBLIC_DIR}`);
  } catch (error) {
    log.error(`Failed to copy build output to public directory: ${error.message}`);
  }
} else {
  log.warning('Build completed with some errors. Skipping copy to public directory.');
}

// Helper function to recursively copy directory
function copyDirectory(src, dest) {
  try {
    // Create destination directory if it doesn't exist
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
      log.info(`Created directory: ${dest}`);
    }

    // Read the source directory
    const items = fs.readdirSync(src);

    items.forEach(item => {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);

      if (fs.statSync(srcPath).isDirectory()) {
        // Recursively copy subdirectories
        copyDirectory(srcPath, destPath);
      } else {
        // Copy file
        fs.copyFileSync(srcPath, destPath);
        if (config.verbose) {
          log.info(`Copied: ${srcPath} → ${destPath}`);
        }
      }
    });
  } catch (error) {
    log.error(`Error copying directory from ${src} to ${dest}: ${error.message}`);
    throw error;
  }
}