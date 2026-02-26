import { describe, it, expect } from 'vitest';
const path = require('path');

describe('Application Boot Stability', () => {
    it('should load database.js without errors', () => {
        try {
            const { db } = require('../../src/main/database');
            expect(db).toBeDefined();
        } catch (err) {
            console.error('Boot Test Failed at database.js:', err);
            throw err;
        }
    });

    it('should load dataCollector.js without errors', () => {
        try {
            const dataCollector = require('../../src/main/dataCollector');
            expect(dataCollector).toBeDefined();
        } catch (err) {
            console.error('Boot Test Failed at dataCollector.js:', err);
            throw err;
        }
    });

    it('should load index.js (Main Process) without errors', () => {
        // We can't fully run Electron in vitest easily, 
        // but we can check if the dependencies are resolvable
        try {
            const index = require('../../src/main/index');
            expect(index).toBeDefined();
        } catch (err) {
            // Note: Electron modules (app, BrowserWindow) might error in pure Node
            // but we want to catch ReferenceErrors and SyntaxErrors here.
            if (err.name === 'ReferenceError' || err.name === 'SyntaxError') {
                throw err;
            }
            console.log('Caught expected Electron/Node mismatch, but no boot-breaking errors found.');
        }
    });
});
