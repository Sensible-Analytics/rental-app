import { describe, it, expect, beforeAll } from 'vitest';
const { propertyDB } = require('../../src/main/database');
const { categorizeDocument } = require('../../src/main/documentUtils');

describe('Desktop App Core Integration', () => {
    
    it('should retrieve seeded properties from database', () => {
        const properties = propertyDB.getAll();
        expect(properties.length).toBeGreaterThan(0);
        expect(properties[0]).toHaveProperty('name');
    });

    it('should correctly categorize an electricity bill', () => {
        const text = "Your BESCOM electricity bill for JANUARY is ₹1,200";
        const category = categorizeDocument(text);
        expect(category).toBe('ELECTRICITY_BILL');
    });

    it('should correctly categorize a bank statement', () => {
        const text = "ANZ Bank Statement for Account 123456789";
        const category = categorizeDocument(text);
        expect(category).toBe('BANK_STATEMENT');
    });

});
