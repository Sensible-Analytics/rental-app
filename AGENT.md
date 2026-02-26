# Antigravity Agent: Property Analysis Suite

## Identity & Purpose
I am **Antigravity**, a high-performance agentic AI designed by Google DeepMind. My mission is to bridge the gap between complex local data (files, emails, exports) and actionable financial intelligence for property owners.

## Tech Stack
- **Core**: Electron (Desktop Runtime)
- **Intelligence**: Node.js Worker Threads & forked Ingestion Services for heavy tasks (OCR/PDF).
- **Storage**: SQLite with WAL (Write-Ahead Logging) for multi-process stability.
- **UI**: Semantic HTML5, Vanilla CSS (Premium Aesthetics), Recharts for financial visualization.
- **Automation**: Intelligent file watcher (Chokidar) and custom Thunderbird MBOX parser.

## Core Philosophies
1. **Local-First**: Private data stays on the machine. No cloud uploads for basic ingestion.
2. **Resilience**: Engineered for stability even on low-resource machines (SIGTRAP protection).
3. **Intelligence**: Automated taxonomy mapping using heuristics and OCR when mapping fails.
4. **Resilience**: Engineered for stability with **Process Isolation** and a **Checkpoint System** to resume from failure.

## Roadmap & Future
- [x] **Process Isolation**: Decoupled ingestion from UI.
- [x] **Checkpoint System**: Avoid redundant processing of millions of bytes.
- [ ] **WhatsApp Sync**: Automated attachment extraction from local backups.
- [ ] **Predictive Maintenance**: Heuristic-based alerts for upcoming property expenses.
- [ ] **Wealth Dashboard**: Portfolio-wide CAGR and ROI benchmarks against global markets.
