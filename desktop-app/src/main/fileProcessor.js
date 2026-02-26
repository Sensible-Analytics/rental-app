const path = require('path');
const fs = require('fs');
const { Worker } = require('worker_threads');

async function processFile(filePath) {
  const fileName = path.basename(filePath);
  console.log(`Offloading OCR/PDF Analysis to Worker: ${fileName}...`);
  
  return new Promise((resolve, reject) => {
    const worker = new Worker(path.join(__dirname, 'ocrWorker.js'), {
      workerData: { filePath }
    });

    worker.on('message', (message) => {
      if (message.success) {
        resolve({
          fileName,
          filePath,
          ...message.result
        });
      } else {
        reject(new Error(message.error));
      }
    });

    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
}

module.exports = { processFile };
