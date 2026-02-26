# QUICK START IMPLEMENTATION GUIDE
## Building Your Local Property Manager for macOS

---

## RECOMMENDED APPROACH: Electron + React

### Why Electron?
- ✅ **Faster Development**: Use web technologies (React)
- ✅ **Easier to Maintain**: JavaScript/TypeScript throughout
- ✅ **Rich Ecosystem**: npm packages for everything
- ✅ **Cross-platform**: Could port to Windows later if needed
- ✅ **Developer Available**: Many React/Node developers

---

## STEP-BY-STEP GETTING STARTED

### Week 1: Setup & Proof of Concept

#### Day 1-2: Project Setup
```bash
# Create project
npm create electron-app property-manager -- --template=webpack-typescript

cd property-manager

# Install core dependencies
npm install --save \
  better-sqlite3 \
  chokidar \
  tesseract.js \
  pdf-parse \
  xlsx \
  googleapis \
  recharts \
  @mui/material \
  @emotion/react \
  @emotion/styled

# Install dev dependencies
npm install --save-dev \
  @types/better-sqlite3 \
  @types/node
```

#### Day 3: Database Setup
```typescript
// src/main/database.ts
import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

const DB_PATH = path.join(app.getPath('home'), 'PropertyManager', 'data', 'properties.db');

export const db = new Database(DB_PATH);

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS properties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    country TEXT CHECK(country IN ('IN', 'AU')),
    address TEXT,
    city TEXT,
    state TEXT,
    purchase_price REAL,
    current_value REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    property_id INTEGER REFERENCES properties(id),
    category TEXT NOT NULL,
    date DATE,
    amount REAL,
    currency TEXT,
    vendor TEXT,
    description TEXT,
    document_path TEXT,
    is_auto_imported BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Add other tables...
`);

// CRUD operations
export const propertyDB = {
  getAll: () => db.prepare('SELECT * FROM properties WHERE status = ?').all('active'),
  getById: (id: number) => db.prepare('SELECT * FROM properties WHERE id = ?').get(id),
  create: (property: any) => {
    const stmt = db.prepare(`
      INSERT INTO properties (name, country, address, city, state, purchase_price, current_value)
      VALUES (@name, @country, @address, @city, @state, @purchase_price, @current_value)
    `);
    return stmt.run(property);
  },
  update: (id: number, property: any) => {
    const stmt = db.prepare(`
      UPDATE properties SET name = @name, address = @address, current_value = @current_value
      WHERE id = @id
    `);
    return stmt.run({ ...property, id });
  }
};

export const expenseDB = {
  getByProperty: (propertyId: number) => 
    db.prepare('SELECT * FROM expenses WHERE property_id = ? ORDER BY date DESC').all(propertyId),
  
  create: (expense: any) => {
    const stmt = db.prepare(`
      INSERT INTO expenses (property_id, category, date, amount, currency, vendor, description, is_auto_imported)
      VALUES (@property_id, @category, @date, @amount, @currency, @vendor, @description, @is_auto_imported)
    `);
    return stmt.run(expense);
  }
};
```

#### Day 4: File Watcher
```typescript
// src/main/fileWatcher.ts
import chokidar from 'chokidar';
import path from 'path';
import { app } from 'electron';
import { processFile } from './fileProcessor';

const DOWNLOADS_PATH = path.join(app.getPath('home'), 'Downloads');

export function startFileWatcher() {
  const watcher = chokidar.watch(DOWNLOADS_PATH, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    awaitWriteFinish: {
      stabilityThreshold: 2000,
      pollInterval: 100
    }
  });

  watcher
    .on('add', async (filePath) => {
      console.log(`New file detected: ${filePath}`);
      
      // Only process PDFs and images
      const ext = path.extname(filePath).toLowerCase();
      if (['.pdf', '.jpg', '.jpeg', '.png'].includes(ext)) {
        await processFile(filePath);
      }
    })
    .on('error', error => console.error(`Watcher error: ${error}`));

  console.log(`Watching for new files in ${DOWNLOADS_PATH}`);
}
```

#### Day 5: OCR & PDF Processing
```typescript
// src/main/fileProcessor.ts
import { createWorker } from 'tesseract.js';
import pdfParse from 'pdf-parse';
import fs from 'fs';
import path from 'path';
import { expenseDB, propertyDB } from './database';

export async function processFile(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  let text = '';

  if (ext === '.pdf') {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    text = data.text;
  } else if (['.jpg', '.jpeg', '.png'].includes(ext)) {
    const worker = await createWorker();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    const { data: { text: ocrText } } = await worker.recognize(filePath);
    await worker.terminate();
    text = ocrText;
  }

  console.log('Extracted text:', text);

  // Categorize and extract data
  const category = categorizeDocument(text);
  
  if (category === 'ELECTRICITY_BILL') {
    const expense = extractElectricityBill(text, filePath);
    if (expense) {
      expenseDB.create({
        ...expense,
        is_auto_imported: 1
      });
      console.log('Auto-imported electricity bill:', expense);
      // Send notification to UI
    }
  }
}

function categorizeDocument(text: string): string {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('bescom') || lowerText.includes('electricity bill')) {
    return 'ELECTRICITY_BILL';
  }
  if (lowerText.includes('gas bill') || lowerText.includes('mahanagar gas')) {
    return 'GAS_BILL';
  }
  if (lowerText.includes('bank statement') || lowerText.includes('account summary')) {
    return 'BANK_STATEMENT';
  }
  
  return 'UNKNOWN';
}

function extractElectricityBill(text: string, filePath: string) {
  // Simple regex patterns - improve with real bill analysis
  const amountMatch = text.match(/(?:total|amount|bill)\s*:?\s*₹?\s*(\d+(?:,\d+)*(?:\.\d{2})?)/i);
  const dateMatch = text.match(/(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/);
  
  if (!amountMatch) return null;
  
  return {
    property_id: 1, // TODO: Detect property from address in text
    category: 'Electricity',
    date: dateMatch ? parseDate(dateMatch[1]) : new Date().toISOString().split('T')[0],
    amount: parseFloat(amountMatch[1].replace(/,/g, '')),
    currency: 'INR',
    vendor: 'BESCOM', // TODO: Extract from text
    description: 'Auto-imported from ' + path.basename(filePath),
    document_path: filePath
  };
}

function parseDate(dateStr: string): string {
  // Convert various date formats to YYYY-MM-DD
  // Implement proper date parsing
  return new Date().toISOString().split('T')[0];
}
```

---

## CRITICAL AUTOMATION PATTERNS

### Pattern 1: Bill Detection & Import
```typescript
// src/main/billDetector.ts

interface BillPattern {
  keywords: string[];
  vendor?: string;
  category: string;
  amountPattern: RegExp;
  datePattern: RegExp;
  accountPattern?: RegExp;
}

const BILL_PATTERNS: BillPattern[] = [
  {
    keywords: ['bescom', 'bangalore electricity'],
    vendor: 'BESCOM',
    category: 'Electricity',
    amountPattern: /total\s*amount.*?₹\s*([\d,]+\.?\d*)/i,
    datePattern: /bill\s*date.*?(\d{2}[-/]\d{2}[-/]\d{4})/i,
    accountPattern: /consumer\s*no.*?(\d+)/i
  },
  {
    keywords: ['mahanagar gas', 'mgl'],
    vendor: 'Mahanagar Gas',
    category: 'Gas',
    amountPattern: /bill\s*amount.*?₹\s*([\d,]+\.?\d*)/i,
    datePattern: /bill\s*date.*?(\d{2}[-/]\d{2}[-/]\d{4})/i
  }
];

export function detectAndExtractBill(text: string) {
  for (const pattern of BILL_PATTERNS) {
    const matchedKeywords = pattern.keywords.some(kw => 
      text.toLowerCase().includes(kw)
    );
    
    if (matchedKeywords) {
      const amountMatch = text.match(pattern.amountPattern);
      const dateMatch = text.match(pattern.datePattern);
      const accountMatch = pattern.accountPattern ? 
        text.match(pattern.accountPattern) : null;
      
      if (amountMatch) {
        return {
          vendor: pattern.vendor || 'Unknown',
          category: pattern.category,
          amount: parseFloat(amountMatch[1].replace(/,/g, '')),
          date: dateMatch ? parseDate(dateMatch[1]) : null,
          accountNumber: accountMatch ? accountMatch[1] : null
        };
      }
    }
  }
  
  return null;
}
```

### Pattern 2: Property Matching
```typescript
// src/main/propertyMatcher.ts

export function matchPropertyFromText(text: string, accountNumber?: string) {
  const properties = propertyDB.getAll();
  
  // Strategy 1: Match by account number (most reliable)
  if (accountNumber) {
    // Store account numbers in property metadata
    const matchedProperty = properties.find(p => 
      p.utility_accounts?.some(acc => acc.number === accountNumber)
    );
    if (matchedProperty) return matchedProperty;
  }
  
  // Strategy 2: Match by address
  for (const property of properties) {
    if (property.address && text.includes(property.address)) {
      return property;
    }
  }
  
  // Strategy 3: Fuzzy match by city/landmark
  // Use string similarity algorithms
  
  return null; // Manual review needed
}
```

### Pattern 3: Bank Statement Parsing
```typescript
// src/main/bankParser.ts
import xlsx from 'xlsx';

export function parseBankStatement(filePath: string) {
  const ext = path.extname(filePath);
  
  if (ext === '.xlsx' || ext === '.xls') {
    return parseExcelStatement(filePath);
  } else if (ext === '.csv') {
    return parseCSVStatement(filePath);
  } else if (ext === '.pdf') {
    return parsePDFStatement(filePath);
  }
}

function parseExcelStatement(filePath: string) {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet);
  
  // Detect bank format (HDFC, SBI, etc. have different formats)
  const bankFormat = detectBankFormat(data);
  
  return data.map((row: any) => ({
    date: parseDate(row[bankFormat.dateColumn]),
    description: row[bankFormat.descColumn],
    debit: parseFloat(row[bankFormat.debitColumn] || 0),
    credit: parseFloat(row[bankFormat.creditColumn] || 0),
    balance: parseFloat(row[bankFormat.balanceColumn] || 0)
  }));
}

function matchRentPayment(transaction: BankTransaction) {
  const expectedRents = rentPaymentDB.getPending();
  
  for (const rent of expectedRents) {
    // Match by amount (within tolerance)
    if (Math.abs(transaction.credit - rent.amount_due) < 50) {
      // Match by date proximity (within 7 days)
      const daysDiff = Math.abs(
        new Date(transaction.date).getTime() - new Date(rent.due_date).getTime()
      ) / (1000 * 60 * 60 * 24);
      
      if (daysDiff <= 7) {
        // Match!
        rentPaymentDB.markAsPaid(rent.id, {
          payment_date: transaction.date,
          amount_paid: transaction.credit,
          bank_transaction_id: transaction.id
        });
        
        generateRentReceipt(rent);
        return true;
      }
    }
  }
  
  return false;
}
```

---

## UI IMPLEMENTATION (React)

### Dashboard Component
```typescript
// src/renderer/pages/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { Card, Grid, Typography, Alert } from '@mui/material';
import { PieChart, BarChart } from 'recharts';

export function Dashboard() {
  const [properties, setProperties] = useState([]);
  const [actions, setActions] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    // Fetch data from main process via IPC
    window.electron.ipcRenderer.invoke('get-dashboard-data').then(data => {
      setProperties(data.properties);
      setActions(data.actions);
      setStats(data.stats);
    });
  }, []);

  return (
    <div className="dashboard">
      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={3}>
          <Card>
            <Typography variant="h6">Total Value</Typography>
            <Typography variant="h4">
              ₹{stats?.totalValue.INR} + ${stats?.totalValue.AUD}
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={3}>
          <Card>
            <Typography variant="h6">Monthly Income</Typography>
            <Typography variant="h4">₹{stats?.monthlyIncome}</Typography>
          </Card>
        </Grid>

        <Grid item xs={3}>
          <Card>
            <Typography variant="h6">This Month Expenses</Typography>
            <Typography variant="h4">₹{stats?.monthlyExpenses}</Typography>
          </Card>
        </Grid>

        <Grid item xs={3}>
          <Card style={{ background: actions.length > 0 ? '#fff3cd' : '#d4edda' }}>
            <Typography variant="h6">Actions Needed</Typography>
            <Typography variant="h4" color={actions.length > 0 ? 'error' : 'success'}>
              ⚠ {actions.length}
            </Typography>
          </Card>
        </Grid>

        {/* Properties List */}
        <Grid item xs={12}>
          <Card>
            <Typography variant="h6">Properties</Typography>
            {properties.map(property => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </Card>
        </Grid>

        {/* Actions/Reminders */}
        <Grid item xs={12}>
          <Card>
            <Typography variant="h6">Upcoming Actions</Typography>
            {actions.map(action => (
              <Alert severity={action.priority === 'high' ? 'error' : 'warning'}>
                {action.title} - Due: {action.due_date}
              </Alert>
            ))}
          </Card>
        </Grid>
      </Grid>
    </div>
  );
}
```

---

## SCHEDULER FOR AUTOMATION

```typescript
// src/main/scheduler.ts
import schedule from 'node-schedule';
import { syncGmail } from './emailSync';
import { syncBankStatements } from './bankAutomation';

export function startScheduledTasks() {
  // Check for new emails every hour
  schedule.scheduleJob('0 * * * *', async () => {
    console.log('Running hourly email sync...');
    await syncGmail();
  });

  // Daily bank sync at 6 AM
  schedule.scheduleJob('0 6 * * *', async () => {
    console.log('Running daily bank sync...');
    await syncBankStatements();
  });

  // Weekly backup on Sunday at midnight
  schedule.scheduleJob('0 0 * * 0', () => {
    console.log('Running weekly backup...');
    backupDatabase();
  });

  console.log('Scheduled tasks started');
}

function backupDatabase() {
  // Copy database to backup location
  const backup_path = path.join(
    app.getPath('home'),
    'PropertyManager',
    'backups',
    `backup-${new Date().toISOString()}.db`
  );
  fs.copyFileSync(DB_PATH, backup_path);
}
```

---

## CONFIGURATION FILE

```json
// ~/PropertyManager/config.json
{
  "automation": {
    "watchDownloads": true,
    "emailSync": {
      "enabled": true,
      "frequency": "hourly",
      "accounts": [
        {
          "email": "your-email@gmail.com",
          "provider": "gmail"
        }
      ]
    },
    "bankSync": {
      "enabled": false,
      "frequency": "daily",
      "accounts": []
    }
  },
  "ocr": {
    "provider": "tesseract",
    "language": "eng"
  },
  "currency": {
    "base": "INR",
    "exchangeRate": {
      "AUD": 55
    }
  },
  "notifications": {
    "rentReminders": 5,
    "expenseAlerts": true,
    "overdueAlerts": true
  }
}
```

---

## NEXT IMMEDIATE STEPS

### This Week
1. ✅ Review simplified requirements
2. ⬜ Decide: Electron or Native Swift
3. ⬜ Setup development environment
4. ⬜ Create basic Electron app skeleton
5. ⬜ Implement SQLite database

### Week 2
1. ⬜ Build basic UI (Dashboard, Property list)
2. ⬜ CRUD operations for properties
3. ⬜ File watcher implementation
4. ⬜ PDF OCR proof-of-concept

### Week 3-4
1. ⬜ Bill detection patterns
2. ⬜ Expense auto-import
3. ⬜ Gmail integration
4. ⬜ Dashboard with real data

---

## GETTING HELP

**Hire a Developer**: Look for someone with:
- ✅ Electron + React experience
- ✅ Node.js backend skills
- ✅ SQLite database knowledge
- ✅ Experience with OCR / PDF parsing
- ✅ macOS development familiarity

**Estimated Rate**: $60-80/hour freelance or $8K/month full-time

**Where to Find**:
- Upwork / Toptal (freelance)
- AngelList (full-time)
- Local React/Node meetups

---

**YOU ARE HERE**: Requirements Complete ✓
**NEXT**: Start development or hire developer
**TIMELINE**: 4.5 months to working app
**INVESTMENT**: ~$50K total
