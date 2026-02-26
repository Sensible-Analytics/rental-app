const { collectAllData } = require('./dataCollector');
const { db } = require('./database');

async function runIngestion() {
  console.log('[IngestionService] Starting background ingestion process...');
  try {
    const stats = await collectAllData((progress) => {
        if (process.send) {
            process.send({ type: 'INGESTION_PROGRESS', progress });
        }
    });
    console.log('[IngestionService] Ingestion complete:', stats);
    if (process.send) {
        process.send({ type: 'INGESTION_COMPLETE', stats });
    }
    process.exit(0);
  } catch (err) {
    console.error('[IngestionService] Critical Failure:', err);
    if (process.send) {
        process.send({ type: 'INGESTION_ERROR', error: err.message });
    }
    process.exit(1);
  }
}

runIngestion();
