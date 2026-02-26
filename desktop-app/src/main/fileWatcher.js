const chokidar = require('chokidar');
const path = require('path');
const os = require('os');
const fs = require('fs');

const DOWNLOADS_PATH = path.join(__dirname, '..', '..', 'PropertyManager', 'imports');

function startFileWatcher(callback) {
  const watcher = chokidar.watch(DOWNLOADS_PATH, {
    ignored: [/(^|[\/\\])\../, /(^|[\/\\])_ignored/], // ignore dotfiles and _ignored folder
    persistent: true,
    awaitWriteFinish: {
      stabilityThreshold: 2000,
      pollInterval: 100
    }
  });

  watcher
    .on('add', async (filePath) => {
      console.log(`New file detected in Downloads: ${filePath}`);
      
      const ext = path.extname(filePath).toLowerCase();
      if (['.pdf', '.jpg', '.jpeg', '.png', '.xlsx', '.csv'].includes(ext)) {
        if (callback) {
          callback(filePath);
        }
      }
    })
    .on('error', error => console.error(`Watcher error: ${error}`));

  console.log(`Watching for new files in ${DOWNLOADS_PATH} (Drop Zone)`);
  return watcher;
}

module.exports = { startFileWatcher };
