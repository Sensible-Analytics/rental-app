console.log('[DEBUG] 1. Requiring electron...');
const { app, BrowserWindow, ipcMain, shell } = require('electron');
console.log('[DEBUG] 2. Requiring path...');
const fs = require('fs');
const path = require('path');
console.log('[DEBUG] 3. Requiring database...');
const { propertyDB, tenantDB, expenseDB, db } = require('./database');
console.log('[DEBUG] 4. Requiring fileWatcher...');
const { startFileWatcher } = require('./fileWatcher');
console.log('[DEBUG] 5. Requiring fileProcessor...');
const { processFile } = require('./fileProcessor');
console.log('[DEBUG] 6. Requiring thunderbirdScanner...');
const { scanLocalMails } = require('./thunderbirdScanner');
console.log('[DEBUG] 7. Requiring dataCollector...');
const { collectAllData } = require('./dataCollector');
console.log('[DEBUG] 8. Requiring taxCalculator...');
const { calculateTaxBenefits } = require('./taxCalculator');
console.log('[DEBUG] 9. Requiring child_process...');
const { fork } = require('child_process');

// Dynamic Seeder for first run / new properties
async function seedDynamic() {
  const properties = propertyDB.getAll();
  for (const p of properties) {
    const loanExists = db.prepare('SELECT id FROM loan_details WHERE property_id = ?').get(p.id);
    if (!loanExists) {
      const principal = p.purchase_price || (p.country === 'AU' ? 800000 : 5000000);
      const rate = p.country === 'AU' ? 6.2 : 9.0;
      db.prepare(`INSERT INTO loan_details (property_id, lender, loan_amount, interest_rate, loan_type, monthly_repayment, start_date)
                  VALUES (?, ?, ?, ?, 'Principal & Interest', ?, '2023-01-01')`).run(p.id, p.country === 'AU' ? 'ANZ' : 'HDFC', principal * 0.8, rate, principal * 0.005);
    }
  }
}

function runBackgroundIngestion(mainWindow) {
    console.log('[Main] Forking Ingestion Service...');
    const service = fork(path.join(__dirname, 'ingestionService.js'));

    service.on('message', async (message) => {
        if (message.type === 'INGESTION_COMPLETE') {
            console.log('[Main] Ingestion Service reporting success:', message.stats);
            await seedDynamic();
            if (mainWindow) {
                mainWindow.webContents.send('ingestion-status', { status: 'complete', stats: message.stats });
            }
        } else if (message.type === 'INGESTION_PROGRESS') {
            if (mainWindow) {
                mainWindow.webContents.send('ingestion-progress', message.progress);
            }
        } else if (message.type === 'INGESTION_ERROR') {
            console.error('[Main] Ingestion Service reporting error:', message.error);
            if (mainWindow) {
                mainWindow.webContents.send('ingestion-status', { status: 'error', error: message.error });
            }
        }
    });

    service.on('exit', (code) => {
        console.log(`[Main] Ingestion Service exited with code ${code}`);
    });
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    title: 'Property Management',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
  return mainWindow;
}

console.log('[DEBUG] app.on(ready) triggered');
app.whenReady().then(() => {
  console.log('[DEBUG] Inside app.whenReady handler');
  const mainWindow = createWindow();
  console.log('[DEBUG] Window created');

  startFileWatcher(async (filePath) => {
    const result = await processFile(filePath);
    if (mainWindow) {
      mainWindow.webContents.send('file-processed', result);
    }
  });

  // Start background ingestion after a small delay
  setTimeout(() => {
      runBackgroundIngestion(mainWindow);
  }, 3000);

  // Initial scan of local Thunderbird mail
  scanLocalMails((reminder) => {
    if (mainWindow) {
      mainWindow.webContents.send('mail-reminder', reminder);
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers for database operations
ipcMain.handle('get-properties', async () => {
  return propertyDB.getAll();
});

// Alias for get-all-properties
ipcMain.handle('get-all-properties', async () => {
  return propertyDB.getAll();
});

ipcMain.handle('get-property-loan', async (event, propertyId) => {
  return db.prepare('SELECT * FROM loan_details WHERE property_id = ? LIMIT 1').get(propertyId);
});

ipcMain.handle('get-pending-actions', async () => {
  // Return count of recent pipeline errors
  const errors = db.prepare(`
    SELECT COUNT(*) as count FROM property_history 
    WHERE event_type = 'PIPELINE_ERROR' 
    AND datetime(event_date) > datetime('now', '-7 days')
  `).get();
  return errors?.count || 0;
});

ipcMain.handle('get-base-dir', () => {
    return path.join(__dirname, '..', '..');
});

ipcMain.handle('get-dashboard-stats', async () => {
  return propertyDB.getDashboardStats();
});

ipcMain.handle('get-benchmarks', async () => {
  return db.prepare('SELECT * FROM market_benchmarks').all();
});

ipcMain.handle('collect-data', async () => {
  const mainWindow = BrowserWindow.getAllWindows()[0];
  runBackgroundIngestion(mainWindow);
  return { status: 'started' };
});

ipcMain.handle('get-tax-analysis', async (event, propertyId) => {
  const finances = propertyDB.getFinances(propertyId);
  return calculateTaxBenefits(finances);
});

ipcMain.handle('add-property', async (event, property) => {
  return propertyDB.create(property);
});

ipcMain.handle('get-property-history', async (event, id) => {
  return propertyDB.getPropertyHistory(id);
});

ipcMain.handle('get-property-finances', async (event, id) => {
  return propertyDB.getFinances(id);
});

ipcMain.handle('read-property-profile', async (event, propertyName) => {
    const profilePath = path.join(__dirname, '..', '..', 'PropertyManager', 'properties', propertyName, 'profile.md');
    try {
        if (fs.existsSync(profilePath)) {
            return fs.readFileSync(profilePath, 'utf-8');
        }
        return null;
    } catch (err) {
        console.error('Error reading property profile:', err);
        return null;
    }
});

ipcMain.handle('list-property-files', async (event, propertyName) => {
  const propertyDir = path.join(__dirname, '..', '..', 'PropertyManager', 'properties', propertyName);
  if (!fs.existsSync(propertyDir)) return [];
  
  const files = [];
  const scan = (dir, rel = '') => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    entries.forEach(e => {
        const full = path.join(dir, e.name);
        const r = path.join(rel, e.name);
        if (e.isDirectory()) scan(full, r);
        else files.push({ name: e.name, path: full, rel: r });
    });
  };
  scan(propertyDir);
  return files;
});

ipcMain.handle('open-file-path', async (event, filePath) => {
  return shell.openPath(filePath);
});

ipcMain.handle('read-file-content', async (event, filePath) => {
    try {
        return fs.readFileSync(filePath, 'utf-8');
    } catch (err) {
        console.error('Failed to read file:', err);
        return 'Error reading file: ' + err.message;
    }
});

ipcMain.handle('save-manual-override', async (event, { filePath, category, comment }) => {
  const stmt = db.prepare(`
    INSERT INTO manual_overrides (file_path, category, comment)
    VALUES (?, ?, ?)
    ON CONFLICT(file_path) DO UPDATE SET category=excluded.category, comment=excluded.comment
  `);
  return stmt.run(filePath, category, comment);
});

ipcMain.handle('move-file', async (event, { sourcePath, destFolder, propertyName }) => {
    try {
        const fileName = path.basename(sourcePath);
        const targetDir = path.join(__dirname, '..', '..', 'PropertyManager', 'properties', propertyName, destFolder);
        if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
        
        const targetPath = path.join(targetDir, fileName);
        fs.renameSync(sourcePath, targetPath);
        
        // Update ingested_files table if it was tracked
        db.prepare('UPDATE ingested_files SET file_path = ? WHERE file_path = ?').run(targetPath, sourcePath);
        
        return { success: true, newPath: targetPath };
    } catch (err) {
        console.error('Failed to move file:', err);
        return { success: false, error: err.message };
    }
});

ipcMain.handle('mark-irrelevant', async (event, filePath) => {
    try {
        const dir = path.dirname(filePath);
        const filename = path.basename(filePath);
        const ignoredDir = path.join(dir, '_ignored');
        
        if (!fs.existsSync(ignoredDir)) {
            fs.mkdirSync(ignoredDir, { recursive: true });
        }
        
        const destPath = path.join(ignoredDir, filename);
        fs.renameSync(filePath, destPath);
        
        // Remove from DB if tracked
        db.prepare('DELETE FROM ingested_files WHERE file_path = ?').run(filePath);
        
        console.log(`[Main] Marked as irrelevant: ${filename}`);
        return { success: true };
    } catch (err) {
        console.error('[Main] Failed to mark irrelevant:', err);
        return { success: false, error: err.message };
    }
});

ipcMain.handle('save-document-hint', async (event, { filePath, hint, propertyName }) => {
    try {
        const profilePath = path.join(__dirname, '..', '..', 'PropertyManager', 'properties', propertyName, 'profile.md');
        const filename = path.basename(filePath);
        
        const hintEntry = `\n\n> **User Hint for [${filename}]:** ${hint} (Added: ${new Date().toLocaleDateString()})\n`;
        
        fs.appendFileSync(profilePath, hintEntry, 'utf-8');
        return { success: true };
    } catch (err) {
        console.error('[Main] Failed to save hint:', err);
        return { success: false, error: err.message };
    }
});

ipcMain.handle('reset-database', async () => {
    console.log('[Main] Nuking database...');
    const dbPath = path.join(__dirname, '..', '..', 'PropertyManager', 'data', 'properties.db');
    
    try {
        // Attempt to close DB if possible (better-sqlite3 handles this sync usually)
        // db.close(); // Not exposed directly in the exported object structure used here
        
        // Hard reset approach: Delete file and relaunch
        // Note: File might be locked. If locked, we might need to rely on OS to clear it or ask user to restart.
        // But for dev mode, we can try unlink.
        
        // Since 'db' is open, we can't easily delete it without closing.
        // Let's try to execute a comprehensive DELETE.
        db.exec("PRAGMA foreign_keys = OFF");
        db.exec("DELETE FROM properties");
        db.exec("DELETE FROM tenants");
        db.exec("DELETE FROM rental_agreements");
        db.exec("DELETE FROM rent_payments");
        db.exec("DELETE FROM expenses");
        db.exec("DELETE FROM actions");
        db.exec("DELETE FROM property_valuations");
        db.exec("DELETE FROM loan_details");
        db.exec("DELETE FROM property_events");
        db.exec("DELETE FROM ingested_files");
        db.exec("DELETE FROM manual_overrides");
        db.exec("PRAGMA foreign_keys = ON");
        
        console.log('[Main] Database cleared via SQL.');
        
        // Relaunch to ensure clean state in memory
        app.relaunch();
        app.exit();
        return { success: true };
    } catch (err) {
        console.error('[Main] Failed to reset DB:', err);
        return { success: false, error: err.message };
    }
});
