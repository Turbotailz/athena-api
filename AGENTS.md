# Athena API - Agent Context

## 1. Mission & Philosophy
**Goal**: Create the definitive **Open Source API** for Overwatch heroes, items, abilities, and player stats, filling the gap left by Blizzard's lack of public data.

- **Community-First**: Data is crowd-sourced and verified by players.
- **Open Access**: Everything is free. Data is available via REST API, NPM package, and raw JSON.
- **Legal Compliance**: Strictly adheres to Blizzard's [Fan Content Policy](https://www.blizzard.com/en-us/legal/2068564f-f427-4c1c-8664-c107c90b34d5/blizzard-video-policy).
  - **Non-Commercial**: No paywalls, no ads, no selling assets.
  - **Disclaimer**: Mandatory "Not affiliated with Blizzard" footer on all pages.

## 2. Architecture Overview

### The "Build-Time" Database
This project uses a unique **Static Data** architecture to ensure zero latency and free hosting.
1.  **Input**: Raw JSON files in `data/` (e.g., `heroes.json`).
2.  **Process**: `npm run build-data` (`scripts/process-data.ts`) normalizes this data.
3.  **Output**: Generates a typed TypeScript file `src/data/db.ts` containing the entire database in memory.
4.  **Runtime**: The API imports this file. There is **no database connection** at runtime.

### Tech Stack
- **Framework**: Nuxt 4 (Hybrid rendering: SSG for docs, Server Routes for API).
- **Language**: TypeScript (Strict).
- **API Engine**: Nuxt Server Routes (Nitro).
- **Hosting**: Cloudflare Pages (Edge network).
- **UI**: Nuxt UI (Tailwind CSS based).

## 3. Project Structure
- `data/`: **Source of Truth**. Raw JSON files editable by the community.
- `src/data/`: **Generated Artifacts**. Do not edit `db.ts` or `types.ts` manually.
- `server/api/`: The REST API implementation.
- `content/`: Documentation pages (Markdown).
- `components/content/`: Vue components usable inside Markdown (MDC).
- `scripts/`: Build tools to process data and download images.

## 4. Key Workflows

### A. Updating Data
To add a new hero or fix a typo:
1.  Edit `data/heroes.json` (or relevant file).
2.  Run `npm run build-data` to regenerate `src/data/db.ts`.
3.  Commit both the raw JSON and the generated files.

### B. Adding API Endpoints
1.  Create or modify files in `server/api/`.
2.  Use the typed data from `src/data/db.ts`.
3.  Ensure response types are exported in `src/lib.ts` (the client SDK).

### C. Writing Documentation
1.  Create `.md` files in `content/`.
2.  Use MDC components like `::hero-list` to render dynamic data.
3.  Keep tone: Helpful, technical, and open-source focused.

## 5. Agent Guidelines
- **Port Safety**: Before starting the dev server, ALWAYS check/kill existing processes: `pkill -f "nuxt dev"`.
- **Image Handling**: Do not commit binary images in `public/images/`. The build script downloads them.
- **Dependency**: We use `npm`.
- **Formatting**: Adhere to the existing strict TypeScript configuration.

## 6. Legal & Licensing
- **License**: MIT (for the code).
- **Assets**: Proprietary to Blizzard Entertainment (Fair Use/Fan Content).
- **Attribution**: Always maintain the footer disclaimer.
