console.log('[DEBUG] Loading better-sqlite3...');
const Database = require('better-sqlite3');
console.log('[DEBUG] better-sqlite3 loaded');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', '..', 'PropertyManager', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'properties.db');
console.log(`[DEBUG] Opening database at: ${dbPath}`);
const db = new Database(dbPath);
console.log('[DEBUG] Database opened');

// Enable WAL mode for concurrent access
console.log('[DEBUG] Enabling WAL mode...');
db.pragma('journal_mode = WAL');
console.log('[DEBUG] WAL mode enabled');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS properties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    country TEXT CHECK(country IN ('IN', 'AU')),
    address TEXT,
    city TEXT,
    state TEXT,
    purchase_date DATE,
    purchase_price REAL,
    current_value REAL,
    municipal_tax_id TEXT,
    society_id TEXT,
    electricity_id TEXT,
    water_gas_id TEXT,
    loan_account TEXT,
    weekly_rent REAL,
    status TEXT DEFAULT 'active',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tenants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    whatsapp TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS rental_agreements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    property_id INTEGER REFERENCES properties(id),
    tenant_id INTEGER REFERENCES tenants(id),
    start_date DATE,
    end_date DATE,
    rent_amount REAL,
    rent_currency TEXT,
    rent_frequency TEXT DEFAULT 'monthly',
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS rent_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agreement_id INTEGER REFERENCES rental_agreements(id),
    due_date DATE,
    payment_date DATE,
    amount_due REAL,
    amount_paid REAL,
    status TEXT DEFAULT 'pending',
    bank_transaction_id INTEGER,
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
    payment_status TEXT DEFAULT 'pending',
    payment_date DATE,
    document_path TEXT,
    is_auto_imported BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    property_id INTEGER REFERENCES properties(id),
    action_type TEXT,
    title TEXT,
    due_date DATE,
    status TEXT DEFAULT 'pending',
    priority TEXT DEFAULT 'normal',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS property_valuations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    property_id INTEGER REFERENCES properties(id),
    valuation_date DATE,
    value REAL,
    source TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS loan_details (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    property_id INTEGER REFERENCES properties(id),
    lender TEXT,
    loan_amount REAL,
    interest_rate REAL,
    loan_type TEXT, -- 'Interest Only', 'Principal & Interest'
    monthly_repayment REAL,
    start_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tax_deductions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_name TEXT UNIQUE,
    description TEXT,
    is_deductible BOOLEAN DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS market_benchmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_class TEXT, -- 'S&P 500', 'ASX 200', 'Gold'
    year_month TEXT,
    return_rate REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS property_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    property_id INTEGER REFERENCES properties(id),
    event_type TEXT, -- 'FILE_INGESTED', 'EMAIL_SYNC', 'NOTION_SYNC', 'STATUS_CHANGE'
    description TEXT,
    event_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS ingested_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_path TEXT UNIQUE,
    property_id INTEGER REFERENCES properties(id),
    category TEXT,
    processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    file_hash TEXT,
    last_ingested DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS manual_overrides (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_path TEXT UNIQUE,
    category TEXT NOT NULL,
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  INSERT OR IGNORE INTO tax_deductions (category_name, description) VALUES 
  ('Interests', 'Mortgage interest payments'),
  ('Maintenance', 'Repairs and general upkeep'),
  ('Insurance', 'Building and landlord insurance'),
  ('Property Tax', 'Local government rates and taxes'),
  ('Depreciation', 'Building and fixture capital works');
`);

// Migration: Add missing columns if they don't exist
const columns = db.prepare("PRAGMA table_info(properties)").all();
const colNames = columns.map(c => c.name);

const missingCols = [
  { name: 'municipal_tax_id', type: 'TEXT' },
  { name: 'society_id', type: 'TEXT' },
  { name: 'electricity_id', type: 'TEXT' },
  { name: 'water_gas_id', type: 'TEXT' },
  { name: 'loan_account', type: 'TEXT' },
  { name: 'weekly_rent', type: 'REAL' }
];

missingCols.forEach(col => {
  if (!colNames.includes(col.name)) {
    console.log(`[Database] Migration: Adding column ${col.name} to properties table...`);
    db.exec(`ALTER TABLE properties ADD COLUMN ${col.name} ${col.type}`);
  }
});

// Migration for ingested_files
const ingestedCols = db.prepare("PRAGMA table_info(ingested_files)").all().map(c => c.name);
if (!ingestedCols.includes('property_id')) {
    console.log('[Database] Migration: Adding property_id to ingested_files...');
    db.exec('ALTER TABLE ingested_files ADD COLUMN property_id INTEGER');
}
if (!ingestedCols.includes('category')) {
    console.log('[Database] Migration: Adding category to ingested_files...');
    db.exec('ALTER TABLE ingested_files ADD COLUMN category TEXT');
}
if (!ingestedCols.includes('processed_at')) {
    console.log('[Database] Migration: Adding processed_at to ingested_files...');
    db.exec('ALTER TABLE ingested_files ADD COLUMN processed_at DATETIME');
}

// Seeding specific facts from user conversation
function seedSpecificFacts() {
  try {
    const properties = db.prepare('SELECT id, name FROM properties').all();
    
    properties.forEach(p => {
        // Blacktown Belysa
        if (p.name.includes('Belysa') || p.name.includes('Blacktown')) {
            db.prepare('UPDATE properties SET weekly_rent = 630 WHERE id = ?').run(p.id);
            // Add dual loans if not present
            const loans = db.prepare('SELECT id FROM loan_details WHERE property_id = ?').all(p.id);
            if (loans.length === 0) {
                db.prepare('INSERT INTO loan_details (property_id, loan_type, loan_amount) VALUES (?, ?, ?)').run(p.id, 'Home Loan', 500000);
                db.prepare('INSERT INTO loan_details (property_id, loan_type, loan_amount) VALUES (?, ?, ?)').run(p.id, 'Equity Loan', 200000);
            }
        }
        
        // Palava Nyasia
        if (p.name.includes('D503') || p.name.includes('Palava')) {
            db.prepare("UPDATE properties SET notes = 'Maintenance: 13,500/quarter | Management: 3,500/mo (MyGate)' WHERE id = ?").run(p.id);
        }

        // Udaan Legal Milestones
        if (p.name.includes('UDAAN')) {
            const events = db.prepare("SELECT id FROM property_events WHERE property_id = ? AND event_type = 'LEGAL_MILESTONE'").all(p.id);
            if (events.length === 0) {
                db.prepare(`
                    INSERT INTO property_events (property_id, event_type, description, event_date)
                    VALUES (?, 'LEGAL_MILESTONE', 'Advocate Vastavaiya: Got interim order for Utkin (High Court)', '2024-01-15')
                `).run(p.id);
                db.prepare(`
                    INSERT INTO property_events (property_id, event_type, description, event_date)
                    VALUES (?, 'LEGAL_MILESTONE', 'Aggressive proceedings: Booking/ESK case ongoing', '2024-02-01')
                `).run(p.id);
            }
        }
    });
  } catch (err) {
    console.error('[Database] Failed to seed specific facts:', err.message);
  }
}

seedSpecificFacts();

module.exports = {
  db,
  propertyDB: {
    getAll: () => db.prepare('SELECT * FROM properties WHERE status = ?').all('active'),
    getById: (id) => db.prepare('SELECT * FROM properties WHERE id = ?').get(id),
    getPropertyHistory: (id) => {
      return db.prepare(`
          SELECT event_type, description, event_date 
          FROM property_events 
          WHERE property_id = ?
          UNION ALL
          SELECT 'MILESTONE' as event_type, 'Property Purchased' as description, purchase_date as event_date
          FROM properties
          WHERE id = ? AND purchase_date IS NOT NULL
          ORDER BY event_date DESC
      `).all(id, id);
    },
    getFinances: (id) => db.prepare(`
      SELECT 
        p.*, 
        l.interest_rate, l.loan_amount,
        (SELECT SUM(amount) FROM expenses WHERE property_id = p.id) as total_expenses,
        (SELECT SUM(amount_paid) FROM rent_payments rp JOIN rental_agreements ra ON rp.agreement_id = ra.id WHERE ra.property_id = p.id) as total_income
      FROM properties p 
      LEFT JOIN loan_details l ON p.id = l.property_id
      WHERE p.id = ?
    `).get(id),
    create: (property) => {
      const stmt = db.prepare(`
        INSERT INTO properties (name, country, address, city, state, purchase_date, purchase_price, current_value)
        VALUES (@name, @country, @address, @city, @state, @purchase_date, @purchase_price, @current_value)
      `);
      return stmt.run(property);
    },
    getDashboardStats: () => {
      const stats = db.prepare(`
        SELECT 
          SUM(current_value) as total_value,
          (SELECT SUM(amount_paid) FROM rent_payments) as total_income,
          (SELECT SUM(amount) FROM expenses) as total_expenses,
          (SELECT COUNT(*) FROM properties WHERE status = 'active') as active_properties
        FROM properties WHERE status = 'active'
      `).get();
      
      // Also get breakdown by currency
      const currencyStats = db.prepare(`
        SELECT 
          country, 
          SUM(current_value) as total_value,
          (SELECT SUM(rp.amount_paid) FROM rent_payments rp JOIN rental_agreements ra ON rp.agreement_id = ra.id JOIN properties pr ON ra.property_id = pr.id WHERE pr.country = properties.country) as total_income
        FROM properties 
        GROUP BY country
      `).all();

      return { ...stats, currencyStats };
    }
  },
  tenantDB: {
    getAll: () => db.prepare('SELECT * FROM tenants').all(),
    create: (tenant) => {
      const stmt = db.prepare(`
        INSERT INTO tenants (name, email, phone, whatsapp)
        VALUES (@name, @email, @phone, @whatsapp)
      `);
      return stmt.run(tenant);
    }
  },
  expenseDB: {
    getByProperty: (propertyId) => db.prepare('SELECT * FROM expenses WHERE property_id = ?').all(propertyId),
    create: (expense) => {
      const stmt = db.prepare(`
        INSERT INTO expenses (property_id, category, date, amount, currency, vendor, description, is_auto_imported)
        VALUES (@property_id, @category, @date, @amount, @currency, @vendor, @description, @is_auto_imported)
      `);
      return stmt.run(expense);
    }
  }
};
