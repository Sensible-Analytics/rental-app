const fs = require('fs');
const path = require('path');
const os = require('os');

const THUNDERBIRD_BASE = path.join(os.homedir(), 'Library', 'Thunderbird', 'Profiles');

function findThunderbirdProfiles() {
    if (!fs.existsSync(THUNDERBIRD_BASE)) return [];
    return fs.readdirSync(THUNDERBIRD_BASE)
        .filter(file => fs.lstatSync(path.join(THUNDERBIRD_BASE, file)).isDirectory());
}

function scanLocalMails(callback) {
    const profiles = findThunderbirdProfiles();
    profiles.forEach(profile => {
        const profilePath = path.join(THUNDERBIRD_BASE, profile);
        // Recursively scan Mail and ImapMail
        scanDirectoryRecursive(path.join(profilePath, 'Mail'), callback);
        scanDirectoryRecursive(path.join(profilePath, 'ImapMail'), callback);
    });
}

function scanDirectoryRecursive(dirPath, callback) {
    if (!fs.existsSync(dirPath)) return;
    
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    entries.forEach(entry => {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            // Recurse into subdirectories (like .sbd)
            scanDirectoryRecursive(fullPath, callback);
        } else if (entry.isFile()) {
            // MBOX files are typically no extension or just name
            if (entry.name.endsWith('.msf')) return;
            if (entry.name === 'msgFilterRules.dat') return;
            if (entry.name === 'filterlog.html') return;
            
            // Heuristic for mbox: if it's a large file with no extension or a known folder name
            processMbox(fullPath, callback);
        }
    });
}

function processMbox(filePath, callback) {
    const stats = fs.statSync(filePath);
    const sizeInMB = stats.size / (1024 * 1024);

    if (sizeInMB > 100) {
        console.warn(`[Thunderbird] Skipping oversized mailbox file (${sizeInMB.toFixed(2)} MB): ${filePath}. Memory limit exceeded.`);
        return;
    }

    console.log(`[Thunderbird] Scanning mailbox (${sizeInMB.toFixed(1)} MB): ${path.basename(filePath)}`);
    
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const emails = content.split(/^From /m);

        emails.forEach(email => {
            const lowerEmail = email.toLowerCase();
            
            // Detection Logic
            let detected = null;
            const labels = extractLabels(email);

            if (lowerEmail.includes('statement') && (lowerEmail.includes('ready') || lowerEmail.includes('available'))) {
                detected = {
                    type: 'REMINDER_STATEMENT',
                    subject: extractSubject(email),
                    bank: detectBank(email),
                    date: new Date().toISOString(),
                    labels
                };
            } else if (lowerEmail.includes('rent') && lowerEmail.includes('paid')) {
                detected = {
                    type: 'RENT_CONFIRMATION',
                    subject: extractSubject(email),
                    text: email.substring(0, 500),
                    labels
                };
            } else if (labels.length > 0) {
                // Even if not a standard statement/rent email, if it has labels, report it
                detected = {
                    type: 'LABELED_COMMUNICATION',
                    subject: extractSubject(email),
                    text: email.substring(0, 500),
                    labels
                };
            }

            if (detected && callback) {
                callback(detected);
            }
        });
    } catch (e) {
        console.error(`[Thunderbird] Error processing ${filePath}: ${e.message}`);
    }
}

function extractLabels(email) {
    const match = email.match(/^X-Mozilla-Keys: (.*)$/m);
    if (!match) return [];
    return match[1].split(' ').filter(k => k.length > 0);
}

function extractSubject(email) {
    const match = email.match(/^Subject: (.*)$/m);
    return match ? match[1] : 'No Subject';
}

function detectBank(email) {
    if (email.toLowerCase().includes('hdfc')) return 'HDFC';
    if (email.toLowerCase().includes('anz')) return 'ANZ';
    if (email.toLowerCase().includes('commonwealth')) return 'CBA';
    return 'Unknown Bank';
}

module.exports = { scanLocalMails };
