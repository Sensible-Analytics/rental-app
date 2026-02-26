# Project Architecture

## Project Overview

- **Files:** 661
- **Symbols:** 1611
- **Edges:** 3778
- **Languages:** javascript (341), json (79), typescript (59), tsx (50), markdown (15), yaml (14), css (6), hcl (3)

## Directory Structure

| Directory | Files | Primary Language |
|-----------|-------|------------------|
| `webapps/` | 334 | javascript |
| `services/` | 220 | javascript |
| `desktop-app/` | 28 | javascript |
| `./` | 22 | yaml |
| `e2e/` | 16 | javascript |
| `types/` | 14 | typescript |
| `cli/` | 8 | javascript |
| `.github/` | 7 | yaml |
| `terraform/` | 4 | hcl |
| `.vscode/` | 2 | json |
| `scripts/` | 1 | bash |
| `documentation/` | 1 | markdown |
| `config/` | 1 |  |
| `backup/` | 1 |  |
| `.yarn/` | 1 |  |
| `.husky/` | 1 |  |

## Entry Points

- `cli/src/index.js`
- `desktop-app/src/main/index.js`
- `services/api/src/businesslogic/index.js`
- `services/api/src/index.js`
- `services/authenticator/src/index.js`
- `services/authenticator/src/routes/index.js`
- `services/common/src/collections/index.ts`
- `services/common/src/index.ts`
- `services/emailer/src/emailparts/attachments/index.js`
- `services/emailer/src/emailparts/data/invoice/index.js`
- `services/emailer/src/emailparts/data/otp/index.js`
- `services/emailer/src/emailparts/data/rentcall/index.js`
- `services/emailer/src/emailparts/data/rentcall_last_reminder/index.js`
- `services/emailer/src/emailparts/data/rentcall_reminder/index.js`
- `services/emailer/src/emailparts/data/reset_password/index.js`
- `services/emailer/src/emailparts/recipients/invoice/index.js`
- `services/emailer/src/emailparts/recipients/otp/index.js`
- `services/emailer/src/emailparts/recipients/rentcall/index.js`
- `services/emailer/src/emailparts/recipients/rentcall_last_reminder/index.js`
- `services/emailer/src/emailparts/recipients/rentcall_reminder/index.js`
- `services/emailer/src/emailparts/recipients/reset_password/index.js`
- `services/emailer/src/index.js`
- `services/gateway/src/index.ts`
- `services/pdfgenerator/data/index.js`
- `services/pdfgenerator/data/invoice/index.js`

## Key Abstractions

Top symbols by importance (PageRank):

| Symbol | Kind | Location |
|--------|------|----------|
| `cn function cn(...inputs)` | function | `webapps/landlord/src/utils/index.js:5` |
| `useTranslation function useTranslation()` | function | `webapps/tenant/src/utils/i18n/client/useTranslation.ts:6` |
| `Map function Map({ address })` | function | `webapps/landlord/src/components/Map.js:10` |
| `log log()` | method | `services/common/src/utils/environmentconfig.ts:93` |
| `getValues getValues()` | method | `services/common/src/utils/environmentconfig.ts:85` |
| `isServer function isServer()` | function | `webapps/commonui/utils/index.js:1` |
| `isClient function isClient()` | function | `webapps/commonui/utils/index.js:5` |
| `apiFetcher const apiFetcher = () =>` | function | `webapps/landlord/src/utils/fetch.js:77` |
| `Service class Service` | class | `services/common/src/utils/service.ts:28` |
| `ServiceError class ServiceError extends Error` | class | `services/common/src/utils/serviceerror.ts:1` |
| `useFormField const useFormField = () =>` | function | `webapps/tenant/src/components/ui/form.tsx:41` |
| `getServerEnv function getServerEnv(key: string)` | function | `webapps/tenant/src/utils/env/server.ts:1` |
| `env function env(key)` | function | `webapps/commonui/utils/index.js:9` |
| `getEnv function getEnv(key: string)` | function | `webapps/tenant/src/utils/env/client.ts:5` |
| `set function set(key, value)` | function | `services/pdfgenerator/src/pdf.js:17` |

## Architecture

- **Dependency layers:** 21
- **Cycles (SCCs):** 17
- **Layer distribution:** L0: 815 symbols, L1: 252 symbols, L2: 147 symbols, L3: 89 symbols, L4: 63 symbols

## Testing

**Test directories:** `desktop-app/tests/`, `services/api/src/__tests__/`, `services/common/src/__tests__/`
- **Test files:** 12
- **Source files:** 649
- **Test-to-source ratio:** 0.02

## Coding Conventions

Follow these conventions when writing code in this project:

- **Classes:** Use `PascalCase` (100% of 17 classes)
- **Imports:** Prefer absolute imports (100% are cross-directory)
- **Test files:** *.spec.*, *.test.*

## Complexity Hotspots

Average function complexity: 5.3 (731 functions analyzed)

Functions with highest complexity (consider refactoring):

| Function | Complexity | Location |
|----------|-----------|----------|
| `ingestWithTaxonomy` | 110 | `desktop-app/src/main/dataCollector.js:346` |
| `performInternalCleanup` | 106 | `desktop-app/src/main/dataCollector.js:280` |
| `toOccupantData` | 85 | `services/api/src/managers/frontdata.js:239` |
| `toRentData` | 76 | `services/api/src/managers/frontdata.js:3` |
| `mapToTaxonomy` | 63 | `desktop-app/src/main/dataCollector.js:480` |
| `InvoiceTable` | 59 | `webapps/tenant/src/components/invoice-table.tsx:32` |
| `ContactCard` | 56 | `webapps/tenant/src/components/contact-card.tsx:4` |
| `apiFetcher` | 49 | `webapps/landlord/src/utils/fetch.js:77` |
| `askForEnvironmentVariables` | 47 | `cli/src/commands.js:395` |
| `writeDotEnv` | 47 | `cli/src/commands.js:646` |

## Domain Keywords

- **Package:** rental-app
- **Description:** The application which helps the landlords to manage their property rents.
- **Top domain terms:** property, tenant, illustration, document, rent, organization, file, tenants, status, settings, one, keys, lease, pagination, main, number, values, locale, sign, contract

## Core Modules

Most-imported modules (everything depends on these):

| Module | Imported By | Symbols Used |
|--------|-------------|--------------|
| `services/api/src/__mocks__/winston.js` | 122 files | 227 |
| `webapps/tenant/src/utils/i18n/client/useTranslation.ts` | 103 files | 221 |
| `webapps/landlord/src/utils/index.js` | 91 files | 278 |
| `cli/src/commands.js` | 86 files | 151 |
| `webapps/landlord/src/components/Map.js` | 84 files | 108 |
| `webapps/landlord/src/store/index.js` | 77 files | 157 |
| `webapps/landlord/src/components/ui/button.jsx` | 66 files | 68 |
| `types/src/common/collections.ts` | 55 files | 88 |
| `services/common/src/utils/environmentconfig.ts` | 54 files | 95 |
| `webapps/tenant/src/components/ui/use-toast.ts` | 51 files | 58 |