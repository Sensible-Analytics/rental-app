import { describe, it, expect } from 'vitest';
const { processFile } = require('../../src/main/fileProcessor');
const path = require('path');
const fs = require('fs');

describe('OCR & PDF Ingestion (Worker Thread)', () => {
  it('should extract text from a property PDF using pdf-parse in worker', async () => {
    const pdfPath = '/Users/prabhatranjan/personal/properties/2410-1 Australia Avenue/Loan/281792 oth DAF.pdf';
    if (!fs.existsSync(pdfPath)) return; // Skip if file not found locally
    
    const result = await processFile(pdfPath);
    expect(result.fileName).toBe('281792 oth DAF.pdf');
    expect(result.rawText).toContain('Prabhat Ranjan');
    expect(result.category).toBe('UNKNOWN'); // Current mapping logic
  }, 30000);

  it('should extract text from an image using Tesseract.js in worker', async () => {
    const imgPath = '/Users/prabhatranjan/personal/properties/202-Vaishishtha Vinayak/DRT/DRT_court.jpg';
    if (!fs.existsSync(imgPath)) return;
    
    const result = await processFile(imgPath);
    expect(result.rawText.toLowerCase()).toContain('recovery');
  }, 60000);
});
