const { app, BrowserWindow, Tray, Menu, Notification, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const { createClient } = require('@supabase/supabase-js');

// ─── Config ─────────────────────────────────────────────────────────────
const CONFIG_PATH = path.join(__dirname, 'notification-config.json');

const DEFAULT_CONFIG = {
  enabled: true,
  // HH:MM in EET (Europe/Bucharest)
  time: '09:00',
  supabaseUrl: '',
  supabaseKey: ''
};

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8')) };
    }
  } catch (e) {
    console.error('[Config] Error loading config:', e);
  }
  return { ...DEFAULT_CONFIG };
}

function saveConfig(config) {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
  } catch (e) {
    console.error('[Config] Error saving config:', e);
  }
}

// ─── Globals ────────────────────────────────────────────────────────────
let mainWindow = null;
let tray = null;
let cronTask = null;

const isDev = process.defaultApp || process.env.NODE_ENV === 'development' || process.env.ELECTRON_START_URL;

if (process.platform === 'win32') {
  app.setAppUserModelId('com.carly.app');
}

// ─── Supabase Check ─────────────────────────────────────────────────────
async function checkExpirationsBackground() {
  const config = loadConfig();

  if (!config.supabaseUrl || !config.supabaseKey) {
    console.log('[Notification] No Supabase credentials configured – skipping check.');
    return;
  }

  try {
    const supabase = createClient(config.supabaseUrl, config.supabaseKey);

    // Get the current user session (anon key with RLS — we need stored access token)
    // For background checks we fetch all vehicles the anon key can see
    const { data: vehicles, error } = await supabase
      .from('vehicles')
      .select('*');

    if (error) {
      console.error('[Notification] Supabase error:', error.message);
      return;
    }

    if (!vehicles || vehicles.length === 0) return;

    let expiredCount = 0;
    let urgentCount = 0;
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    vehicles.forEach(vehicle => {
      const checks = [
        { type: 'Insurance', date: vehicle.insurance_expiry },
        { type: 'ITP', date: vehicle.itp_expiry },
        { type: 'Rovinieta', date: vehicle.rovinieta_expiry }
      ];

      checks.forEach(check => {
        if (!check.date) return;
        const expiryDate = new Date(check.date);
        expiryDate.setHours(0, 0, 0, 0);
        const days = Math.ceil((expiryDate.getTime() - now.getTime()) / 86400000);

        if (days < 0) expiredCount++;
        else if (days <= 7) urgentCount++;
      });
    });

    if (expiredCount > 0) {
      new Notification({
        title: expiredCount === 1 ? '🚨 Document expirat!' : '🚨 Documente expirate!',
        body: expiredCount === 1 
          ? 'Un document a expirat. Deschide Carly pentru detalii.'
          : `${expiredCount} documente au expirat. Deschide Carly pentru detalii.`,
        icon: path.join(__dirname, 'icon.png')
      }).show();
    } else if (urgentCount > 0) {
      new Notification({
        title: urgentCount === 1 ? '⚠️ Document expiră curând' : '⚠️ Documente expiră curând',
        body: urgentCount === 1
          ? 'Un document expiră în următoarele 7 zile. Deschide Carly.'
          : `${urgentCount} documente expiră în următoarele 7 zile. Deschide Carly.`,
        icon: path.join(__dirname, 'icon.png')
      }).show();
    }

    console.log(`[Notification] Check complete: ${expiredCount} expired, ${urgentCount} urgent.`);
  } catch (err) {
    console.error('[Notification] Background check failed:', err);
  }
}

// ─── Cron Scheduler ─────────────────────────────────────────────────────
function scheduleCron() {
  // Stop any existing task
  if (cronTask) {
    cronTask.stop();
    cronTask = null;
  }

  const config = loadConfig();
  if (!config.enabled) {
    console.log('[Cron] Notifications disabled.');
    return;
  }

  const [hours, minutes] = (config.time || '09:00').split(':').map(Number);

  // node-cron expression: minute hour * * *
  // The timezone option makes this fire in EET
  const cronExpression = `${minutes} ${hours} * * *`;

  console.log(`[Cron] Scheduling daily notification at ${config.time} EET (cron: ${cronExpression})`);

  cronTask = cron.schedule(cronExpression, () => {
    console.log('[Cron] Running scheduled notification check...');
    checkExpirationsBackground();
  }, {
    timezone: 'Europe/Bucharest'
  });
}

// ─── IPC Handlers ───────────────────────────────────────────────────────
function setupIPC() {
  ipcMain.handle('get-notification-config', () => {
    return loadConfig();
  });

  ipcMain.handle('set-notification-config', (_event, newConfig) => {
    const config = loadConfig();
    const merged = { ...config, ...newConfig };
    saveConfig(merged);
    scheduleCron(); // restart cron with new settings
    return merged;
  });
}

// ─── Window ─────────────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // For simple prototype; secure this later
    },
  });
  mainWindow.setMenuBarVisibility(false);

  const startUrl = process.env.ELECTRON_START_URL || 'http://localhost:5173';

  // Production: Load the built file
  if (!isDev) {
    let buildPath = path.join(__dirname, '..', 'client', 'dist', 'index.html');
    if (!fs.existsSync(buildPath)) {
      buildPath = path.join(__dirname, 'client', 'dist', 'index.html');
    }

    if (fs.existsSync(buildPath)) {
      mainWindow.loadFile(buildPath);
      console.log('Loaded production file:', buildPath);
    } else {
      console.error('Production build not found at:', buildPath);
      mainWindow.loadURL('data:text/html;charset=utf-8,<h1>Error: Build not found</h1><p>Please run <code>npm run build:client</code></p>');
    }
  } else {
    const loadDevServer = () => {
      mainWindow.loadURL(startUrl).catch(() => {
        console.log('Dev server not ready, retrying in 1s...');
        setTimeout(loadDevServer, 1000);
      });
    };
    loadDevServer();
    mainWindow.webContents.openDevTools();
  }


}

// ─── System Tray ────────────────────────────────────────────────────────
function createTray() {
  tray = new Tray(path.join(__dirname, 'icon.png'));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open Carly',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: 'Check Now',
      click: () => {
        checkExpirationsBackground();
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('Carly – Vehicle Manager');
  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// ─── Auto-detect Supabase credentials ───────────────────────────────────
function autoDetectSupabaseCredentials() {
  const config = loadConfig();

  // Only auto-detect if not already set
  if (config.supabaseUrl && config.supabaseKey) return;

  // Try to read from client's .env.local
  const envPaths = [
    path.join(__dirname, '..', 'client', '.env.local'),
    path.join(__dirname, 'client', '.env.local')
  ];

  for (const envPath of envPaths) {
    try {
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        const urlMatch = envContent.match(/VITE_(?:PUBLIC_)?SUPABASE_URL=(.+)/);
        const keyMatch = envContent.match(/VITE_(?:PUBLIC_)?SUPABASE_ANON_KEY=(.+)/);

        if (urlMatch && keyMatch) {
          config.supabaseUrl = urlMatch[1].trim();
          config.supabaseKey = keyMatch[1].trim();
          saveConfig(config);
          console.log('[Config] Auto-detected Supabase credentials from', envPath);
          return;
        }
      }
    } catch (e) {
      // continue
    }
  }
}

// ─── App Lifecycle ──────────────────────────────────────────────────────
app.whenReady().then(() => {
  autoDetectSupabaseCredentials();
  setupIPC();
  createWindow();
  createTray();
  scheduleCron();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  } else {
    mainWindow.show();
  }
});

app.on('before-quit', () => {
  app.isQuitting = true;
});
