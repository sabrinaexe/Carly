console.log('Original paths length:', module.paths.length);
// Filter out node_modules paths
const originalPaths = module.paths;
module.paths = module.paths.filter(p => !p.includes('node_modules'));

try {
    const electron = require('electron');
    console.log('Electron keys:', Object.keys(electron));
    console.log('Is app defined?', !!electron.app);
} catch (e) {
    console.log('Require failed:', e.message);
}

// Restore paths (optional, but good practice if code continues)
module.paths = originalPaths;
