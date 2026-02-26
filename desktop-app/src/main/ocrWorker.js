const { parentPort, workerData } = require('worker_threads');
const path = require('path');
const fs = require('fs');
const { createWorker } = require('tesseract.js');
const pdfParse = require('pdf-parse');

async function processFile(filePath) {
  const fileName = path.basename(filePath);
  const ext = path.extname(filePath).toLowerCase();
  
  let text = '';
  try {
    if (ext === '.pdf') {
       const dataBuffer = fs.readFileSync(filePath);
       const data = await pdfParse(dataBuffer);
       text = data.text;
    } else if (['.jpg', '.jpeg', '.png'].includes(ext)) {
       const worker = await createWorker('eng');
       const { data: { text: ocrText } } = await worker.recognize(filePath);
       await worker.terminate();
       text = ocrText;
    }
  } catch (err) {
    text = fileName; // fallback
  }
  
  const category = categorizeDocument(text);
  const amountMatch = text.match(/(?:total|amount|bill|balance)\s*:?\s*[₹$]?\s*(\d+(?:,\d+)*(?:\.\d{2})?)/i);
  const dateMatch = text.match(/(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/);
  
  return {
    category,
    amount: amountMatch ? amountMatch[1].replace(/,/g, '') : null,
    date: dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0],
    rawText: text.substring(0, 500)
  };
}

const { categorizeDocument } = require('./documentUtils');

if (parentPort) {
  processFile(workerData.filePath).then(result => {
    parentPort.postMessage({ success: true, result });
  }).catch(error => {
    parentPort.postMessage({ success: false, error: error.message });
  });
}
