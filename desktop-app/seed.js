const { db, propertyDB } = require('./src/main/database');

async function seedDynamic() {
  console.log('Seeding financial data for all discovered properties...');
  const properties = propertyDB.getAll();
  
  const demoBenchmarks = [
    { asset_class: 'S&P 500', year_month: '2025-12', return_rate: 10.5 },
    { asset_class: 'ASX 200', year_month: '2025-12', return_rate: 8.2 },
    { asset_class: 'Gold', year_month: '2025-12', return_rate: 12.0 }
  ];

  for (const p of properties) {
    // 1. Add sample Loan if missing
    const loanExists = db.prepare('SELECT id FROM loan_details WHERE property_id = ?').get(p.id);
    if (!loanExists) {
        const principal = p.purchase_price || 5000000;
        const rate = p.country === 'AU' ? 6.2 : 9.0;
        db.prepare(`
            INSERT INTO loan_details (property_id, lender, loan_amount, interest_rate, loan_type, monthly_repayment, start_date)
            VALUES (?, ?, ?, ?, 'Principal & Interest', ?, '2023-01-01')
        `).run(p.id, p.country === 'AU' ? 'ANZ' : 'HDFC', principal * 0.8, rate, principal * 0.005);
    }

    // 2. Add sample Rent Agreement & Payments if missing
    const agreementExists = db.prepare('SELECT id FROM rental_agreements WHERE property_id = ?').get(p.id);
    if (!agreementExists) {
        const rent = p.country === 'AU' ? 2500 : 25000;
        const res = db.prepare(`
            INSERT INTO rental_agreements (property_id, start_date, rent_amount, rent_currency)
            VALUES (?, '2023-01-01', ?, ?)
        `).run(p.id, rent, p.country === 'AU' ? 'AUD' : 'INR');
        
        const agreementId = res.lastInsertRowid;
        // Add 6 months of payments
        for (let i = 1; i <= 6; i++) {
            db.prepare(`
                INSERT INTO rent_payments (agreement_id, due_date, payment_date, amount_due, amount_paid, status)
                VALUES (?, '2025-0${i}-01', '2025-0${i}-02', ?, ?, 'paid')
            `).run(agreementId, rent, rent);
        }
    }

    // 3. Add sample Expenses if missing
    const expensesExist = db.prepare('SELECT id FROM expenses WHERE property_id = ?').get(p.id);
    if (!expensesExist) {
        db.prepare(`
            INSERT INTO expenses (property_id, category, date, amount, description)
            VALUES (?, 'Utilities', '2025-01-15', ?, 'Electricity Bill')
        `).run(p.id, p.country === 'AU' ? 200 : 2000);
    }
  }

  // 4. Benchmarks
  demoBenchmarks.forEach(b => {
    db.prepare(`
        INSERT OR IGNORE INTO market_benchmarks (asset_class, year_month, return_rate)
        VALUES (@asset_class, @year_month, @return_rate)
    `).run(b);
  });

  console.log(`Seeding complete for ${properties.length} properties.`);
}

seedDynamic();
