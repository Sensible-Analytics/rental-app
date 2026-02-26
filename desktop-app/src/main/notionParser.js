const fs = require('fs');
const path = require('path');

/**
 * Parses the property summary markdown from Notion export
 * @param {string} filePath Path to the Property markdown file
 */
function parseNotionPropertyTable(filePath) {
    if (!fs.existsSync(filePath)) return [];
    
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const properties = [];
    
    // Simple table parser for Notion MD format
    // Looking for lines like | Property | ... |
    let inTable = false;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('| Property |')) {
            inTable = true;
            i++; // skip separator line | --- |
            continue;
        }
        
        if (inTable && line.startsWith('|')) {
            const cells = line.split('|').map(c => c.trim()).filter(c => c !== '');
            if (cells.length < 2) continue;
            
            // Cells: [Property, Municipal Tax, Society, Electricity, Rent, Value/Loan]
            const rawName = cells[0].replace(/\*\*/g, '');
            if (rawName.toLowerCase() === 'totals' || rawName.toLowerCase() === 'property') continue;

            properties.push({
                rawName,
                municipalTaxId: cells[1] ? cells[1].split('\n')[0].replace(/\[|\]/g, '') : null,
                societyId: cells[2] || null,
                electricityId: cells[3] || null,
                rentInfo: cells[4] || null,
                loanInfo: cells[5] || null
            });
        } else if (inTable && line === '') {
            // End of first table, but Notion MD might have multiple tables or text
            // For now we assume one main property table
        }
    }
    
    return properties;
}

module.exports = { parseNotionPropertyTable };
