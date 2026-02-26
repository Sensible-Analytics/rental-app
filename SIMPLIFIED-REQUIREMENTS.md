# PROPERTY MANAGEMENT APP - SIMPLIFIED REQUIREMENTS
## Local macOS Desktop Application
## Version: 2.0 - Revised for Local Deployment
## Date: February 1, 2026

---

## EXECUTIVE SUMMARY

### What Changed
**FROM**: Cloud-based web application with mobile apps
**TO**: Local macOS desktop application running entirely on your MacBook

### Core Philosophy
- **Local-First**: All data stored on your MacBook (SQLite database)
- **Maximum Automation**: Auto-import from files, emails, WhatsApp, bank/utility portals
- **Two Primary Goals**:
  1. **Bird's Eye View Dashboard**: Instantly see property status and next actions needed
  2. **Financial Analysis**: Deep cost analysis and ROI per property

### Technology Simplified
- **Single Desktop App**: Electron or native macOS (Swift)
- **Local Database**: SQLite (all data on your Mac)
- **No Cloud Dependency**: Works offline, data stays with you
- **File Watchers**: Auto-detect downloads and process them
- **Portal Automation**: Scripts to login and fetch data from utility/bank websites

---

## 1. APPLICATION ARCHITECTURE (SIMPLIFIED)

### Option A: Electron App (Recommended for faster development)
```
┌─────────────────────────────────────────────────────────┐
│         Property Management Desktop App (macOS)         │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Frontend UI (React + TypeScript)                  │ │
│  │  - Dashboard, Property Views, Reports              │ │
│  └────────────────────────────────────────────────────┘ │
│                          │                              │
│  ┌────────────────────────▼──────────────────────────┐  │
│  │  Main Process (Node.js)                           │  │
│  │  - File System Watchers                           │  │
│  │  - Email Integration (Gmail API)                  │  │
│  │  - WhatsApp Export Parser                         │  │
│  │  - PDF/Image OCR (Tesseract)                      │  │
│  │  - Automation Scripts (Playwright for portals)    │  │
│  └────────────────────────────────────────────────────┘  │
│                          │                              │
│  ┌────────────────────────▼──────────────────────────┐  │
│  │  Local SQLite Database                            │  │
│  │  ~/PropertyManager/data/properties.db             │  │
│  └────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Option B: Native macOS App (Swift + SwiftUI)
- Better macOS integration (faster, native feel)
- More complex development
- Superior performance

### Data Storage Location
```
~/PropertyManager/
├── data/
│   └── properties.db           # SQLite database
├── documents/                  # All uploaded/imported docs
│   ├── properties/
│   ├── tenants/
│   ├── expenses/
│   └── receipts/
├── imports/                    # Auto-watch folder
│   ├── downloads/             # Monitor ~/Downloads
│   ├── email-exports/
│   └── whatsapp-exports/
├── logs/
└── config.json
```

---

## 2. CORE FEATURES (SIMPLIFIED & PRIORITIZED)

### PRIORITY 1: Bird's Eye View Dashboard

#### Main Dashboard Layout
```
┌─────────────────────────────────────────────────────────────┐
│  PROPERTY PORTFOLIO OVERVIEW                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Total Val │  │Monthly   │  │This Month│  │Actions   │   │
│  │₹2.5Cr +  │  │Income    │  │Expenses  │  │Needed    │   │
│  │$800K     │  │₹2.5L+$3K │  │₹45K+$1.2K│  │⚠ 5       │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                              │
│  PROPERTIES AT A GLANCE                                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ India (7 properties)                                   │ │
│  │ ✓ 3A Sushila, Ranchi      Rent: ₹15K   Due: 5 Feb    │ │
│  │ ✓ 5A Jain Swadesh, B'lore Rent: ₹25K   Due: 1 Feb    │ │
│  │ ⚠ 603 Shree Ram, Ranchi   Rent: ₹18K   OVERDUE 3 days│ │
│  │ ✓ D503 Nyasia, Mumbai     Rent: ₹22K   Paid ✓        │ │
│  │ ⚠ Vaishishtha, Prayagraj  LEGAL CASE - Next: 15 Feb  │ │
│  │ ✓ Shop Konnagar, Kolkata  Rent: ₹12K   Due: 10 Feb   │ │
│  │ ⏸ JP Green, Noida         UNDER LITIGATION           │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Australia (4 properties)                               │ │
│  │ ✓ Belysa, Blacktown       Rent: $450/w  Due: 3 Feb   │ │
│  │ ✓ 1 Aus Ave, Olympic Park Rent: $550/w  Paid ✓       │ │
│  │ ✓ 11 Aus Ave, Olympic Prk Rent: $500/w  Due: 7 Feb   │ │
│  │ 🏗 Fraser Rise, Melbourne  CONSTRUCTION - Est: Jun 26 │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  UPCOMING ACTIONS (Next 30 Days)                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ ⚠ TODAY                                                │ │
│  │   • Follow up rent - Shree Ram Regency (3 days late)  │ │
│  │ 📅 Feb 5 (4 days)                                      │ │
│  │   • Rent due - 3A Sushila Apartment                   │ │
│  │   • Property tax payment - Jain Swadesh              │ │
│  │ 📅 Feb 10 (9 days)                                     │ │
│  │   • Strata levy due - 1 Australia Avenue             │ │
│  │   • AC servicing due - D503 Nyasia                   │ │
│  │ 📅 Feb 15 (14 days)                                    │ │
│  │   • Court hearing - Vaishishtha Vinayak (DRT)        │ │
│  │ 📅 Mar 1 (28 days)                                     │ │
│  │   • Insurance renewal - Belysa, Blacktown            │ │
│  │   • Lease expiry - Tenant Keivan (Jain Swadesh)      │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  RECENT ACTIVITY (Last 7 Days)                              │
│  • Feb 1: Electricity bill imported - D503 Nyasia (₹850)   │
│  • Jan 31: Rent received - 1 Australia Ave ($550) ✓         │
│  • Jan 30: Maintenance expense - Jain Swadesh (₹3,200)     │
│  • Jan 29: Bank statement imported - 45 transactions        │
│  • Jan 28: WhatsApp bill detected - Gas bill (₹450)        │
└─────────────────────────────────────────────────────────────┘
```

#### Action Reminder System
**Automatic Detection of Needed Actions**:
- ⚠️ **Overdue rent** (red alert)
- 📅 **Upcoming rent due dates** (5-day advance)
- 💰 **Unpaid expenses** (bills imported but not paid)
- 📄 **Expiring documents** (insurance, lease agreements, 30-day notice)
- 🔧 **Pending maintenance** (requests not closed)
- ⚖️ **Legal deadlines** (court dates, submission deadlines)
- 🏦 **Loan payments due**
- 📊 **Tax filing reminders** (based on financial year)

### PRIORITY 2: Financial Analysis & Cost Tracking

#### Property Financial Dashboard (Per Property)
```
┌─────────────────────────────────────────────────────────────┐
│  5A - JAIN SWADESH, BANGALORE - FINANCIAL ANALYSIS         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  QUICK STATS (Current Month - Jan 2026)                     │
│  Rental Income: ₹25,000  |  Expenses: ₹8,450  |  Net: ₹16,550│
│                                                              │
│  YEAR-TO-DATE (FY 2025-26)                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Income:          ₹2,75,000  (11 months paid)         │   │
│  │ Expenses:        ₹1,12,450                           │   │
│  │   - Property Tax:     ₹15,000                        │   │
│  │   - Society Fees:     ₹33,000 (₹3,000/mo x 11)      │   │
│  │   - Electricity:      ₹18,500                        │   │
│  │   - Repairs:          ₹32,500                        │   │
│  │   - Other:            ₹13,450                        │   │
│  │ Net Profit:      ₹1,62,550                           │   │
│  │ ROI (Annual):    5.4% (Based on ₹30L valuation)     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  EXPENSE BREAKDOWN (Pie Chart)                              │
│       Society Fees: 29% ████████████                        │
│       Repairs: 29% ████████████                             │
│       Electricity: 16% ██████                               │
│       Property Tax: 13% █████                               │
│       Other: 12% ████                                       │
│                                                              │
│  EXPENSE TREND (Last 12 Months - Bar Chart)                 │
│  ₹40K ┤                                                     │
│  ₹30K ┤     █                    █                         │
│  ₹20K ┤  █  █     █              █                         │
│  ₹10K ┤  █  █  █  █  █  █  █  █  █  █  █  █              │
│   ₹0K └─────────────────────────────────────────────────    │
│       Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec Jan      │
│                                                              │
│  COST PER CATEGORY (Comparison with Budget)                 │
│  Property Tax:    ₹15,000 / ₹15,000  [100%] ████████████   │
│  Society Fees:    ₹33,000 / ₹36,000  [92%]  █████████▒▒    │
│  Electricity:     ₹18,500 / ₹15,000  [123%] ████████████★  │
│  Repairs:         ₹32,500 / ₹20,000  [163%] ████████████★★ │
│  (★ = Over budget)                                          │
│                                                              │
│  PROFITABILITY METRICS                                      │
│  • Rental Yield: 11% (Annual rent / Property value)        │
│  • Cash Flow: +₹14,800/month (after all expenses)          │
│  • Occupancy: 100% (365/365 days)                          │
│  • Expense Ratio: 41% (Expenses / Income)                  │
│  • Break-even: Already profitable (no loan)                │
│                                                              │
│  ALERTS & INSIGHTS                                          │
│  ⚠️ Electricity cost 23% above budget - investigate         │
│  ⚠️ Repair costs high - major plumbing work in Oct          │
│  ✓ Society fees under budget                                │
│  💡 Consider rent increase - market rate ₹28K-30K           │
└─────────────────────────────────────────────────────────────┘
```

#### Portfolio-Wide Financial Comparison
```
┌─────────────────────────────────────────────────────────────┐
│  PROPERTY PERFORMANCE COMPARISON (FY 2025-26)               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Property               Income    Expense   Net     ROI     │
│  ────────────────────────────────────────────────────────   │
│  Jain Swadesh, B'lore   ₹2.75L    ₹1.12L   ₹1.63L  5.4%    │
│  D503 Nyasia, Mumbai    ₹2.64L    ₹0.98L   ₹1.66L  4.8%    │
│  Shree Ram, Ranchi      ₹2.16L    ₹0.75L   ₹1.41L  6.2% ★  │
│  Sushila Apt, Ranchi    ₹1.80L    ₹0.52L   ₹1.28L  5.1%    │
│  Shop Konnagar, Kolkata ₹1.44L    ₹0.38L   ₹1.06L  7.8% ★★ │
│  ────────────────────────────────────────────────────────   │
│  Belysa, Blacktown      $23.4K    $8.2K    $15.2K   4.2%    │
│  1 Aus Ave, Sydney      $28.6K    $9.8K    $18.8K   4.6%    │
│  11 Aus Ave, Sydney     $26.0K    $9.1K    $16.9K   4.4%    │
│  ────────────────────────────────────────────────────────   │
│  TOTAL (India)          ₹10.79L   ₹3.75L   ₹7.04L   5.6%    │
│  TOTAL (Australia)      $78.0K    $27.1K   $50.9K   4.4%    │
│  TOTAL (Combined in ₹)  ₹17.19L   ₹5.98L   ₹11.21L  5.2%    │
│                                                              │
│  (★ = Best ROI  |  Exchange Rate: 1 AUD = ₹55)             │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. AUTOMATION FEATURES (MAXIMUM AUTOMATION)

### Automation Goal: Minimal Manual Data Entry

#### 3.1 File Import Automation

**Auto-Monitor Downloads Folder**
```javascript
// Watch ~/Downloads for new files
watchFolder('~/Downloads', {
  patterns: [
    '*.pdf',      // Bills, statements, agreements
    '*.xlsx',     // Bank statements, expense reports
    '*.csv',      // Bank transaction exports
    '*.jpg',      // Scanned bills, WhatsApp images
    '*.png'       // Screenshots
  ]
})

// Auto-detect and categorize
onNewFile(file => {
  if (isPDF(file)) {
    const text = OCR.extract(file)
    
    if (containsKeywords(text, ['electricity', 'BESCOM', 'bill'])) {
      categorize(file, 'UTILITY_BILL')
      property = detectProperty(text)  // Find property by address/meter number
      createExpense({
        type: 'Electricity',
        property: property,
        amount: extractAmount(text),
        dueDate: extractDueDate(text),
        document: file
      })
      notify('New electricity bill imported for ' + property)
    }
    
    if (containsKeywords(text, ['rent receipt', 'rental agreement'])) {
      categorize(file, 'RENTAL_DOCUMENT')
      // Process accordingly
    }
    
    if (containsKeywords(text, ['bank statement', 'account summary'])) {
      categorize(file, 'BANK_STATEMENT')
      parseAndImportTransactions(file)
    }
  }
})
```

**Smart File Recognition**:
- **Electricity Bills**: Keywords (BESCOM, Tata Power, BSES, etc.), meter numbers, property address
- **Gas Bills**: LPG provider names, consumer numbers
- **Water Bills**: Municipal corporation names, connection IDs
- **Property Tax**: Holding tax number, PID, receipt keywords
- **Bank Statements**: Bank logos, account numbers, transaction tables
- **Rent Receipts**: "Rent for", tenant names, property addresses
- **Invoices**: GST numbers, invoice numbers, vendor names
- **Insurance**: Policy numbers, premium, renewal dates
- **Strata Notices**: Strata plan numbers, levy amounts

**Processing Pipeline**:
1. File detected in ~/Downloads
2. OCR extraction (if PDF/image)
3. Text analysis + keyword matching
4. Property identification (address/account number matching)
5. Data extraction (amount, date, vendor)
6. Auto-create expense/income entry
7. Move file to appropriate folder in ~/PropertyManager/documents/
8. Notify user: "New electricity bill imported for Jain Swadesh - ₹850"

#### 3.2 Email Integration (Gmail API)

**Auto-Scan Inbox for Bills & Statements**
```javascript
// Run every hour or real-time with Gmail Pub/Sub
scanGmail({
  labels: ['INBOX', 'Bills'],
  from: [
    '*@bescom.org',           // Electricity providers
    '*@mahanagarcas.com',     // Gas
    '*bank*.com',             // Banks
    '*@startacommunity.org.au', // Strata
    'noreply@*'               // Generic bills
  ],
  subject: [
    'bill', 'invoice', 'statement', 'payment due',
    'rent receipt', 'strata levy', 'council rates'
  ],
  hasAttachment: true
})

onEmailMatch(email => {
  email.attachments.forEach(attachment => {
    if (isPDF(attachment) || isImage(attachment)) {
      downloadAndProcess(attachment)
      // Same pipeline as file import
    }
  })
  
  // Mark email as processed
  gmail.addLabel(email.id, 'PropertyManager/Processed')
})
```

**Supported Email Patterns**:
- Electricity providers (BESCOM, Tata Power, BSES, Reliance Energy, etc.)
- Gas companies (Mahanagar Gas, Indraprastha Gas, etc.)
- Water utilities
- Banks (HDFC, SBI, ICICI, ANZ, CBA, NAB, Westpac)
- Strata management companies
- Property managers
- Insurance companies
- Government portals (property tax receipts)

**Email Actions**:
- Download attachments → Process → Create expense
- Parse email body (if no attachment) for amount/date
- Link email thread to property
- Store email for reference

#### 3.3 WhatsApp Export Parser

**WhatsApp Desktop/iPhone Backup Integration**
```javascript
// WhatsApp stores chats in ~/Library/Application Support/WhatsApp/
// Or user can export chats manually

parseWhatsAppExport({
  chatName: 'Property Manager - Mumbai',
  exportFile: '~/PropertyManager/imports/whatsapp-exports/pm-mumbai.txt'
})

// Extract images with bills
whatsapp.images.forEach(image => {
  if (looksLikeBill(image)) {  // ML model or heuristics
    OCR.process(image)
    // Same pipeline
  }
})

// Parse text messages for key info
whatsapp.messages.forEach(msg => {
  if (contains(msg.text, 'rent paid', 'payment done')) {
    // Auto-mark rent as paid
  }
  if (contains(msg.text, 'maintenance', 'repair needed')) {
    // Create maintenance request
  }
})
```

**WhatsApp Sources**:
- **Manual Export**: User exports chat (Settings → Export Chat)
- **Image Recognition**: Detect bill images from WhatsApp image folder
- **Keyword Extraction**: Parse messages for rent confirmations, issues

#### 3.4 Bank Portal Automation (Playwright/Selenium)

**Automated Bank Login & Statement Download**
```javascript
// User configures once: bank login credentials (stored encrypted)
const bankAccounts = [
  { bank: 'HDFC', username: 'user@example.com', password: '***' },
  { bank: 'SBI', accountNumber: '12345', password: '***' },
  { bank: 'ANZ', username: 'user', password: '***' }
]

// Schedule: Daily at 6 AM
scheduledTask('daily', '06:00', async () => {
  for (const account of bankAccounts) {
    const browser = await playwright.launch({ headless: true })
    
    // Navigate to bank website
    await browser.goto(account.bank.loginURL)
    
    // Login (using saved credentials)
    await page.fill('#username', account.username)
    await page.fill('#password', decrypt(account.password))
    await page.click('#login-button')
    
    // Navigate to statements
    await page.click('Statements')
    
    // Download last 30 days
    await page.selectDateRange(last30Days())
    await page.click('Download as PDF')
    
    // Wait for download
    const downloadPath = await page.waitForDownload()
    
    // Import transactions
    parseAndImportTransactions(downloadPath)
    
    await browser.close()
  }
  
  notify('Bank statements updated for all accounts')
})
```

**Supported Banks**:
- India: HDFC, SBI, ICICI, Axis, Kotak, PNB
- Australia: ANZ, Commonwealth, NAB, Westpac

**Security**:
- Credentials stored encrypted (macOS Keychain)
- Optional: Use bank APIs instead of scraping (if available)
- 2FA support (user completes in browser window)

#### 3.5 Utility Portal Automation

**Auto-Fetch Utility Bills**
```javascript
// Similar to bank automation
const utilityAccounts = [
  { provider: 'BESCOM', consumerNumber: '123456', password: '***' },
  { provider: 'Mahanagar Gas', bpNumber: '789012', password: '***' }
]

scheduledTask('weekly', 'Monday 06:00', async () => {
  for (const utility of utilityAccounts) {
    // Login to utility portal
    // Navigate to bills section
    // Download latest bill
    // Import and create expense
  }
})
```

**Utility Portals**:
- Electricity: BESCOM (Bangalore), Tata Power (Mumbai), BSES (Delhi), etc.
- Gas: Mahanagar Gas, IGL, etc.
- Water: Local municipal corporations
- Australia: Energy Australia, Origin, AGL, etc.

#### 3.6 Rent Payment Auto-Detection

**Bank Transaction Matching**
```javascript
// After importing bank transactions
bankTransactions.forEach(txn => {
  if (txn.type === 'CREDIT') {
    // Check if amount matches expected rent
    const matchingRent = findExpectedRent({
      amount: txn.amount,
      date: txn.date,
      tolerance: 50  // ±₹50 or ±$5
    })
    
    if (matchingRent) {
      markRentAsPaid(matchingRent, txn)
      generateRentReceipt(matchingRent)
      notify(`Rent received for ${matchingRent.property.name}`)
    }
  }
  
  if (txn.type === 'DEBIT') {
    // Check if matches recorded expense
    const matchingExpense = findExpenseByAmount({
      amount: txn.amount,
      dateRange: [txn.date - 7days, txn.date + 7days]
    })
    
    if (matchingExpense) {
      markExpenseAsPaid(matchingExpense, txn)
    }
  }
})
```

**Matching Logic**:
- Amount-based matching (within tolerance)
- Date proximity (±7 days window)
- Reference/description matching (tenant name, property address)
- Pattern recognition (recurring amounts = likely rent)

---

## 4. DATA STRUCTURE (SIMPLIFIED)

### SQLite Database Schema (Local)

```sql
-- Single file: ~/PropertyManager/data/properties.db

-- Properties
CREATE TABLE properties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    country TEXT CHECK(country IN ('IN', 'AU')),
    address TEXT,
    city TEXT,
    state TEXT,
    purchase_date DATE,
    purchase_price REAL,
    current_value REAL,
    status TEXT DEFAULT 'active',
    notes TEXT
);

-- Tenants
CREATE TABLE tenants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    whatsapp TEXT
);

-- Rental Agreements
CREATE TABLE rental_agreements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    property_id INTEGER REFERENCES properties(id),
    tenant_id INTEGER REFERENCES tenants(id),
    start_date DATE,
    end_date DATE,
    rent_amount REAL,
    rent_currency TEXT,
    rent_frequency TEXT DEFAULT 'monthly',
    status TEXT DEFAULT 'active'
);

-- Rent Payments
CREATE TABLE rent_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agreement_id INTEGER REFERENCES rental_agreements(id),
    due_date DATE,
    payment_date DATE,
    amount_due REAL,
    amount_paid REAL,
    status TEXT DEFAULT 'pending',
    bank_transaction_id INTEGER
);

-- Expenses
CREATE TABLE expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    property_id INTEGER REFERENCES properties(id),
    category TEXT NOT NULL,
    date DATE,
    amount REAL,
    currency TEXT,
    vendor TEXT,
    description TEXT,
    payment_status TEXT DEFAULT 'pending',
    payment_date DATE,
    document_path TEXT,
    is_auto_imported BOOLEAN DEFAULT 0
);

-- Bank Transactions
CREATE TABLE bank_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_name TEXT,
    date DATE,
    description TEXT,
    amount REAL,
    type TEXT CHECK(type IN ('debit', 'credit')),
    matched_to_type TEXT,
    matched_to_id INTEGER
);

-- Documents
CREATE TABLE documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT,
    entity_id INTEGER,
    file_path TEXT,
    file_type TEXT,
    uploaded_date DATE,
    ocr_text TEXT
);

-- Actions/Reminders
CREATE TABLE actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    property_id INTEGER REFERENCES properties(id),
    action_type TEXT,
    title TEXT,
    due_date DATE,
    status TEXT DEFAULT 'pending',
    priority TEXT DEFAULT 'normal',
    notes TEXT
);

-- Settings (app config)
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT
);
```

---

## 5. TECHNOLOGY STACK (SIMPLIFIED FOR LOCAL)

### Development Stack

**Option 1: Electron (Recommended)**
- **Frontend**: React + TypeScript
- **Backend**: Node.js (Electron Main Process)
- **Database**: SQLite (better-sqlite3)
- **UI Framework**: Material-UI or Ant Design
- **Charts**: Recharts or Chart.js
- **File Watching**: chokidar
- **OCR**: tesseract.js (JavaScript) or node-tesseract-ocr
- **PDF Parsing**: pdf-parse, pdfjs-dist
- **Excel Parsing**: xlsx, exceljs
- **Browser Automation**: Playwright
- **Email**: Gmail API (googleapis npm package)

**Dependencies**:
```json
{
  "dependencies": {
    "electron": "^28.0.0",
    "react": "^18.2.0",
    "better-sqlite3": "^9.0.0",
    "chokidar": "^3.5.3",
    "tesseract.js": "^5.0.0",
    "pdf-parse": "^1.1.1",
    "xlsx": "^0.18.5",
    "playwright": "^1.40.0",
    "googleapis": "^128.0.0",
    "recharts": "^2.10.0"
  }
}
```

**Option 2: Native macOS (Swift + SwiftUI)**
- **UI**: SwiftUI
- **Database**: SQLite (GRDB.swift or SQLite.swift)
- **OCR**: Vision framework (Apple's native)
- **PDF**: PDFKit (Apple native)
- **File Watching**: FSEvents (macOS native)
- **Browser Automation**: AppleScript or WebDriver
- **Better Performance**: Native macOS app, faster, lower memory

### File Structure
```
PropertyManager/
├── src/
│   ├── main/              # Electron main process (Node.js)
│   │   ├── database.js
│   │   ├── fileWatcher.js
│   │   ├── emailSync.js
│   │   ├── ocr.js
│   │   ├── bankAutomation.js
│   │   └── scheduler.js
│   ├── renderer/          # React UI
│   │   ├── components/
│   │   ├── pages/
│   │   └── utils/
│   └── shared/
├── data/                  # Created at runtime in ~/PropertyManager
├── documents/
└── package.json
```

---

## 6. USER INTERFACE (SIMPLIFIED SCREENS)

### Main Window Layout
```
┌──────────────────────────────────────────────────────────────┐
│  Property Manager                    🔄 Sync  ⚙️ Settings  👤 │
├────────────┬─────────────────────────────────────────────────┤
│            │                                                  │
│ NAVIGATION │  MAIN CONTENT AREA                             │
│            │                                                  │
│ 🏠 Dashboard│  (Dashboard, Property Details, Reports, etc.)  │
│            │                                                  │
│ 🏘️ Properties│                                                │
│            │                                                  │
│ 👤 Tenants │                                                  │
│            │                                                  │
│ 💰 Finances│                                                  │
│   ▸ Income │                                                  │
│   ▸ Expenses│                                                 │
│   ▸ Reports│                                                  │
│            │                                                  │
│ 📄 Documents│                                                 │
│            │                                                  │
│ 🔔 Actions │                                                  │
│            │                                                  │
│ ⚙️ Settings│                                                  │
│   ▸ Import │                                                  │
│   ▸ Accounts│                                                 │
│   ▸ Backup │                                                  │
└────────────┴─────────────────────────────────────────────────┘
```

### Key Screens

1. **Dashboard** (Bird's Eye View) - As shown in Priority 1
2. **Property Detail** - Full info, tenant, financials, documents
3. **Financial Analysis** - Per property cost breakdown
4. **Expenses** - List, add, categorize, auto-imported items
5. **Actions/Reminders** - To-do list, calendar view
6. **Import Center** - Monitor auto-imports, manual upload
7. **Reports** - P&L, Tax reports, Portfolio summary
8. **Settings** - Configure automation, accounts, preferences

---

## 7. DEVELOPMENT ROADMAP (SIMPLIFIED)

### Phase 1: Core App (2 months)
**Weeks 1-2**: Setup & Database
- Electron project setup
- SQLite database schema
- Basic CRUD for properties, tenants, expenses
- Simple UI scaffolding

**Weeks 3-4**: Dashboard & Property Management
- Dashboard with property cards
- Property detail view
- Tenant management
- Rental agreement tracking

**Weeks 5-6**: Financial Tracking
- Expense entry form
- Rent payment tracking
- Basic reports (P&L per property)
- Charts and visualizations

**Weeks 7-8**: Documents & Actions
- Document upload and storage
- OCR integration (Tesseract)
- Action/reminder system
- **Deliverable**: Working app with manual data entry

### Phase 2: Automation (1.5 months)
**Weeks 9-10**: File Import Automation
- File watcher for ~/Downloads
- PDF parser for bills
- Auto-categorization logic
- Image OCR for scanned bills

**Weeks 11-12**: Email Integration
- Gmail API integration
- Auto-scan inbox for bills
- Attachment download and processing
- Email-based expense import

**Weeks 13-14**: Bank & WhatsApp
- Bank statement CSV parser
- WhatsApp export parser
- Transaction matching algorithm
- **Deliverable**: 80% automated data collection

### Phase 3: Portal Automation & Polish (1 month)
**Weeks 15-16**: Portal Automation
- Playwright scripts for banks
- Utility portal automation
- Scheduled tasks (daily sync)

**Weeks 17-18**: Polish & Testing
- UI/UX improvements
- Bug fixes
- Performance optimization
- User testing with real data
- **Deliverable**: Production-ready app

### Total Development Time: 4.5 months

---

## 8. COST ESTIMATE (SIMPLIFIED)

### Development Team (Smaller Team, Local Focus)
| Role                  | Months | Rate      | Total    |
|-----------------------|--------|-----------|----------|
| Full-Stack Developer  | 4.5    | $8,000    | $36,000  |
| UI/UX Designer        | 1      | $6,000    | $6,000   |
| QA/Testing            | 1      | $5,000    | $5,000   |
| **Total**             |        |           | **$47,000** |

### Tools & Services (One-Time + 6 Months)
| Item                  | Cost     |
|-----------------------|----------|
| Development Tools     | $500     |
| Google Cloud (OCR)    | $300     |
| Design Assets         | $500     |
| **Total**             | **$1,300**  |

### **TOTAL PROJECT COST**: **$48,300** (much cheaper than cloud version)

### Ongoing Costs (After Launch)
- **None** (runs locally, no server costs)
- Optional: Google OCR API (~$20/month for heavy use)

---

## 9. KEY BENEFITS OF LOCAL APPROACH

✅ **Data Privacy**: All data stays on your MacBook
✅ **No Subscription**: One-time cost, own the software
✅ **Offline First**: Works without internet (except email sync)
✅ **Fast Performance**: No network latency
✅ **Lower Cost**: No cloud hosting fees (~$9K/year saved)
✅ **Simple Backup**: Just copy ~/PropertyManager folder
✅ **Complete Control**: Customize as needed

---

## 10. NEXT STEPS

1. **Approve Simplified Requirements** ✓
2. **Choose Technology**: Electron vs. Native macOS
3. **Hire Developer(s)**: 1 full-stack + 1 designer
4. **Week 1**: Project kickoff, setup environment
5. **Month 2**: Working prototype with manual entry
6. **Month 4**: Automation features complete
7. **Month 5**: Production release

---

**Status**: SIMPLIFIED & READY FOR IMPLEMENTATION
**Recommendation**: Use Electron for faster development, easier maintenance
**Timeline**: 4.5 months to production-ready app
**Budget**: ~$50K (vs. $600K+ for cloud version)
