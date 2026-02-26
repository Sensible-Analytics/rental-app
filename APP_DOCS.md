# Landlord App: Documentation

## Overview
The Landlord App is a premium local-first property management suite designed for landlords to automate document sorting, financial tracking, and tenant communication.

## Key Features

### 1. Intelligent Sync Engine (The "Brain")
The app scans your `~/personal/properties` and `Thunderbird` folders to build a comprehensive picture of your portfolio.
- **Auto-Categorization**: Uses a taxonomy engine to map files to `Legal`, `Finances`, `Income`, and `Expenses`.
- **OCR Integration**: Automatically reads text from scanned JPEGs and PDFs to extract totals and dates.
- **Process Isolation**: All heavy lifting happens in a separate background process to keep the UI smooth.

### 2. Financial Dashboard
- **Asset Overview**: Real-time valuation and rental income tracking.
- **ROI Analysis**: Automatic tax benefit calculation and negative gearing insights.
- **Market Benchmarks**: Compare your property performance against Gold, S&P 500, and ASX.

### 3. Chronological View
Every property has a "Timeline" view. 
- **Event Tracking**: See when files were ingested, when emails arrived, and when rent was recorded.

## Getting Started

### Installation
1. Clone the repository.
2. Run `yarn install`.
3. Start the app: `yarn dev`.

### Data Ingestion
- **Drop Zone**: Drop any new property document into `PropertyManager/imports`, and it will be automatically analyzed and sorted.
- **Thunderbird**: Tag your property-related emails in Thunderbird with labels; the app will pull them into the legal history.

## Technical Maintenance
- **Database**: Uses SQLite located at `PropertyManager/data/properties.db`.
- **Logs**: Startup logs are visible in the terminal to help debug ingestion bottlenecks.
