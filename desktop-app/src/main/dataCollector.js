console.log('[DEBUG] Loading dataCollector.js dependencies...');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { db, propertyDB } = require('./database');
const { scanLocalMails } = require('./thunderbirdScanner');
const { processFile } = require('./fileProcessor');
const { parseNotionPropertyTable } = require('./notionParser');

const PERSONAL_PROPS_DIR = path.join(os.homedir(), 'personal', 'properties');
const INTERNAL_PROPS_BASE = path.join(__dirname, '..', '..', 'PropertyManager', 'properties');
const NOTION_EXPORT_DIR = path.join(PERSONAL_PROPS_DIR, 'ExportBlock-5b2c04ae-5dc8-4e05-b069-b3808c93dbbb-Part-1');

const EXCLUDED_PROPERTIES = ['101-11 Australia Avenue', 'search', 'ExportBlock-5b2c04ae-5dc8-4e05-b069-b3808c93dbbb-Part-1'];

function generatePropertyProfileMD(property, finances = null) {
    let md = `# ${property.name}\n\n`;
    md += `## Overview\n`;
    md += `- **Address**: ${property.address || 'N/A'}\n`;
    md += `- **Country**: ${property.country || 'N/A'}\n`;
    md += `- **Status**: ${property.status || 'Active'}\n`;
    
    // Property-Specific Characteristics (from user input)
    if (property.name.includes('3A Sushila')) {
        md += `\n## Special Characteristics (3A Sushila)\n`;
        md += `- **Tenancy**: Tenanted since 2024 (Primary tenant for 2 years).\n`;
        md += `- **Rent Breakdown**: 10,000 INR (Rent) + 2,000 INR (Maintenance) = **12,000 INR Total**.\n`;
        md += `- **Management**: Managed directly by owner (No Property Manager).\n`;
    } else if (property.name.includes('5A Jain Swadesh')) {
        md += `\n## Special Characteristics (5A Jain Swadesh)\n`;
        md += `- **Acquisition**: Purchased in 2015-16.\n`;
        md += `- **Status**: Registration is **COMPLETE**.\n`;
        md += `- **Management**: Property Manager **REMOVED** (previously managed until 2 years ago).\n`;
    } else if (property.name.includes('D503') || property.name.includes('Palava')) {
        md += `\n## Special Characteristics (Palava Nyasia D503)\n`;
        md += `- **Tenancy**: Young couple living there for **4 years**.\n`;
        md += `- **Management Costs**: 3,500 INR/month (via MyGate.com).\n`;
        md += `- **Maintenance**: 13,500 INR per **QUARTER** (1,500/mo + 1,000/mo components).\n`;
    } else if (property.name.includes('Belysa') || property.name.includes('Blacktown')) {
        md += `\n## Special Characteristics (Blacktown Belysa)\n`;
        md += `- **Rental Income**: $630 per week.\n`;
        md += `- **Loan Structure**: 1. Home Loan ($500k) | 2. Equity Loan ($200k).\n`;
        md += `- **Issues**: Building has significant light/structure problems.\n`;
    } else if (property.name.includes('UDAAN')) {
        md += `\n## Legal Case Context (UDAAN High Court)\n`;
        md += `- **Legal Representation**: Senior Advocate Vastavaiya (High Court).\n`;
        md += `- **Case Detail**: Got interim order for **Utkin**. DOP keys relation to artist case.\n`;
        md += `- **Current Status**: Cases (Booking/ESK) are aggressive and dragging on.\n`;
    }

    if (property.purchase_date) md += `- **Purchase Date**: ${property.purchase_date}\n`;
    if (property.purchase_price) md += `- **Purchase Price**: ${property.purchase_price.toLocaleString()}\n`;
    if (property.current_value) md += `- **Current Valuation**: ${property.current_value.toLocaleString()}\n`;
    
    if (finances) {
        md += `\n## Financial Brief\n`;
        md += `- **Interest Rate**: ${finances.interest_rate || 'N/A'}%\n`;
        md += `- **Monthly Repayment**: ${finances.monthly_repayment || 'N/A'}\n`;
        md += `- **Weekly Rent**: ${property.weekly_rent || 'N/A'}\n`;
    }
    
    md += `\n## IDS & Metadata\n`;
    if (property.municipal_tax_id) md += `- **Municipal Tax ID**: ${property.municipal_tax_id}\n`;
    if (property.society_id) md += `- **Society ID**: ${property.society_id}\n`;
    if (property.electricity_id) md += `- **Electricity ID**: ${property.electricity_id}\n`;
    
    return md;
}

function extractMetadataToJson(filePath, category, ocrData = null) {
    return {
        path: filePath,
        category: category,
        processed_at: new Date().toISOString(),
        ocr_result: ocrData,
        system_tags: [category, path.extname(filePath).slice(1)]
    };
}

function updatePropertyProfileWithExtraction(propertyName, category, ocrData) {
    if (!ocrData || (!ocrData.amount && !ocrData.date)) return;

    const profilePath = path.join(INTERNAL_PROPS_BASE, propertyName, 'profile.md');
    if (!fs.existsSync(profilePath)) return;

    let content = fs.readFileSync(profilePath, 'utf8');
    const fact = `- **Extracted ${category.toUpperCase()}**: ${ocrData.amount ? 'Amount: ' + ocrData.amount : ''} | Date: ${ocrData.date} | Ref: ${path.basename(ocrData.fileName || '')}`;
    
    // Simple check to avoid duplicates
    if (content.includes(fact)) return;

    // Append to a "Recent Extractions" section or just at the end
    if (content.includes('## Recent Extractions')) {
        content = content.replace('## Recent Extractions', `## Recent Extractions\n${fact}`);
    } else {
        content += `\n\n## Recent Extractions\n${fact}`;
    }

    fs.writeFileSync(profilePath, content);
    console.log(`[Profile Update] Added fact to ${propertyName} profile.`);
}

function emailToMarkdown(mail) {
    let md = `---\n`;
    md += `subject: "${mail.subject}"\n`;
    md += `date: ${mail.date ? new Date(mail.date).toISOString() : new Date().toISOString()}\n`;
    md += `from: "${mail.from || 'Unknown'}"\n`;
    md += `type: email\n`;
    md += `---\n\n`;
    md += `# ${mail.subject}\n\n`;
    md += `${mail.text || mail.body || 'No content'}\n`;
    return md;
}

console.log('[DEBUG] dataCollector.js dependencies loaded');

async function collectAllData(onProgress) {
    console.log('[DEBUG] collectAllData called');
    console.log('Starting intelligent local data collection with OCR and Notion Sync...');
    const stats = { propertiesFound: 0, filesCopied: 0, emailsProcessed: 0 };

    if (!fs.existsSync(PERSONAL_PROPS_DIR)) {
        console.error('Source directory ~/personal/properties not found');
        return stats;
    }

    // 1. Sync Properties from Folders
    console.log(`Scanning ${PERSONAL_PROPS_DIR} for property folders...`);
    const propertyFolders = fs.readdirSync(PERSONAL_PROPS_DIR, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory());

    let processedCount = 0;
    for (const folder of propertyFolders) {
        const propertyName = folder.name;
        
        // Skip excluded properties and generic system folders
        if (EXCLUDED_PROPERTIES.some(p => propertyName.includes(p)) || propertyName.startsWith('.')) {
            console.log(`Skipping folder: ${propertyName}`);
            continue;
        }

        console.log(`Processing property folder: ${propertyName}`);
        stats.propertiesFound++;
        
        // Progress update
        if (onProgress) {
            onProgress({ 
                type: 'PROPERTY_START', 
                property: propertyName, 
                index: processedCount, 
                total: propertyFolders.length 
            });
        }

        // Ensure property exists in DB
        let property = db.prepare('SELECT * FROM properties WHERE name = ?').get(propertyName);
        if (!property) {
            console.log(`Adding new property to DB: ${propertyName}`);
            const result = db.prepare(`
                INSERT INTO properties (name, status) VALUES (?, 'active')
            `).run(propertyName);
            property = { id: result.lastInsertRowid, name: propertyName };
        }

        // 2. Generate/Update Property Profile MD
        const profileMD = generatePropertyProfileMD(property);
        const profilePath = path.join(INTERNAL_PROPS_BASE, propertyName, 'profile.md');
        if (!fs.existsSync(path.dirname(profilePath))) fs.mkdirSync(path.dirname(profilePath), { recursive: true });
        fs.writeFileSync(profilePath, profileMD);

        // 3. Recursively Ingest Files with Taxonomy Mapping & OCR
        const propertySourcePath = path.join(PERSONAL_PROPS_DIR, propertyName);
        console.log(`Ingesting content for: ${propertyName}...`);
        await ingestWithTaxonomy(propertySourcePath, propertyName, property.id, stats, "folders");
        
        processedCount++;
        if (onProgress) {
            onProgress({ 
                type: 'PROPERTY_COMPLETE', 
                property: propertyName, 
                stats: { filesCopied: stats.filesCopied } 
            });
        }
    }

    // 3. Scan Supplementary Folders (Downloads, Desktop)
    const extraDirs = [
        path.join(os.homedir(), 'Downloads'),
        path.join(os.homedir(), 'Desktop')
    ];
    for (const dir of extraDirs) {
        if (fs.existsSync(dir)) {
            await scanAndIngestFilesSimple(dir, stats);
        }
    }

    // 4. Scan Thunderbird Mails (Improved with folder context)
    const properties = propertyDB.getAll();
    if (onProgress) onProgress({ type: 'PHASE_START', phase: 'Thunderbird' });
    scanLocalMails((mail) => {
        const matchedProperty = findPropertyMatch(mail.subject + ' ' + (mail.text || ''), properties);
        if (matchedProperty) {
            // Stage 1: Raw Archival
            const rawDir = path.join(INTERNAL_PROPS_BASE, matchedProperty.name, 'raw_data', 'emails');
            if (!fs.existsSync(rawDir)) fs.mkdirSync(rawDir, { recursive: true });

            const mdContent = emailToMarkdown(mail);
            const fileName = `mail_${new Date(mail.date || Date.now()).getTime()}.md`;
            const rawPath = path.join(rawDir, fileName);
            fs.writeFileSync(rawPath, mdContent);
            
            trackPropertyEvent(matchedProperty.id, 'PIPELINE_STAGED', `Email Archived: ${mail.subject}`, mail.date || new Date().toISOString());

            // Stage 2 & 3: Extraction & Classification (Emails are already MD)
            const targetDir = path.join(INTERNAL_PROPS_BASE, matchedProperty.name, 'legal', 'emails');
            if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

            const targetPath = path.join(targetDir, fileName);
            fs.copyFileSync(rawPath, targetPath);
            
            trackPropertyEvent(matchedProperty.id, 'PIPELINE_CLASSIFIED', `Email Classified: legal/emails`, mail.date || new Date().toISOString());

            stats.emailsProcessed++;
            trackPropertyEvent(matchedProperty.id, 'PIPELINE_FINALIZED', `Email Sync Complete: ${mail.subject}`, mail.date || new Date().toISOString());
        }
    });

    // 5. Notion Metadata Sync
    if (onProgress) onProgress({ type: 'PHASE_START', phase: 'Notion' });
    await syncNotionMetadata();

    // 6. Perform Internal Cleanup (Re-categorize misclassified files)
    if (onProgress) onProgress({ type: 'PHASE_START', phase: 'Cleanup' });
    await performInternalCleanup(stats);

    console.log(`Intelligent OCR Collection complete: ${stats.propertiesFound} properties, ${stats.filesCopied} files, ${stats.emailsProcessed} emails.`);
    return stats;
}

async function syncNotionMetadata() {
    const notionMetaFile = path.join(NOTION_EXPORT_DIR, 'Property d117b71efb394c958ba66bd5d3c9e370.md');
    if (!fs.existsSync(notionMetaFile)) {
        console.log('Notion export file not found, skipping metadata sync.');
        return;
    }

    console.log('Syncing metadata from Notion export...');
    const notionProperties = parseNotionPropertyTable(notionMetaFile);
    const dbProperties = propertyDB.getAll();

    for (const nProp of notionProperties) {
        const matched = findPropertyMatch(nProp.rawName, dbProperties);
        if (matched) {
            console.log(`Updating metadata for property: ${matched.name} (from Notion: ${nProp.rawName})`);
            db.prepare(`
                UPDATE properties SET 
                    municipal_tax_id = ?, 
                    society_id = ?, 
                    electricity_id = ?, 
                    notes = ? 
                WHERE id = ?
            `).run(
                nProp.municipalTaxId, 
                nProp.societyId, 
                nProp.electricityId, 
                `Rent: ${nProp.rentInfo || ''} | Loan: ${nProp.loanInfo || ''}`,
                matched.id
            );

            // Regenerate Profile MD after metadata sync
            const updatedProp = propertyDB.getById(matched.id);
            const pMD = generatePropertyProfileMD(updatedProp);
            const pPath = path.join(INTERNAL_PROPS_BASE, matched.name, 'profile.md');
            if (!fs.existsSync(path.dirname(pPath))) fs.mkdirSync(path.dirname(pPath), { recursive: true });
            fs.writeFileSync(pPath, pMD);
        }
    }
}

async function performInternalCleanup(stats) {
    if (!fs.existsSync(INTERNAL_PROPS_BASE)) return;
    
    const propFolders = fs.readdirSync(INTERNAL_PROPS_BASE, { withFileTypes: true })
        .filter(d => d.isDirectory());

    for (const prop of propFolders) {
        const propPath = path.join(INTERNAL_PROPS_BASE, prop.name);
        // Scan all subfolders (income, expenses, finances, etc.)
        const subfolders = fs.readdirSync(propPath, { withFileTypes: true })
            .filter(d => d.isDirectory());

        for (const sub of subfolders) {
            const subPath = path.join(propPath, sub.name);
            const files = fs.readdirSync(subPath, { withFileTypes: true })
                .filter(f => f.isFile());

            for (const file of files) {
                if (file.name.startsWith('.')) continue;
                const filePath = path.join(subPath, file.name);

                // Check for manual override first
                const override = db.prepare('SELECT category FROM manual_overrides WHERE file_path = ?').get(filePath);
                let correctCategory = override ? override.category : mapToTaxonomy(sub.name + '/' + file.name, file.name);
                
                // If no override and it's in a sensitive spot, try OCR
                if (!override && (sub.name === 'income' || sub.name === 'expenses' || sub.name === 'misc')) {
                    try {
                        const ocrData = await processFile(filePath);
                        if (ocrData.category !== 'UNKNOWN') {
                            correctCategory = normalizeCategory(ocrData.category);
                        }
                    } catch (e) { /* ignore */ }
                }

                if (correctCategory !== sub.name && correctCategory !== 'misc') {
                    const targetDir = path.join(propPath, correctCategory);
                    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
                    
                    const targetPath = path.join(targetDir, file.name);
                    if (!fs.existsSync(targetPath)) {
                        console.log(`Moving misclassified file: ${file.name} from ${sub.name} to ${correctCategory}`);
                        fs.renameSync(filePath, targetPath);
                    }
                }
            }
        }
    }
}

async function retryProcessFile(filePath, maxRetries = 3) {
    let lastError = null;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await processFile(filePath);
        } catch (err) {
            lastError = err;
            console.warn(`    OCR Retry ${i + 1}/${maxRetries} for ${path.basename(filePath)} failed: ${err.message}`);
            if (i < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
        }
    }
    throw lastError;
}

async function ingestWithTaxonomy(dirPath, propertyName, propertyId, stats, source, relativeSubPath = "") {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const currentRelativePath = path.join(relativeSubPath, entry.name);

        console.log(`[FILECHECK] ${currentRelativePath}`);

        if (entry.isDirectory()) {
            await ingestWithTaxonomy(fullPath, propertyName, propertyId, stats, source, currentRelativePath);
        } else if (entry.isFile()) {
            if (entry.name.startsWith('.')) continue; // skip hidden files
            
            console.log(`    Mapping: ${entry.name}`);
            
            // Checkpoint: Skip if already ingested
            const alreadyIngested = db.prepare('SELECT id FROM ingested_files WHERE file_path = ?').get(fullPath);
            if (alreadyIngested) {
                console.log(`    Skipping: ${entry.name} (Already Ingested)`);
                continue;
            }

            // Stage 1: Raw Archival
            const rawDir = path.join(INTERNAL_PROPS_BASE, propertyName, 'raw_data', source);
            if (!fs.existsSync(rawDir)) fs.mkdirSync(rawDir, { recursive: true });
            const rawPath = path.join(rawDir, entry.name);
            if (!fs.existsSync(rawPath)) {
                fs.copyFileSync(fullPath, rawPath);
                trackPropertyEvent(propertyId, 'PIPELINE_STAGED', `Raw Archived: ${entry.name}`, new Date().toISOString());
            }

            // Stage 2: OCR/Extraction
            console.log(`    Running OCR for: ${entry.name}...`);
            let ocrData = null;
            try {
                ocrData = await retryProcessFile(fullPath);
                trackPropertyEvent(propertyId, 'PIPELINE_EXTRACTED', `Text Extracted: ${entry.name}`, new Date().toISOString());
            } catch (err) {
                console.error(`    Critical Extraction Failure for ${entry.name}:`, err.message);
                trackPropertyEvent(propertyId, 'PIPELINE_ERROR', `Extraction Failed: ${entry.name} (${err.message})`, new Date().toISOString());
                // Fallback: minimal metadata to allow pipeline to continue
                ocrData = { category: 'UNKNOWN', amount: null, date: new Date().toISOString().split('T')[0] };
            }

            // Stage 3: Classification
            const override = db.prepare('SELECT category FROM manual_overrides WHERE file_path = ?').get(fullPath);
            let category = override ? override.category : mapToTaxonomy(currentRelativePath, entry.name);
            
            if (!override && category === 'misc' && ocrData.category !== 'UNKNOWN') {
                category = normalizeCategory(ocrData.category);
            }
            trackPropertyEvent(propertyId, 'PIPELINE_CLASSIFIED', `Classified as ${category}: ${entry.name}`, new Date().toISOString());

            // Stage 4: Finalization
            const targetDir = path.join(INTERNAL_PROPS_BASE, propertyName, category);
            if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

            const targetPath = path.join(targetDir, entry.name);
            if (!fs.existsSync(targetPath)) {
                fs.copyFileSync(fullPath, targetPath);
                stats.filesCopied++;

                // Track as event
                const eventDate = (ocrData && ocrData.date) ? ocrData.date : new Date().toISOString();
                const description = `${category.toUpperCase()} Finalized: ${entry.name} ${ocrData && ocrData.amount ? '(Amount: ' + ocrData.amount + ')' : ''}`;
                trackPropertyEvent(propertyId, 'PIPELINE_FINALIZED', description, eventDate);
                
                // Save JSON Sidecar (Import from previous context)
                const jsonSidecar = extractMetadataToJson(fullPath, category, ocrData);
                fs.writeFileSync(targetPath + '.json', JSON.stringify(jsonSidecar, null, 2));

                // Update Profile with new facts
                updatePropertyProfileWithExtraction(propertyName, category, { ...ocrData, fileName: entry.name });

                // Record in checkpoint table
                db.prepare('INSERT INTO ingested_files (file_path, property_id, category, processed_at) VALUES (?, ?, ?, ?)').run(
                    fullPath, propertyId, category, new Date().toISOString()
                );
            }
        }
    }
}

function trackPropertyEvent(propertyId, type, description, date) {
    try {
        db.prepare(`
            INSERT INTO property_events (property_id, event_type, description, event_date)
            VALUES (?, ?, ?, ?)
        `).run(propertyId, type, description, date);
    } catch (e) {
        console.error(`Failed to track property event for property ${propertyId}:`, e.message);
    }
}

function normalizeCategory(ocrCategory) {
    const map = {
        'ELECTRICITY_BILL': 'expenses',
        'GAS_BILL': 'expenses',
        'BANK_STATEMENT': 'finances'
    };
    return map[ocrCategory] || 'misc';
}

async function scanAndIngestFilesSimple(dir, stats) {
    const properties = propertyDB.getAll();
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.isFile() && !entry.name.startsWith('.')) {
            const matchedProperty = findPropertyMatch(entry.name, properties);
            if (matchedProperty) {
                const category = mapToTaxonomy(entry.name, entry.name);
                const targetDir = path.join(INTERNAL_PROPS_BASE, matchedProperty.name, category);
                if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

                const targetPath = path.join(targetDir, entry.name);
                if (!fs.existsSync(targetPath)) {
                    fs.copyFileSync(path.join(dir, entry.name), targetPath);
                    stats.filesCopied++;
                }
            }
        }
    }
}

function findPropertyMatch(text, properties) {
    const lowerText = text.toLowerCase();
    return properties.find(p => {
        const pName = p.name.toLowerCase();
        // Support dash and comma based names
        return lowerText.includes(pName) || 
               pName.split(/[\s,-]+/).some(word => word.length > 3 && lowerText.includes(word));
    });
}

function mapToTaxonomy(relPath, fileName) {
    const fullSearchPath = relPath.toLowerCase();
    const name = fileName.toLowerCase();
    
    // Finances (Bank, Statements, Loan Providers, Mortgage)
    if (fullSearchPath.includes('bank') || fullSearchPath.includes('statement') || 
        fullSearchPath.includes('hdfc') || fullSearchPath.includes('icici') || 
        fullSearchPath.includes('anz') || fullSearchPath.includes('lic') ||
        fullSearchPath.includes('loan') || fullSearchPath.includes('mortgage') ||
        fullSearchPath.includes('interest') || fullSearchPath.includes('repayment') ||
        fullSearchPath.includes('daf') || fullSearchPath.includes('valuation')) {
        return 'finances';
    }

    // Income (Rental, Rent, Deposit, Receipt)
    if (fullSearchPath.includes('rental') || fullSearchPath.includes('rent') || 
        fullSearchPath.includes('tenant') || fullSearchPath.includes('deposit') ||
        fullSearchPath.includes('income')) {
        // Distinguish between rental agreement (legal) and rent payments (income)
        if (fullSearchPath.includes('agreement') || fullSearchPath.includes('lease')) return 'legal';
        return 'income';
    }

    // Expenses (Utilities, Tax, Repair, Insurance)
    if (fullSearchPath.includes('electricity') || fullSearchPath.includes('bescom') || 
        fullSearchPath.includes('gas') || fullSearchPath.includes('water') || 
        fullSearchPath.includes('bill') || fullSearchPath.includes('receipt') || 
        fullSearchPath.includes('tax') || fullSearchPath.includes('invoice') ||
        fullSearchPath.includes('repair') || fullSearchPath.includes('maintenance') ||
        fullSearchPath.includes('insurance') || fullSearchPath.includes('strata') ||
        fullSearchPath.includes('rate') || fullSearchPath.includes('council')) {
        return 'expenses';
    }

    // Legal (Court, POA, Agreements, Contracts, Settlement, Auction, DRT)
    if (fullSearchPath.includes('court') || fullSearchPath.includes('drt') || 
        fullSearchPath.includes('legal') || fullSearchPath.includes('settlement') || 
        fullSearchPath.includes('agreement') || fullSearchPath.includes('lease') || 
        fullSearchPath.includes('contract') || fullSearchPath.includes('powerofattorney') || 
        fullSearchPath.includes('poa') || fullSearchPath.includes('affidavit') ||
        fullSearchPath.includes('auction') || fullSearchPath.includes('bid') ||
        fullSearchPath.includes('sale certificate') || fullSearchPath.includes('deed')) {
        return 'legal';
    }

    // Acquisition (Possession, Registration, OC, Site Visit)
    if (fullSearchPath.includes('possession') || fullSearchPath.includes('registration') || 
        fullSearchPath.includes('oc') || fullSearchPath.includes('occupancy') || 
        fullSearchPath.includes('visit') || fullSearchPath.includes('allotment') || 
        fullSearchPath.includes('cluster')) {
        return 'acquisition';
    }

    // Media (Photos, Pics)
    if (fullSearchPath.includes('photo') || fullSearchPath.includes('pics') || 
        fullSearchPath.includes('image') || /\.(jpg|jpeg|png|gif)$/.test(name)) {
        return 'media';
    }

    // Identity (Aadhar, PAN) -> Subfolder of Legal
    if (fullSearchPath.includes('aadhar') || fullSearchPath.includes('adhar') || 
        fullSearchPath.includes('pan card') || fullSearchPath.includes('passport')) {
        return 'legal/identity';
    }
    
    return 'misc';
}

module.exports = { 
    collectAllData, 
    handleSync: collectAllData,
    // Exported for testing and mapping extensibility
    ingestWithTaxonomy,
    findPropertyMatch,
    mapToTaxonomy
};
